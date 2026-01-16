"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2, Shield, User, Eye, EyeOff } from "lucide-react"
import { login, setAuthState, type LoginCredentials } from "@/lib/auth"

export function SigninPage() {
  const [formData, setFormData] = useState<LoginCredentials>({
    username: '',
    password: '',
    role: 'admin' // Default to admin
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  // Validation
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'username':
        if (!value.trim()) return 'Username is required'
        if (value.trim().length < 3) return 'Username must be at least 3 characters'
        return ''
      case 'password':
        if (!value.trim()) return 'Password is required'
        if (value.length < 6) return 'Password must be at least 6 characters'
        return ''
      case 'role':
        if (!value) return 'Please select a role'
        return ''
      default:
        return ''
    }
  }

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    // Clear general error
    if (error) {
      setError('')
    }
  }

  const handleFieldBlur = (name: string, value: string) => {
    const error = validateField(name, value)
    setFieldErrors(prev => ({ ...prev, [name]: error }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof LoginCredentials])
      if (error) {
        errors[key] = error
      }
    })
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setError('Please fix the errors below')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await login(formData)
      
      if (result.success) {
        // Store auth state
        setAuthState(result)
        
        // Redirect to main page - AppRouter will handle showing correct interface
        window.location.href = '/'
      } else {
        setError(result.message || 'Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed due to system error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full bg-white lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 ">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign in to your account</h1>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div className="flex justify-center ">
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleFieldChange('role', value)}
                >
                  <SelectTrigger className={`w-full h-12 bg-background border-gray-200 flex justify-center text-center rounded-4xl ${fieldErrors.role ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent >
                    <SelectItem value="owner" className="text-center justify-center">
                      <div className="flex items-center gap-2">
                        {/* <Shield className="h-4 w-4 text-purple-600" /> */}
                        as Owner
                      </div>
                    </SelectItem>
                    <SelectItem value="admin" className="text-center justify-center">
                      <div className="flex items-center gap-2">
                        {/* <Shield className="h-4 w-4" /> */}
                        as Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="business" className="text-center justify-center">
                      <div className="flex items-center gap-2">
                        {/* <User className="h-4 w-4" /> */}
                        as Business
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.role && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.role}</p>
                )}
              </div>

              {/* Email/Username */}
              <div className="relative">
                <Label htmlFor="username" className="absolute -top-2 left-4 bg-white px-2 text-xs font-medium text-gray-700">
                  Username
                </Label>
                <Input 
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                  onBlur={(e) => handleFieldBlur('username', e.target.value)}
                  placeholder="AlexDoe"
                  className={`rounded-4xl h-12 mt-1 ${fieldErrors.username ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {fieldErrors.username && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                {/* <div className="flex items-center justify-between mb-1">
                  
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Forgot password?
                  </button>
                </div> */}
                <div className="relative">
                  <Label htmlFor="password" className="absolute -top-2 left-4 bg-white px-2 text-xs font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    onBlur={(e) => handleFieldBlur('password', e.target.value)}
                    placeholder="••••••••"
                    className={`rounded-4xl h-12 pr-10 placeholder:text-gray-400 ${fieldErrors.password ? 'border-red-500' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-4xl font-medium mt-6" 
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 bg-[url('/sigin_in_bg.png')] bg-no-repeat bg-center bg-cover min-h-screen">
        <img src="/Logo_signin.svg" alt="buildsync logo" className="max-w-xs" />
      </div>
    </div>
  )
}