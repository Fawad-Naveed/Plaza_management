"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Plus, Loader2, Building, Phone, Mail, Settings, Trash2, Eye, EyeOff } from "lucide-react"
import { getOptimizedSupabaseClient } from "@/lib/supabase-optimized"
import { useRenderPerformance, useQueryPerformance } from "@/hooks/use-performance"
import { hashPassword, isUsernameAvailable } from "@/lib/auth"

// Types
interface Business {
  id: string
  name: string
  owner_name: string
  phone: string
  email?: string
  floor_number: number
  shop_number: string
  rent_amount: number
  status: string
  username?: string
  password_hash?: string
  created_at: string
}

interface Floor {
  id: string
  floor_name: string
  floor_number: number
  total_shops: number
  occupied_shops: number
}

export function BusinessManagementOptimized() {
  // Performance monitoring
  useRenderPerformance('BusinessManagementOptimized')
  const { measureQuery } = useQueryPerformance()

  // State
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [floorFilter, setFloorFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showFloorManagement, setShowFloorManagement] = useState(false)
  const [editingFloor, setEditingFloor] = useState<string | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  // Form state
  const [newBusiness, setNewBusiness] = useState({
    name: "",
    owner_name: "",
    phone: "",
    email: "",
    floor_number: "",
    shop_number: "",
    rent_amount: "",
    status: "active",
    username: "",
    password: ""
  })
  
  // Form validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)

  // Client
  const client = getOptimizedSupabaseClient()
  
  // Field validation rules
  const validateField = useCallback((fieldName: string, value: string) => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) return 'Business name is required'
        if (value.trim().length < 2) return 'Business name must be at least 2 characters'
        return ''
        
      case 'owner_name':
        if (!value.trim()) return 'Owner name is required'
        if (value.trim().length < 2) return 'Owner name must be at least 2 characters'
        return ''
        
      case 'phone':
        if (!value.trim()) return 'Phone number is required'
        if (!/^[\d\s\-\+\(\)]+$/.test(value)) return 'Please enter a valid phone number'
        if (value.replace(/\D/g, '').length < 10) return 'Phone number must be at least 10 digits'
        return ''
        
      case 'email':
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address'
        }
        return ''
        
      case 'floor_number':
        if (!value) return 'Please select a floor'
        return ''
        
      case 'shop_number':
        if (!value.trim()) return 'Shop number is required'
        return ''
        
      case 'rent_amount':
        if (!value.trim()) return 'Rent amount is required'
        if (isNaN(Number(value)) || Number(value) < 0) return 'Please enter a valid rent amount'
        return ''
        
      case 'username':
        if (!value.trim()) return 'Username is required for business login'
        if (value.trim().length < 3) return 'Username must be at least 3 characters'
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores'
        return ''
        
      case 'password':
        if (!value.trim()) return 'Password is required for business login'
        if (value.length < 6) return 'Password must be at least 6 characters'
        return ''
        
      default:
        return ''
    }
  }, [])
  
  // Validate all required fields
  const validateForm = useCallback(() => {
    console.log('🔍 Validating form with data:', newBusiness)
    
    const requiredFields = ['name', 'owner_name', 'phone', 'floor_number', 'shop_number', 'rent_amount', 'username', 'password']
    const errors: Record<string, string> = {}
    
    requiredFields.forEach(field => {
      const value = newBusiness[field as keyof typeof newBusiness]
      const error = validateField(field, value)
      console.log(`📝 Field ${field}: "${value}" -> ${error || 'valid'}`)
      if (error) {
        errors[field] = error
      }
    })
    
    // Validate email if provided
    if (newBusiness.email) {
      const emailError = validateField('email', newBusiness.email)
      if (emailError) {
        errors.email = emailError
      }
    }
    
    console.log('📊 Validation result:', { errors, isValid: Object.keys(errors).length === 0 })
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [newBusiness, validateField])
  
  // Handle field blur (when user leaves a field)
  const handleFieldBlur = useCallback((fieldName: string, value: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }))
    const error = validateField(fieldName, value)
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }))
  }, [validateField])
  
  // Handle field change with validation
  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setNewBusiness(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
    
    // Validate immediately if field was previously touched and had an error
    if (touchedFields[fieldName]) {
      const error = validateField(fieldName, value)
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }))
    }
  }, [fieldErrors, touchedFields, validateField])

  // Load businesses with pagination and filters
  const loadBusinesses = useCallback(async (page: number = 1, resetList: boolean = true) => {
    try {
      setLoading(true)
      setError(null)

      // Build filters
      const filters: Record<string, any> = {}
      if (statusFilter !== "all") {
        filters.status = statusFilter
      }
      if (floorFilter !== "all") {
        filters.floor_number = parseInt(floorFilter)
      }

      const result = await measureQuery('load-businesses-paginated', () =>
        client.selectPaginated<Business>('businesses', {
          columns: 'id, name, owner_name, phone, email, floor_number, shop_number, rent_amount, status, created_at',
          filter: filters,
          page,
          pageSize,
          order: { column: 'created_at', ascending: false },
          cacheTTL: 1 * 60 * 1000 // 1 minute cache for business list
        })
      )

      if (result.error) throw result.error

      const newBusinesses = result.data || []
      
      if (resetList) {
        setBusinesses(newBusinesses)
      } else {
        setBusinesses(prev => [...prev, ...newBusinesses])
      }

      setTotalCount(result.totalCount || 0)
      setCurrentPage(page)

    } catch (err) {
      console.error("Error loading businesses:", err)
      setError(err instanceof Error ? err.message : "Failed to load businesses")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, floorFilter, client, measureQuery])

  // Load floors for dropdown
  const loadFloors = useCallback(async () => {
    try {
      const result = await measureQuery('load-floors', () =>
        client.select<Floor>('floors', {
          columns: 'id, floor_name, floor_number, total_shops, occupied_shops',
          cacheTTL: 10 * 60 * 1000 // 10 minutes cache
        })
      )

      if (result.error) throw result.error
      setFloors(result.data || [])

    } catch (err) {
      console.error("Error loading floors:", err)
    }
  }, [client, measureQuery])

  // Initial load
  useEffect(() => {
    loadBusinesses()
    loadFloors()
  }, [loadBusinesses, loadFloors])

  // Filter businesses by search term (client-side for better UX)
  const filteredBusinesses = useMemo(() => {
    if (!searchTerm.trim()) return businesses

    const term = searchTerm.toLowerCase()
    return businesses.filter(business => 
      business.name.toLowerCase().includes(term) ||
      business.owner_name.toLowerCase().includes(term) ||
      business.phone.includes(term) ||
      business.shop_number.toLowerCase().includes(term)
    )
  }, [businesses, searchTerm])

  // Add business handler
  const addBusiness = useCallback(async () => {
    console.log('🔄 Add business clicked with data:', newBusiness)
    
    // Validate form before submitting
    if (!validateForm()) {
      console.log('❌ Validation failed:', fieldErrors)
      
      // Mark all required fields as touched to show errors
      const requiredFields = ['name', 'owner_name', 'phone', 'floor_number', 'shop_number', 'rent_amount', 'username', 'password']
      const touchedState: Record<string, boolean> = {}
      requiredFields.forEach(field => {
        touchedState[field] = true
      })
      setTouchedFields(touchedState)
      setError("❌ Please fill in all required fields correctly")
      
      // Scroll to first error or show a toast
      const firstErrorField = document.querySelector('.border-red-500')
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Check if username is available
      const usernameAvailable = await isUsernameAvailable(newBusiness.username)
      if (!usernameAvailable) {
        setError('Username already exists. Please choose a different username.')
        setFieldErrors(prev => ({ ...prev, username: 'Username already exists' }))
        setTouchedFields(prev => ({ ...prev, username: true }))
        setLoading(false)
        return
      }
      
      // Hash password
      const hashedPassword = await hashPassword(newBusiness.password)

      const businessData = {
        ...newBusiness,
        floor_number: parseInt(newBusiness.floor_number) || 1,
        rent_amount: parseFloat(newBusiness.rent_amount) || 0,
        email: newBusiness.email.trim() || null,
        password_hash: hashedPassword,
        password: undefined // Remove plain password from data
      }

      const { data, error } = await measureQuery('add-business', () =>
        client.raw.from('businesses').insert(businessData).select().single()
      )

      if (error) throw error

      if (data) {
        setBusinesses(prev => [data as Business, ...prev])
        setTotalCount(prev => prev + 1)
      }

      // Reset form and validation state
      setNewBusiness({
        name: "",
        owner_name: "",
        phone: "",
        email: "",
        floor_number: "",
        shop_number: "",
        rent_amount: "",
        status: "active",
        username: "",
        password: ""
      })
      setFieldErrors({})
      setTouchedFields({})
      setShowPassword(false)
      
      setShowAddDialog(false)
      client.clearCache() // Clear cache to ensure consistency

    } catch (err) {
      console.error("Error adding business:", err)
      setError(err instanceof Error ? err.message : "Failed to add business")
    } finally {
      setLoading(false)
    }
  }, [newBusiness, client, measureQuery, validateForm])

  // Filter change handlers
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
    loadBusinesses(1, true)
  }, [loadBusinesses])

  const handleFloorFilterChange = useCallback((value: string) => {
    setFloorFilter(value)
    setCurrentPage(1)
    loadBusinesses(1, true)
  }, [loadBusinesses])

  // Load more businesses
  const loadMoreBusinesses = useCallback(() => {
    loadBusinesses(currentPage + 1, false)
  }, [loadBusinesses, currentPage])

  const hasMoreBusinesses = businesses.length < totalCount

  // Floor Management Functions
  const updateFloorData = useCallback(async (floorId: string, updates: Partial<Floor>) => {
    try {
      const { data, error } = await measureQuery('update-floor', () =>
        client.raw.from('floors').update(updates).eq('id', floorId).select().single()
      )

      if (error) throw error

      if (data) {
        setFloors(prev => prev.map(floor => 
          floor.id === floorId ? { ...floor, ...data } : floor
        ))
        client.clearCache() // Clear cache to ensure consistency
      }
    } catch (err) {
      console.error("Error updating floor:", err)
      throw err
    }
  }, [client, measureQuery])

  const deleteFloor = useCallback(async (floorId: string, floorName: string) => {
    if (!confirm(`Are you sure you want to delete "${floorName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await measureQuery('delete-floor', () =>
        client.raw.from('floors').delete().eq('id', floorId)
      )

      if (error) throw error

      setFloors(prev => prev.filter(floor => floor.id !== floorId))
      client.clearCache()
    } catch (err) {
      console.error("Error deleting floor:", err)
      setError(err instanceof Error ? err.message : "Failed to delete floor")
    }
  }, [client, measureQuery])
  
  // Handle dialog close with validation reset
  const handleCloseDialog = useCallback(() => {
    setShowAddDialog(false)
    setFieldErrors({})
    setTouchedFields({})
    setError(null)
    setShowPassword(false)
    // Reset form
    setNewBusiness({
      name: "",
      owner_name: "",
      phone: "",
      email: "",
      floor_number: "",
      shop_number: "",
      rent_amount: "",
      status: "active",
      username: "",
      password: ""
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Business Management</h2>
          <p className="text-gray-600">
            {totalCount} total businesses
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFloorManagement(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Floor Management
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            if (!open) {
              handleCloseDialog()
            } else {
              setShowAddDialog(true)
            }
          }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Business
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Business</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-name" className="text-sm font-medium">
                    Business Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="business-name"
                    value={newBusiness.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={(e) => handleFieldBlur('name', e.target.value)}
                    placeholder="Enter business name"
                    className={`${
                      fieldErrors.name && touchedFields.name 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                  />
                  {fieldErrors.name && touchedFields.name && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="owner-name" className="text-sm font-medium">
                    Owner Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="owner-name"
                    value={newBusiness.owner_name}
                    onChange={(e) => handleFieldChange('owner_name', e.target.value)}
                    onBlur={(e) => handleFieldBlur('owner_name', e.target.value)}
                    placeholder="Enter owner name"
                    className={`${
                      fieldErrors.owner_name && touchedFields.owner_name 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                  />
                  {fieldErrors.owner_name && touchedFields.owner_name && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.owner_name}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={newBusiness.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                    placeholder="Enter phone number"
                    className={`${
                      fieldErrors.phone && touchedFields.phone 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                  />
                  {fieldErrors.phone && touchedFields.phone && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-gray-400">(optional)</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newBusiness.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    onBlur={(e) => handleFieldBlur('email', e.target.value)}
                    placeholder="Enter email address"
                    className={`${
                      fieldErrors.email && touchedFields.email 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                  />
                  {fieldErrors.email && touchedFields.email && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="floor" className="text-sm font-medium">
                    Floor <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newBusiness.floor_number}
                    onValueChange={(value) => {
                      handleFieldChange('floor_number', value)
                      if (!touchedFields.floor_number) {
                        setTouchedFields(prev => ({ ...prev, floor_number: true }))
                      }
                    }}
                  >
                    <SelectTrigger className={`${
                      fieldErrors.floor_number && touchedFields.floor_number 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((floor) => (
                        <SelectItem key={floor.id} value={floor.floor_number.toString()}>
                          {floor.floor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.floor_number && touchedFields.floor_number && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.floor_number}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="shop-number" className="text-sm font-medium">
                    Shop Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="shop-number"
                    value={newBusiness.shop_number}
                    onChange={(e) => handleFieldChange('shop_number', e.target.value)}
                    onBlur={(e) => handleFieldBlur('shop_number', e.target.value)}
                    placeholder="Enter shop number"
                    className={`${
                      fieldErrors.shop_number && touchedFields.shop_number 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                  />
                  {fieldErrors.shop_number && touchedFields.shop_number && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.shop_number}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rent-amount" className="text-sm font-medium">
                    Rent Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rent-amount"
                    type="number"
                    value={newBusiness.rent_amount}
                    onChange={(e) => handleFieldChange('rent_amount', e.target.value)}
                    onBlur={(e) => handleFieldBlur('rent_amount', e.target.value)}
                    placeholder="Enter rent amount"
                    className={`${
                      fieldErrors.rent_amount && touchedFields.rent_amount 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                  />
                  {fieldErrors.rent_amount && touchedFields.rent_amount && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.rent_amount}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={newBusiness.status}
                    onValueChange={(value) => handleFieldChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Login Credentials Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Business Login Credentials</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      value={newBusiness.username}
                      onChange={(e) => handleFieldChange('username', e.target.value)}
                      onBlur={(e) => handleFieldBlur('username', e.target.value)}
                      placeholder="Enter username for business login"
                      className={`${
                        fieldErrors.username && touchedFields.username 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : ''
                      }`}
                    />
                    {fieldErrors.username && touchedFields.username && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newBusiness.password}
                        onChange={(e) => handleFieldChange('password', e.target.value)}
                        onBlur={(e) => handleFieldBlur('password', e.target.value)}
                        placeholder="Enter password for business login"
                        className={`pr-8 ${
                          fieldErrors.password && touchedFields.password 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && touchedFields.password && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These credentials will allow the business to log in and view their own data.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                  <div className="font-semibold mb-1">Validation Error:</div>
                  {error}
                </div>
              )}
              
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-600">
                  <details>
                    <summary className="cursor-pointer font-medium">Debug Info</summary>
                    <div className="mt-2 space-y-1">
                      <div>Form Data: {JSON.stringify(newBusiness, null, 2)}</div>
                      <div>Errors: {JSON.stringify(fieldErrors, null, 2)}</div>
                      <div>Touched: {JSON.stringify(touchedFields, null, 2)}</div>
                    </div>
                  </details>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={addBusiness} 
                  disabled={loading}
                  className="flex-1"
                  variant={Object.keys(fieldErrors).length > 0 ? "destructive" : "default"}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {Object.keys(fieldErrors).length > 0 ? "Fix Errors to Continue" : "Add Business"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={floorFilter} onValueChange={handleFloorFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.floor_number.toString()}>
                    {floor.floor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Business List */}
      <div className="grid gap-4">
        {filteredBusinesses.map((business) => (
          <Card key={business.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold text-lg">{business.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      business.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {business.status}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Owner:</strong> {business.owner_name}</p>
                      <p><strong>Shop:</strong> {business.shop_number}</p>
                      <p><strong>Floor:</strong> {floors.find(f => f.floor_number === business.floor_number)?.floor_name || business.floor_number}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4" />
                        <span>{business.phone}</span>
                      </div>
                      {business.email && (
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4" />
                          <span>{business.email}</span>
                        </div>
                      )}
                      <p><strong>Rent:</strong> ${business.rent_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMoreBusinesses && !searchTerm && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={loadMoreBusinesses}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Load More ({businesses.length} of {totalCount})
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && businesses.length === 0 && (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading businesses...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBusinesses.length === 0 && (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'No businesses match your search.' : 'No businesses found.'}
            </p>
          </div>
        </div>
      )}

      {/* Floor Management Dialog */}
      <Dialog open={showFloorManagement} onOpenChange={setShowFloorManagement}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Floor Management</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Manage floor settings including total shops and occupied shops.
            </p>
            
            <div className="space-y-4">
              {floors.map((floor) => {
                const floorBusinesses = businesses.filter(b => b.floor_number === floor.floor_number)
                const actualOccupied = floorBusinesses.length
                
                return (
                  <Card key={floor.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{floor.floor_name}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`total-shops-${floor.id}`} className="text-sm font-medium">
                            Total Shops
                          </Label>
                          <Input
                            id={`total-shops-${floor.id}`}
                            type="number"
                            min="0"
                            value={floor.total_shops || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              setFloors(prev => prev.map(f => 
                                f.id === floor.id ? { ...f, total_shops: value } : f
                              ))
                            }}
                            onBlur={async (e) => {
                              const value = parseInt(e.target.value) || 0
                              try {
                                await updateFloorData(floor.id, { total_shops: value })
                              } catch (err) {
                                // Revert on error
                                setFloors(prev => prev.map(f => 
                                  f.id === floor.id ? { ...f, total_shops: floor.total_shops } : f
                                ))
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`occupied-shops-${floor.id}`} className="text-sm font-medium">
                            Occupied Shops
                          </Label>
                          <Input
                            id={`occupied-shops-${floor.id}`}
                            type="number"
                            min="0"
                            max={floor.total_shops || 0}
                            value={floor.occupied_shops || actualOccupied}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              setFloors(prev => prev.map(f => 
                                f.id === floor.id ? { ...f, occupied_shops: value } : f
                              ))
                            }}
                            onBlur={async (e) => {
                              const value = parseInt(e.target.value) || 0
                              try {
                                await updateFloorData(floor.id, { occupied_shops: value })
                              } catch (err) {
                                // Revert on error
                                setFloors(prev => prev.map(f => 
                                  f.id === floor.id ? { ...f, occupied_shops: floor.occupied_shops } : f
                                ))
                              }
                            }}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Actual businesses: {actualOccupied}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {floors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No floors found. Add floors from the dashboard first.</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button onClick={() => setShowFloorManagement(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
