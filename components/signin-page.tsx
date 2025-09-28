"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2, Shield, User } from "lucide-react"
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Plaza Management System</CardTitle>
            <p className="text-gray-600">Sign in to your account</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <Label htmlFor="role" className="text-sm font-medium">
                  Sign in as <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleFieldChange('role', value)}
                >
                  <SelectTrigger className={fieldErrors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="business">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Business
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.role && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.role}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <Label htmlFor="username" className="text-sm font-medium">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                  onBlur={(e) => handleFieldBlur('username', e.target.value)}
                  placeholder="Enter your username"
                  className={fieldErrors.username ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {fieldErrors.username && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={(e) => handleFieldBlur('password', e.target.value)}
                  placeholder="Enter your password"
                  className={fieldErrors.password ? 'border-red-500' : ''}
                  disabled={loading}
                />
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
                className="w-full" 
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <div className="space-y-2">
                <p><strong>Admin:</strong> Use admin credentials</p>
                <p><strong>Business:</strong> Use your business username and password</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}