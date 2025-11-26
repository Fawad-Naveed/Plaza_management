"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { clientDb } from "@/lib/database"

export function BusinessManagementSimple() {
  // State
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [newBusiness, setNewBusiness] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    floor_number: "",
    shop_number: "",
    rent_amount: "",
    type: "retail",
  })
  
  // Form validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  // Field validation rules
  const validateField = useCallback((fieldName: string, value: string) => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) return 'Business name is required'
        if (value.trim().length < 2) return 'Business name must be at least 2 characters'
        return ''
        
      case 'contact_person':
        if (!value.trim()) return 'Contact person name is required'
        if (value.trim().length < 2) return 'Contact person name must be at least 2 characters'
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
        if (isNaN(Number(value)) || Number(value) <= 0) return 'Please enter a valid rent amount'
        return ''
        
      default:
        return ''
    }
  }, [])
  
  // Validate all required fields
  const validateForm = useCallback(() => {
    console.log('🔍 Validating form with data:', newBusiness)
    
    const requiredFields = ['name', 'contact_person', 'phone', 'floor_number', 'shop_number', 'rent_amount']
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

  // Add business handler
  const addBusiness = useCallback(async () => {
    console.log('🔄 Add business clicked with data:', newBusiness)
    
    // Validate form before submitting
    if (!validateForm()) {
      console.log('❌ Validation failed:', fieldErrors)
      
      // Mark all required fields as touched to show errors
      const requiredFields = ['name', 'contact_person', 'phone', 'floor_number', 'shop_number', 'rent_amount']
      const touchedState: Record<string, boolean> = {}
      requiredFields.forEach(field => {
        touchedState[field] = true
      })
      setTouchedFields(touchedState)
      setError("❌ Please fill in all required fields correctly")
      
      // Scroll to first error
      setTimeout(() => {
        const firstErrorField = document.querySelector('.border-red-500')
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      
      return
    }

    try {
      setLoading(true)
      setError(null)

      const businessData = {
        name: newBusiness.name.trim(),
        type: newBusiness.type,
        contact_person: newBusiness.contact_person.trim(),
        phone: newBusiness.phone.trim(),
        email: newBusiness.email.trim() || null,
        floor_number: parseInt(newBusiness.floor_number),
        shop_number: newBusiness.shop_number.trim(),
        rent_amount: parseFloat(newBusiness.rent_amount),
        area_sqft: 100, // Default value
        security_deposit: 0, // Default value
        lease_start_date: new Date().toISOString().split('T')[0],
        lease_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        status: "active" as const
      }

      console.log('📤 Submitting business data:', businessData)

      const result = await clientDb.addBusiness(businessData)

      if (result.error) {
        throw result.error
      }

      console.log('✅ Business added successfully:', result.data)

      // Reset form and validation state
      setNewBusiness({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        floor_number: "",
        shop_number: "",
        rent_amount: "",
        type: "retail",
      })
      setFieldErrors({})
      setTouchedFields({})
      
      setShowAddDialog(false)

    } catch (err) {
      console.error("❌ Error adding business:", err)
      setError(err instanceof Error ? err.message : "Failed to add business")
    } finally {
      setLoading(false)
    }
  }, [newBusiness, validateForm])
  
  // Handle dialog close with validation reset
  const handleCloseDialog = useCallback(() => {
    setShowAddDialog(false)
    setFieldErrors({})
    setTouchedFields({})
    setError(null)
    // Reset form
    setNewBusiness({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      floor_number: "",
      shop_number: "",
      rent_amount: "",
      type: "retail",
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Business Management</h2>
          <p className="text-gray-600">
            Add and manage businesses in your plaza
          </p>
        </div>
        
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
                  <Label htmlFor="contact-person" className="text-sm font-medium">
                    Contact Person <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contact-person"
                    value={newBusiness.contact_person}
                    onChange={(e) => handleFieldChange('contact_person', e.target.value)}
                    onBlur={(e) => handleFieldBlur('contact_person', e.target.value)}
                    placeholder="Enter contact person"
                    className={`${
                      fieldErrors.contact_person && touchedFields.contact_person 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                  />
                  {fieldErrors.contact_person && touchedFields.contact_person && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.contact_person}</p>
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
                      <SelectItem value="1">Ground Floor</SelectItem>
                      <SelectItem value="2">First Floor</SelectItem>
                      <SelectItem value="3">Second Floor</SelectItem>
                      <SelectItem value="4">Third Floor</SelectItem>
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

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                  <div className="font-semibold mb-1">Validation Error:</div>
                  {error}
                </div>
              )}
              
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-50 border border-0 rounded-md p-2 text-xs text-gray-600">
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

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Validation Features Active</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This form includes comprehensive validation with visual feedback:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <strong>✅ Required Fields:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• Business Name (min 2 chars)</li>
                <li>• Contact Person (min 2 chars)</li>
                <li>• Phone (valid format, 10+ digits)</li>
              </ul>
            </div>
            <div>
              <strong>✅ Visual Feedback:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• Red borders for invalid fields</li>
                <li>• Error messages below fields</li>
                <li>• Smart submit button</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
