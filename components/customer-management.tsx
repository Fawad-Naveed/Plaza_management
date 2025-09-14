"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  Search,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  Calendar,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Save,
} from "lucide-react"
import { clientDb, type Business, type ContactPerson, type Floor, type Advance, type PartialPayment, deleteAdvance, deleteFloor, checkAdvanceExists, createPartialPayment, updatePartialPayment, deletePartialPayment, checkPartialPaymentExists } from "@/lib/database"

interface TheftRecord {
  id: string
  date: string
  description: string
  businessId: string
  businessName: string
  amount?: number
}

interface CustomerManagementProps {
  activeSubSection: string
}

interface AddPaymentFormProps {
  partialPayment: PartialPayment
  onSubmit: (amount: number, date: string, description?: string) => void
}

function AddPaymentForm({ partialPayment, onSubmit }: AddPaymentFormProps) {
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentDate, setPaymentDate] = useState('')
  const [description, setDescription] = useState('')
  
  const remainingAmount = partialPayment.total_rent_amount - partialPayment.total_paid_amount
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentAmount > 0 && paymentDate) {
      onSubmit(paymentAmount, paymentDate, description || undefined)
      setPaymentAmount(0)
      setPaymentDate('')
      setDescription('')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-gray-600">
        Remaining amount: PKR {remainingAmount.toLocaleString()}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="addPaymentAmount">Payment Amount</Label>
        <Input
          id="addPaymentAmount"
          type="number"
          step="0.01"
          max={remainingAmount}
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(Number.parseFloat(e.target.value) || 0)}
          placeholder="Enter payment amount"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="addPaymentDate">Payment Date</Label>
        <Input
          id="addPaymentDate"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="addPaymentDescription">Description (Optional)</Label>
        <Input
          id="addPaymentDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes about this payment"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
          Add Payment
        </Button>
      </div>
    </form>
  )
}

export function CustomerManagement({ activeSubSection }: CustomerManagementProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [advances, setAdvances] = useState<Advance[]>([])
  const [partialPayments, setPartialPayments] = useState<PartialPayment[]>([])
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [theftRecords, setTheftRecords] = useState<TheftRecord[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [floorFilter, setFloorFilter] = useState("all")
  const [newBusiness, setNewBusiness] = useState({
    name: "",
    type: "",
    contact_person: "",
    phone: "",
    email: "",
    floor_number: 0,
    shop_number: "",
    area_sqft: 0,
    rent_amount: 0,
    security_deposit: 0,
    lease_start_date: "",
    lease_end_date: "",
    electricity_consumer_number: "",
    gas_consumer_number: "",
    electricity_management: true,
    gas_management: true,
    rent_management: true,
    maintenance_management: true,
    contactPersons: [
      {
        name: "",
        phone: "",
        designation: "",
      },
    ],
  })
  
  // Form validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const [newTheft, setNewTheft] = useState({
    date: "",
    description: "",
    businessId: "",
    amount: "",
  })
  const [expandedBusinesses, setExpandedBusinesses] = useState<string[]>([])
  const [editingBusinessDetails, setEditingBusinessDetails] = useState<string | null>(null)
  const [editingBusinessData, setEditingBusinessData] = useState<{
    rent_amount: number
    security_deposit: number
    lease_start_date: string
    lease_end_date: string
    email: string
    electricity_consumer_number: string
    gas_consumer_number: string
  } | null>(null)
  const [newFloor, setNewFloor] = useState({
    floor_number: 0,
    floor_name: "",
    total_shops: 0,
    occupied_shops: 0,
    total_area_sqft: 0,
  })
  const [newAdvance, setNewAdvance] = useState({
    business_id: "",
    amount: 0,
    advance_date: "",
    purpose: "",
    type: "" as "electricity" | "rent" | "maintenance" | "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })
  const [advanceError, setAdvanceError] = useState<string | null>(null)
  
  // Partial Payment State
  const [newPartialPayment, setNewPartialPayment] = useState({
    business_id: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    payment_date: "",
    payment_amount: 0,
    description: "",
  })
  const [partialPaymentError, setPartialPaymentError] = useState<string | null>(null)
  const [expandedPartialPayments, setExpandedPartialPayments] = useState<string[]>([])
  const [selectedPartialPayment, setSelectedPartialPayment] = useState<PartialPayment | null>(null)
  const [addPaymentDialog, setAddPaymentDialog] = useState(false)

  // Field validation rules
  const validateField = React.useCallback((fieldName: string, value: any) => {
    switch (fieldName) {
      case 'name':
        if (!value || !value.toString().trim()) return 'Business name is required'
        if (value.toString().trim().length < 2) return 'Business name must be at least 2 characters'
        return ''
        
      case 'contact_person':
        if (!value || !value.toString().trim()) return 'Contact person is required'
        if (value.toString().trim().length < 2) return 'Contact person must be at least 2 characters'
        return ''
        
      case 'phone':
        if (!value || !value.toString().trim()) return 'Phone number is required'
        if (!/^[\d\s\-\+\(\)]+$/.test(value.toString())) return 'Please enter a valid phone number'
        if (value.toString().replace(/\D/g, '').length < 10) return 'Phone number must be at least 10 digits'
        return ''
        
      case 'email':
        if (value && value.toString().trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toString())) {
          return 'Please enter a valid email address'
        }
        return ''
        
      case 'floor_number':
        if (!value || value === 0) return 'Please select a floor'
        return ''
        
      case 'shop_number':
        if (!value || !value.toString().trim()) return 'Shop number is required'
        return ''
        
      case 'rent_amount':
        // Rent amount is now optional
        if (value && (isNaN(Number(value)) || Number(value) < 0)) return 'Please enter a valid rent amount'
        return ''
        
      default:
        return ''
    }
  }, [])
  
  // Validate form before submission
  const validateForm = React.useCallback(() => {
    console.log('🔍 Validating form with data:', newBusiness)
    
    const requiredFields = ['name', 'contact_person', 'phone', 'floor_number', 'shop_number']
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
  
  // Handle field changes with validation
  const handleFieldChange = React.useCallback((fieldName: string, value: any) => {
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
  
  // Handle field blur (when user leaves a field)
  const handleFieldBlur = React.useCallback((fieldName: string, value: any) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }))
    const error = validateField(fieldName, value)
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }))
  }, [validateField])

  useEffect(() => {
    loadCustomerData()
  }, [])
  
  // Clear validation error when switching sections
  useEffect(() => {
    if (activeSubSection !== 'customer-add') {
      setFieldErrors({})
      setTouchedFields({})
      setError(null)
    } else {
      // Clear any existing error when entering add business mode
      setError(null)
    }
  }, [activeSubSection])

  const loadCustomerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [businessesResult, floorsResult, advancesResult, partialPaymentsResult] = await Promise.all([
        clientDb.getBusinesses(),
        clientDb.getFloors(),
        clientDb.getAdvances(),
        clientDb.getPartialPayments(),
      ])

      if (businessesResult.error) {
        console.error("[v0] getBusinesses error:", businessesResult.error)
        throw businessesResult.error
      }
      if (floorsResult.error) {
        console.error("[v0] getFloors error:", floorsResult.error)
        throw floorsResult.error
      }
      if (advancesResult.error) {
        console.error("[v0] getAdvances error:", advancesResult.error)
        throw advancesResult.error
      }
      if (partialPaymentsResult.error) {
        console.error("[v0] getPartialPayments error:", partialPaymentsResult.error)
        throw partialPaymentsResult.error
      }

      setBusinesses(businessesResult.data || [])
      setFloors(floorsResult.data || [])
      setAdvances(advancesResult.data || [])
      setPartialPayments(partialPaymentsResult.data || [])
      
      // Clear any validation errors after successful load
      setError(null)

      // Load contact persons for all businesses
      if (businessesResult.data && businessesResult.data.length > 0) {
        const allContactPersons: ContactPerson[] = []
        for (const business of businessesResult.data) {
          const { data: contacts } = await clientDb.getContactPersons(business.id)
          if (contacts) {
            allContactPersons.push(...contacts)
          }
        }
        setContactPersons(allContactPersons)
      }
    } catch (err) {
      // Log more context to help diagnose empty error objects
      try {
        console.error("[v0] Error loading customer data:", err, {
          message: (err as any)?.message,
          code: (err as any)?.code,
          details: (err as any)?.details,
          hint: (err as any)?.hint,
        })
      } catch (_) {
        console.error("[v0] Error loading customer data (stringified):", String(err))
      }
      setError(err instanceof Error ? err.message : "Failed to load customer data")
    } finally {
      setLoading(false)
    }
  }

  const addContactPerson = () => {
    setNewBusiness({
      ...newBusiness,
      contactPersons: [...newBusiness.contactPersons, { name: "", phone: "", designation: "" }],
    })
  }

  const removeContactPerson = (index: number) => {
    if (newBusiness.contactPersons.length > 1) {
      setNewBusiness({
        ...newBusiness,
        contactPersons: newBusiness.contactPersons.filter((_, i) => i !== index),
      })
    }
  }

  const updateContactPerson = (index: number, field: string, value: string) => {
    const updatedContactPersons = newBusiness.contactPersons.map((person, i) =>
      i === index ? { ...person, [field]: value } : person,
    )
    setNewBusiness({
      ...newBusiness,
      contactPersons: updatedContactPersons,
    })
  }

  const addBusiness = async () => {
    console.log('🔄 Add business clicked with data:', newBusiness)
    
    // Validate form before submitting
    if (!validateForm()) {
      console.log('❌ Validation failed:', fieldErrors)
      
      // Mark all required fields as touched to show errors
      const requiredFields = ['name', 'contact_person', 'phone', 'floor_number', 'shop_number']
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
    
    if (newBusiness.name && newBusiness.phone && newBusiness.shop_number && newBusiness.floor_number) {
      try {
        const businessData = {
          name: newBusiness.name,
          type: newBusiness.type || "General",
          contact_person: newBusiness.contact_person,
          phone: newBusiness.phone,
          email: newBusiness.email || undefined,
          floor_number: newBusiness.floor_number,
          shop_number: newBusiness.shop_number,
          area_sqft: newBusiness.area_sqft || 0,
          rent_amount: newBusiness.rent_amount || 0,
          security_deposit: newBusiness.security_deposit || 0,
          lease_start_date: newBusiness.lease_start_date || new Date().toISOString().split("T")[0],
          lease_end_date:
            newBusiness.lease_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          electricity_consumer_number: newBusiness.electricity_consumer_number || undefined,
          gas_consumer_number: newBusiness.gas_consumer_number || undefined,
          electricity_management: newBusiness.electricity_management,
          gas_management: newBusiness.gas_management,
          rent_management: newBusiness.rent_management,
          maintenance_management: newBusiness.maintenance_management,
          status: "active" as const,
        }

        const { data: business, error } = await clientDb.createBusiness(businessData)
        if (error) throw error

        if (business) {
          // Add contact persons
          for (const contactPerson of newBusiness.contactPersons) {
            if (contactPerson.name && contactPerson.phone) {
              await clientDb.createContactPerson({
                business_id: business.id,
                name: contactPerson.name,
                phone: contactPerson.phone,
                designation: contactPerson.designation,
                is_primary: newBusiness.contactPersons.indexOf(contactPerson) === 0,
              })
            }
          }

          await loadCustomerData() // Reload data
        }

        setNewBusiness({
          name: "",
          type: "",
          contact_person: "",
          phone: "",
          email: "",
          floor_number: 0,
          shop_number: "",
          area_sqft: 0,
          rent_amount: 0,
          security_deposit: 0,
          lease_start_date: "",
          lease_end_date: "",
          electricity_consumer_number: "",
          gas_consumer_number: "",
          electricity_management: true,
          gas_management: true,
          rent_management: true,
          maintenance_management: true,
          contactPersons: [{ name: "", phone: "", designation: "" }],
        })
        
        // Clear validation state
        setFieldErrors({})
        setTouchedFields({})
      } catch (err) {
        console.error("[v0] Error adding business:", err)
        setError(err instanceof Error ? err.message : "Failed to add business")
      }
    }
  }

  const updateBusiness = async (updatedBusiness: Business) => {
    try {
      const { error } = await clientDb.updateBusiness(updatedBusiness.id, updatedBusiness)
      if (error) throw error

      await loadCustomerData() // Reload data
      setEditingBusiness(null)
    } catch (err) {
      console.error("[v0] Error updating business:", err)
      setError(err instanceof Error ? err.message : "Failed to update business")
    }
  }

  const deleteBusiness = async (id: string) => {
    try {
      const { error } = await clientDb.deleteBusiness(id)
      if (error) throw error

      await loadCustomerData() // Reload data
    } catch (err) {
      console.error("[v0] Error deleting business:", err)
      setError(err instanceof Error ? err.message : "Failed to delete business")
    }
  }

  const addTheftRecord = () => {
    if (newTheft.date && newTheft.description && newTheft.businessId) {
      const business = businesses.find((b) => b.id === newTheft.businessId)
      const theft: TheftRecord = {
        id: `THEFT${(theftRecords.length + 1).toString().padStart(3, "0")}`,
        ...newTheft,
        businessName: business?.name || "",
        amount: newTheft.amount ? Number.parseFloat(newTheft.amount) : undefined,
      }
      setTheftRecords([...theftRecords, theft])
      setNewTheft({ date: "", description: "", businessId: "", amount: "" })
    }
  }

  const toggleBusinessExpansion = (businessId: string) => {
    setExpandedBusinesses((prev) =>
      prev.includes(businessId) ? prev.filter((id) => id !== businessId) : [...prev, businessId],
    )
  }

  const addFloor = async () => {
    if (newFloor.floor_number && newFloor.floor_name) {
      try {
        const { error } = await clientDb.createFloor(newFloor)
        if (error) throw error

        await loadCustomerData()
        setNewFloor({
          floor_number: 0,
          floor_name: "",
          total_shops: 0,
          occupied_shops: 0,
          total_area_sqft: 0,
        })
      } catch (err) {
        console.error("[v0] Error adding floor:", err)
        setError(err instanceof Error ? err.message : "Failed to add floor")
      }
    }
  }

  const handleDeleteFloor = async (id: string) => {
    if (confirm("Are you sure you want to delete this floor? This action cannot be undone.")) {
      try {
        await deleteFloor(id)
        await loadCustomerData()
      } catch (err) {
        console.error("[v0] Error deleting floor:", err)
        setError(err instanceof Error ? err.message : "Failed to delete floor")
      }
    }
  }

  const addAdvance = async () => {
    if (newAdvance.business_id && newAdvance.amount && newAdvance.advance_date && newAdvance.type) {
      try {
        setAdvanceError(null)
        
        // Check if advance already exists for this business, type, month, and year
        const exists = await checkAdvanceExists(newAdvance.business_id, newAdvance.type, newAdvance.month, newAdvance.year)
        
        if (exists) {
          const business = businesses.find(b => b.id === newAdvance.business_id)
          const monthNames = ["January", "February", "March", "April", "May", "June", 
                             "July", "August", "September", "October", "November", "December"]
          setAdvanceError(`${newAdvance.type.charAt(0).toUpperCase() + newAdvance.type.slice(1)} advance for ${business?.name} already exists for ${monthNames[newAdvance.month - 1]} ${newAdvance.year}`)
          return
        }

        const { error } = await clientDb.createAdvance({
          business_id: newAdvance.business_id,
          amount: newAdvance.amount,
          advance_date: newAdvance.advance_date,
          purpose: newAdvance.purpose,
          type: newAdvance.type,
          month: newAdvance.month,
          year: newAdvance.year,
          status: "active" as const,
        })
        if (error) throw error

        await loadCustomerData()
        setNewAdvance({
          business_id: "",
          amount: 0,
          advance_date: "",
          purpose: "",
          type: "" as "electricity" | "rent" | "maintenance" | "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        })
        setAdvanceError(null)
      } catch (err) {
        console.error("[v0] Error adding advance:", err)
        setError(err instanceof Error ? err.message : "Failed to add advance")
      }
    }
  }

  const handleDeleteAdvance = async (id: string) => {
    if (confirm("Are you sure you want to delete this advance payment? This action cannot be undone.")) {
      try {
        await deleteAdvance(id)
        await loadCustomerData()
      } catch (err) {
        console.error("[v0] Error deleting advance:", err)
        setError(err instanceof Error ? err.message : "Failed to delete advance")
      }
    }
  }

  const startEditingBusinessDetails = (business: Business) => {
    setEditingBusinessDetails(business.id)
    setEditingBusinessData({
      rent_amount: business.rent_amount,
      security_deposit: business.security_deposit,
      lease_start_date: business.lease_start_date,
      lease_end_date: business.lease_end_date,
      email: business.email || "",
      electricity_consumer_number: business.electricity_consumer_number || "",
      gas_consumer_number: business.gas_consumer_number || "",
    })
  }

  const cancelEditingBusinessDetails = () => {
    setEditingBusinessDetails(null)
    setEditingBusinessData(null)
  }

  const saveBusinessDetails = async (businessId: string) => {
    if (!editingBusinessData) return

    try {
      const { error } = await clientDb.updateBusiness(businessId, editingBusinessData)
      if (error) throw error

      await loadCustomerData()
      setEditingBusinessDetails(null)
      setEditingBusinessData(null)
    } catch (err) {
      console.error("[v0] Error updating business details:", err)
      setError(err instanceof Error ? err.message : "Failed to update business details")
    }
  }

  // Handle floor filter change
  const handleFloorFilterChange = React.useCallback((value: string) => {
    setFloorFilter(value)
  }, [])

  const filteredBusinesses = businesses.filter(
    (business) => {
      // Search term filter
      const matchesSearchTerm = searchTerm === "" || 
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.phone.includes(searchTerm) ||
        business.shop_number.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Floor filter
      const matchesFloorFilter = floorFilter === "all" || 
        business.floor_number.toString() === floorFilter
      
      return matchesSearchTerm && matchesFloorFilter
    }
  )

  const getSectionTitle = () => {
    switch (activeSubSection) {
      case "customer-add":
        return "Add Business"
      case "customer-view":
        return "View Business"
      case "customer-floors":
        return "Floor Management"
      case "customer-advance":
        return "Business Advance"
      case "customer-instalments":
        return "Business Partial Payments"
      case "customer-theft":
        return "Theft Records"
      case "customer-meter-load":
        return "Meter Load Management"
      default:
        return "Business Management"
    }
  }

  const getBusinessContactPersons = (businessId: string) => {
    return contactPersons.filter((cp) => cp.business_id === businessId)
  }

  const getBusinessAdvance = (businessId: string) => {
    const businessAdvances = advances.filter((a) => a.business_id === businessId && a.status === "active")
    return businessAdvances.reduce((total, advance) => total + advance.amount, 0)
  }

  const getBusinessPartialPayments = (businessId: string) => {
    return partialPayments.filter((p) => p.business_id === businessId)
  }

  const getFloorName = (floorNumber: number) => {
    const floor = floors.find((f) => f.floor_number === floorNumber)
    return floor ? floor.floor_name : `Floor ${floorNumber}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading customer data...</span>
        </div>
      </div>
    )
  }

  // Only show the full-screen error for data loading errors, not validation
  if (error && activeSubSection !== 'customer-add') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading customers: {error}</p>
          <Button onClick={loadCustomerData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const renderAddBusiness = () => (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Add New Business</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-800">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
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
            <div className="space-y-2">
              <Label htmlFor="type">Business Type</Label>
              <Input
                id="type"
                value={newBusiness.type}
                onChange={(e) => setNewBusiness({ ...newBusiness, type: e.target.value })}
                placeholder="e.g., Retail, Restaurant, Office"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Primary Contact Person <span className="text-red-500">*</span></Label>
              <Input
                id="contact_person"
                value={newBusiness.contact_person}
                onChange={(e) => handleFieldChange('contact_person', e.target.value)}
                onBlur={(e) => handleFieldBlur('contact_person', e.target.value)}
                placeholder="Enter primary contact person name"
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
            <div className="space-y-2">
              <Label htmlFor="phone">Business Phone <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                value={newBusiness.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                placeholder="Enter business phone number"
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
            <div className="space-y-2">
              <Label htmlFor="email">Business Email <span className="text-gray-400">(optional)</span></Label>
              <Input
                id="email"
                type="email"
                value={newBusiness.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={(e) => handleFieldBlur('email', e.target.value)}
                placeholder="Enter business email (optional)"
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
            <div className="space-y-2">
              <Label htmlFor="shopNumber">Shop Number <span className="text-red-500">*</span></Label>
              <Input
                id="shopNumber"
                value={newBusiness.shop_number}
                onChange={(e) => handleFieldChange('shop_number', e.target.value)}
                onBlur={(e) => handleFieldBlur('shop_number', e.target.value)}
                placeholder="e.g., G-01, F-15"
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
            <div className="space-y-2">
              <Label htmlFor="floor">Floor <span className="text-red-500">*</span></Label>
              <Select
                value={newBusiness.floor_number > 0 ? newBusiness.floor_number.toString() : ""}
                onValueChange={(value) => {
                  handleFieldChange('floor_number', Number.parseInt(value))
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
            <div className="space-y-2">
              <Label htmlFor="area_sqft">Area (sq ft)</Label>
              <Input
                id="area_sqft"
                type="text"
                value={newBusiness.area_sqft}
                onChange={(e) => setNewBusiness({ ...newBusiness, area_sqft: Number.parseFloat(e.target.value) || 0 })}
                placeholder="Enter area in square feet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent_amount">Monthly Rent <span className="text-gray-400">(optional)</span></Label>
              <Input
                id="rent_amount"
                type="number"
                value={newBusiness.rent_amount}
                onChange={(e) => handleFieldChange('rent_amount', Number.parseFloat(e.target.value) || 0)}
                onBlur={(e) => handleFieldBlur('rent_amount', Number.parseFloat(e.target.value) || 0)}
                placeholder="Enter monthly rent amount"
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
            <div className="space-y-2">
              <Label htmlFor="security_deposit">Security Deposit</Label>
              <Input
                id="security_deposit"
                type="text"
                value={newBusiness.security_deposit}
                onChange={(e) =>
                  setNewBusiness({ ...newBusiness, security_deposit: Number.parseFloat(e.target.value) || 0 })
                }
                placeholder="Enter security deposit amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lease_start_date">Lease Start Date</Label>
              <Input
                id="lease_start_date"
                type="date"
                value={newBusiness.lease_start_date}
                onChange={(e) => setNewBusiness({ ...newBusiness, lease_start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lease_end_date">Lease End Date</Label>
              <Input
                id="lease_end_date"
                type="date"
                value={newBusiness.lease_end_date}
                onChange={(e) => setNewBusiness({ ...newBusiness, lease_end_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricity_consumer_number">Electricity Consumer Number</Label>
              <Input
                id="electricity_consumer_number"
                value={newBusiness.electricity_consumer_number}
                onChange={(e) => setNewBusiness({ ...newBusiness, electricity_consumer_number: e.target.value })}
                placeholder="Enter electricity consumer number (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gas_consumer_number">Gas Consumer Number</Label>
              <Input
                id="gas_consumer_number"
                value={newBusiness.gas_consumer_number}
                onChange={(e) => setNewBusiness({ ...newBusiness, gas_consumer_number: e.target.value })}
                placeholder="Enter gas consumer number (optional)"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-800">Management Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="electricity_management"
                checked={newBusiness.electricity_management}
                onCheckedChange={(checked) => setNewBusiness({ ...newBusiness, electricity_management: checked })}
              />
              <Label htmlFor="electricity_management">Electricity Management</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="gas_management"
                checked={newBusiness.gas_management}
                onCheckedChange={(checked) => setNewBusiness({ ...newBusiness, gas_management: checked })}
              />
              <Label htmlFor="gas_management">Gas Management</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="rent_management"
                checked={newBusiness.rent_management}
                onCheckedChange={(checked) => setNewBusiness({ ...newBusiness, rent_management: checked })}
              />
              <Label htmlFor="rent_management">Rent Management</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="maintenance_management"
                checked={newBusiness.maintenance_management}
                onCheckedChange={(checked) => setNewBusiness({ ...newBusiness, maintenance_management: checked })}
              />
              <Label htmlFor="maintenance_management">Maintenance Management</Label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold text-gray-800">Additional Contact Persons</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addContactPerson}
              className="flex items-center gap-2 bg-transparent"
            >
              <Plus className="h-4 w-4" />
              Add Contact Person
            </Button>
          </div>

          {newBusiness.contactPersons.map((person, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Contact Person {index + 1}</h4>
                {newBusiness.contactPersons.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeContactPerson(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`contactPersonName-${index}`}>Contact Person Name</Label>
                  <Input
                    id={`contactPersonName-${index}`}
                    value={person.name}
                    onChange={(e) => updateContactPerson(index, "name", e.target.value)}
                    placeholder="Enter contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`contactPersonPhone-${index}`}>Contact Person Phone</Label>
                  <Input
                    id={`contactPersonPhone-${index}`}
                    value={person.phone}
                    onChange={(e) => updateContactPerson(index, "phone", e.target.value)}
                    placeholder="Enter contact person phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`contactPersonDesignation-${index}`}>Designation</Label>
                  <Input
                    id={`contactPersonDesignation-${index}`}
                    value={person.designation}
                    onChange={(e) => updateContactPerson(index, "designation", e.target.value)}
                    placeholder="e.g., Manager, Owner"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={addBusiness} className="bg-black text-white hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Add Business
        </Button>
      </CardContent>
    </Card>
  )

  const renderViewBusiness = () => (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          All Businesses
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            
            <Select value={floorFilter} onValueChange={handleFloorFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by floor" />
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBusinesses.map((business) => (
              <React.Fragment key={business.id}>
                <TableRow
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleBusinessExpansion(business.id)}
                >
                  <TableCell className="font-medium">{business.name}</TableCell>
                  <TableCell>{business.phone}</TableCell>
                  <TableCell>{business.shop_number}</TableCell>
                  <TableCell>{getFloorName(business.floor_number)}</TableCell>
                  <TableCell>
                    <Badge variant={business.status === "active" ? "default" : "secondary"}>{business.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {expandedBusinesses.includes(business.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingBusiness(business)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Business</DialogTitle>
                          </DialogHeader>
                          {editingBusiness && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Business Name</Label>
                                <Input
                                  value={editingBusiness.name}
                                  onChange={(e) => setEditingBusiness({ ...editingBusiness, name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Contact</Label>
                                <Input
                                  value={editingBusiness.phone}
                                  onChange={(e) => setEditingBusiness({ ...editingBusiness, phone: e.target.value })}
                                />
                              </div>
                              <Button onClick={() => updateBusiness(editingBusiness)}>Update Business</Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteBusiness(business.id)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedBusinesses.includes(business.id) && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-gray-50">
                      <div className="p-4 space-y-4">
                        {/* Business Details Section */}
                        <div className="border-b border-gray-200 pb-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm">Business Details</h4>
                            {editingBusinessDetails === business.id ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => saveBusinessDetails(business.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditingBusinessDetails}
                                  className="text-gray-600 hover:text-gray-700"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditingBusinessDetails(business)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                          
                          {editingBusinessDetails === business.id && editingBusinessData ? (
                            // Edit Mode
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <Label className="text-xs text-gray-600">Monthly Rent</Label>
                                  <Input
                                    type="text"
                                    value={editingBusinessData.rent_amount}
                                    onChange={(e) => setEditingBusinessData({
                                      ...editingBusinessData,
                                      rent_amount: Number.parseFloat(e.target.value) || 0
                                    })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">Security Deposit</Label>
                                  <Input
                                    type="text"
                                    value={editingBusinessData.security_deposit}
                                    onChange={(e) => setEditingBusinessData({
                                      ...editingBusinessData,
                                      security_deposit: Number.parseFloat(e.target.value) || 0
                                    })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">Lease Start</Label>
                                  <Input
                                    type="date"
                                    value={editingBusinessData.lease_start_date}
                                    onChange={(e) => setEditingBusinessData({
                                      ...editingBusinessData,
                                      lease_start_date: e.target.value
                                    })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">Lease End</Label>
                                  <Input
                                    type="date"
                                    value={editingBusinessData.lease_end_date}
                                    onChange={(e) => setEditingBusinessData({
                                      ...editingBusinessData,
                                      lease_end_date: e.target.value
                                    })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                  <span className="text-xs text-gray-600">Area: </span>
                                  <span className="text-sm font-medium">{business.area_sqft} sq ft</span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-600">Business Type: </span>
                                  <span className="text-sm font-medium">{business.type}</span>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">Email</Label>
                                  <Input
                                    type="email"
                                    value={editingBusinessData.email}
                                    onChange={(e) => setEditingBusinessData({
                                      ...editingBusinessData,
                                      email: e.target.value
                                    })}
                                    className="h-8 text-sm"
                                    placeholder="Enter email address"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <div>
                                  <Label className="text-xs text-gray-600">Electricity Consumer Number</Label>
                                  <Input
                                    value={editingBusinessData.electricity_consumer_number}
                                    onChange={(e) => setEditingBusinessData({
                                      ...editingBusinessData,
                                      electricity_consumer_number: e.target.value
                                    })}
                                    className="h-8 text-sm"
                                    placeholder="Enter electricity consumer number"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">Gas Consumer Number</Label>
                                  <Input
                                    value={editingBusinessData.gas_consumer_number}
                                    onChange={(e) => setEditingBusinessData({
                                      ...editingBusinessData,
                                      gas_consumer_number: e.target.value
                                    })}
                                    className="h-8 text-sm"
                                    placeholder="Enter gas consumer number"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-600">Monthly Rent: </span>
                                  <span className="text-green-600 font-medium">
                                    PKR {business.rent_amount.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Security Deposit: </span>
                                  <span className="text-blue-600 font-medium">
                                    PKR {business.security_deposit.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Lease Start: </span>
                                  <span className="font-medium">
                                    {new Date(business.lease_start_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Lease End: </span>
                                  <span className="font-medium">
                                    {new Date(business.lease_end_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                                <div>
                                  <span className="font-medium text-gray-600">Area: </span>
                                  <span className="font-medium">{business.area_sqft} sq ft</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Business Type: </span>
                                  <span className="font-medium">{business.type}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Email: </span>
                                  <span className="font-medium">{business.email || "N/A"}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                                <div>
                                  <span className="font-medium text-gray-600">Electricity Consumer Number: </span>
                                  <span className="font-medium">{business.electricity_consumer_number || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Gas Consumer Number: </span>
                                  <span className="font-medium">{business.gas_consumer_number || "N/A"}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Contact Persons Section */}
                        <div>
                          <h4 className="font-semibold text-sm mb-3">
                            Contact Persons ({getBusinessContactPersons(business.id).length})
                          </h4>
                          <div className="space-y-3">
                            {getBusinessContactPersons(business.id).map((person, index) => (
                              <div key={person.id} className="border-l-2 border-gray-300 pl-4">
                                <div className="text-xs text-gray-500 mb-1">Contact Person {index + 1}</div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Name: </span>
                                    {person.name}
                                  </div>
                                  <div>
                                    <span className="font-medium">Phone: </span>
                                    {person.phone}
                                  </div>
                                  <div>
                                    <span className="font-medium">Designation: </span>
                                    {person.designation || "N/A"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
        {filteredBusinesses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No businesses found.</p>
            {businesses.length === 0 && (
              <p className="text-sm">Add your first business using the "Add Business" section.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderFloors = () => (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Add New Floor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floorNumber">Floor Number</Label>
              <Input
                id="floorNumber"
                type="text"
                value={newFloor.floor_number}
                onChange={(e) => setNewFloor({ ...newFloor, floor_number: Number.parseInt(e.target.value) || 0 })}
                placeholder="Enter floor number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floorName">Floor Name</Label>
              <Input
                id="floorName"
                value={newFloor.floor_name}
                onChange={(e) => setNewFloor({ ...newFloor, floor_name: e.target.value })}
                placeholder="e.g., Ground Floor, First Floor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalShops">Total Shops</Label>
              <Input
                id="totalShops"
                type="text"
                value={newFloor.total_shops}
                onChange={(e) => setNewFloor({ ...newFloor, total_shops: Number.parseInt(e.target.value) || 0 })}
                placeholder="Enter total number of shops"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalArea">Total Area (sq ft)</Label>
              <Input
                id="totalArea"
                type="text"
                value={newFloor.total_area_sqft}
                onChange={(e) => setNewFloor({ ...newFloor, total_area_sqft: Number.parseFloat(e.target.value) || 0 })}
                placeholder="Enter total area in square feet"
              />
            </div>
          </div>
          <Button onClick={addFloor} className="bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Add Floor
          </Button>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Floors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Floor Number</TableHead>
                <TableHead>Floor Name</TableHead>
                <TableHead>Total Shops</TableHead>
                <TableHead>Occupied Shops</TableHead>
                <TableHead>Total Area</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {floors.map((floor) => {
                const occupiedShops = businesses.filter((b) => b.floor_number === floor.floor_number).length
                return (
                  <TableRow key={floor.id}>
                    <TableCell className="font-medium">{floor.floor_number}</TableCell>
                    <TableCell>{floor.floor_name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={floor.total_shops || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          const updatedFloors = floors.map(f => 
                            f.id === floor.id ? { ...f, total_shops: value } : f
                          )
                          setFloors(updatedFloors)
                        }}
                        onBlur={async (e) => {
                          const value = parseInt(e.target.value) || 0
                          try {
                            const { error } = await clientDb.updateFloor(floor.id, { total_shops: value })
                            if (error) throw error
                          } catch (err) {
                            console.error('[v0] Error updating total shops:', err)
                            // Revert on error
                            const originalFloors = await clientDb.getFloors()
                            if (originalFloors.data) setFloors(originalFloors.data)
                          }
                        }}
                        className="w-20 h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={floor.total_shops || 0}
                        value={floor.occupied_shops || occupiedShops}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          const updatedFloors = floors.map(f => 
                            f.id === floor.id ? { ...f, occupied_shops: value } : f
                          )
                          setFloors(updatedFloors)
                        }}
                        onBlur={async (e) => {
                          const value = parseInt(e.target.value) || 0
                          try {
                            const { error } = await clientDb.updateFloor(floor.id, { occupied_shops: value })
                            if (error) throw error
                          } catch (err) {
                            console.error('[v0] Error updating occupied shops:', err)
                            // Revert on error
                            const originalFloors = await clientDb.getFloors()
                            if (originalFloors.data) setFloors(originalFloors.data)
                          }
                        }}
                        className="w-20 h-8"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Actual: {occupiedShops}
                      </div>
                    </TableCell>
                    <TableCell>{floor.total_area_sqft.toLocaleString()} sq ft</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFloor(floor.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {floors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No floors found.</p>
              <p className="text-sm">Add your first floor using the form above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // Get selected business rent amount
  const getSelectedBusinessRentAmount = () => {
    if (!newAdvance.business_id) return 0
    const selectedBusiness = businesses.find(b => b.id === newAdvance.business_id)
    return selectedBusiness?.rent_amount || 0
  }

  // Calculate months covered by rent advance
  const calculateMonthsCovered = () => {
    const rentAmount = getSelectedBusinessRentAmount()
    if (rentAmount === 0 || newAdvance.amount === 0) return 0
    return Math.floor(newAdvance.amount / rentAmount * 100) / 100 // Round to 2 decimal places
  }

  // Partial Payment Utility Functions
  const getSelectedBusinessForPartialPayment = () => {
    if (!newPartialPayment.business_id) return null
    return businesses.find(b => b.id === newPartialPayment.business_id)
  }

  const togglePartialPaymentExpansion = (partialPaymentId: string) => {
    setExpandedPartialPayments((prev) =>
      prev.includes(partialPaymentId) ? prev.filter((id) => id !== partialPaymentId) : [...prev, partialPaymentId],
    )
  }

  const getPaymentStatus = (partialPayment: PartialPayment) => {
    return partialPayment.total_paid_amount >= partialPayment.total_rent_amount ? "completed" : "pending"
  }

  const getStatusColor = (partialPayment: PartialPayment) => {
    return partialPayment.total_paid_amount >= partialPayment.total_rent_amount ? "text-green-600" : "text-red-600"
  }

  const getStatusBadgeVariant = (partialPayment: PartialPayment) => {
    return partialPayment.total_paid_amount >= partialPayment.total_rent_amount ? "default" : "destructive"
  }

  const createPartialPaymentRecord = async () => {
    const business = getSelectedBusinessForPartialPayment()
    if (!business || !newPartialPayment.business_id || !newPartialPayment.payment_date || newPartialPayment.payment_amount <= 0) {
      setPartialPaymentError("Please fill all required fields")
      return
    }

    try {
      setPartialPaymentError(null)
      
      // Check if partial payment record already exists for this business, month, and year
      const exists = await checkPartialPaymentExists(newPartialPayment.business_id, newPartialPayment.month, newPartialPayment.year)
      
      if (exists) {
        setPartialPaymentError("A partial payment record already exists for this business and month. Please add payments to the existing record.")
        return
      }

      const paymentEntry = {
        amount: newPartialPayment.payment_amount,
        payment_date: newPartialPayment.payment_date,
        description: newPartialPayment.description || undefined,
      }

      const partialPaymentData = {
        business_id: newPartialPayment.business_id,
        month: newPartialPayment.month,
        year: newPartialPayment.year,
        total_rent_amount: business.rent_amount,
        payment_entries: [paymentEntry],
        total_paid_amount: newPartialPayment.payment_amount,
        description: newPartialPayment.description || undefined,
        status: "active" as const,
      }

      const result = await createPartialPayment(partialPaymentData)
      if (result) {
        await loadCustomerData()
        
        // Reset form
        setNewPartialPayment({
          business_id: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          payment_date: "",
          payment_amount: 0,
          description: "",
        })
        setPartialPaymentError(null)
      }
    } catch (err) {
      console.error("[v0] Error creating partial payment:", err)
      setPartialPaymentError(err instanceof Error ? err.message : "Failed to create partial payment")
    }
  }

  const addPaymentToRecord = async (paymentAmount: number, paymentDate: string, description?: string) => {
    if (!selectedPartialPayment) return

    try {
      const newPaymentEntry = {
        amount: paymentAmount,
        payment_date: paymentDate,
        description: description || undefined,
      }

      const updatedPaymentEntries = [...selectedPartialPayment.payment_entries, newPaymentEntry]
      const newTotalPaid = selectedPartialPayment.total_paid_amount + paymentAmount

      await updatePartialPayment(selectedPartialPayment.id, {
        payment_entries: updatedPaymentEntries,
        total_paid_amount: newTotalPaid,
        status: newTotalPaid >= selectedPartialPayment.total_rent_amount ? "completed" : "active",
      })

      await loadCustomerData()
      setAddPaymentDialog(false)
      setSelectedPartialPayment(null)
    } catch (err) {
      console.error("[v0] Error adding payment:", err)
      setError(err instanceof Error ? err.message : "Failed to add payment")
    }
  }

  const handleDeletePartialPayment = async (id: string) => {
    if (confirm("Are you sure you want to delete this partial payment record? This action cannot be undone.")) {
      try {
        await deletePartialPayment(id)
        await loadCustomerData()
      } catch (err) {
        console.error("[v0] Error deleting partial payment:", err)
        setError(err instanceof Error ? err.message : "Failed to delete partial payment")
      }
    }
  }

  const renderAdvance = () => (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Add New Advance Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {advanceError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{advanceError}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advanceBusiness">Business</Label>
              <Select
                value={newAdvance.business_id}
                onValueChange={(value) => setNewAdvance({ ...newAdvance, business_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name} - {business.shop_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advanceType">Type</Label>
              <Select
                value={newAdvance.type}
                onValueChange={(value) => setNewAdvance({ ...newAdvance, type: value as "electricity" | "rent" | "maintenance" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advanceAmount">Advance Amount</Label>
              <Input
                id="advanceAmount"
                type="text"
                value={newAdvance.amount}
                onChange={(e) => setNewAdvance({ ...newAdvance, amount: Number.parseFloat(e.target.value) || 0 })}
                placeholder="Enter advance amount"
              />
              {/* Show rent amount when rent type is selected */}
              {newAdvance.type === "rent" && newAdvance.business_id && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Monthly Rent:</strong> PKR {getSelectedBusinessRentAmount().toLocaleString()}
                  </p>
                  {newAdvance.amount > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      <strong>Covers:</strong> {calculateMonthsCovered()} months of rent
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="advanceDate">Advance Date</Label>
              <Input
                id="advanceDate"
                type="date"
                value={newAdvance.advance_date}
                onChange={(e) => setNewAdvance({ ...newAdvance, advance_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advanceMonth">Month</Label>
              <Select
                value={newAdvance.month.toString()}
                onValueChange={(value) => setNewAdvance({ ...newAdvance, month: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advanceYear">Year</Label>
              <Select
                value={newAdvance.year.toString()}
                onValueChange={(value) => setNewAdvance({ ...newAdvance, year: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() + i - 2
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advancePurpose">Purpose (Optional)</Label>
              <Input
                id="advancePurpose"
                value={newAdvance.purpose}
                onChange={(e) => setNewAdvance({ ...newAdvance, purpose: e.target.value })}
                placeholder="Enter purpose of advance"
              />
            </div>
          </div>
          <Button onClick={addAdvance} className="bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Add Advance Payment
          </Button>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Business Advance Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances.map((advance) => {
                const business = businesses.find((b) => b.id === advance.business_id)
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                return (
                  <TableRow key={advance.id}>
                    <TableCell className="font-medium">{business?.name || "Unknown"}</TableCell>
                    <TableCell>{business?.shop_number || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        advance.type === "electricity" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        advance.type === "rent" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-green-50 text-green-700 border-green-200"
                      }>
                        {advance.type?.charAt(0).toUpperCase() + advance.type?.slice(1) || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {advance.month && advance.year ? 
                        `${monthNames[advance.month - 1]} ${advance.year}` : 
                        "N/A"
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        PKR {advance.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{advance.advance_date}</TableCell>
                    <TableCell>{advance.purpose || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={advance.status === "active" ? "default" : "secondary"}>
                        {advance.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAdvance(advance.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {advances.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No advance payments found.</p>
              <p className="text-sm">Add advance payments using the form above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderPartialPayments = () => (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Create New Partial Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {partialPaymentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{partialPaymentError}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partialPaymentBusiness">Business</Label>
              <Select
                value={newPartialPayment.business_id}
                onValueChange={(value) => setNewPartialPayment({ ...newPartialPayment, business_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name} - {business.shop_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="partialPaymentMonth">Rent Month</Label>
              <Select
                value={newPartialPayment.month.toString()}
                onValueChange={(value) => setNewPartialPayment({ ...newPartialPayment, month: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="partialPaymentYear">Year</Label>
              <Select
                value={newPartialPayment.year.toString()}
                onValueChange={(value) => setNewPartialPayment({ ...newPartialPayment, year: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 3 }, (_, i) => {
                    const year = new Date().getFullYear() + i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={newPartialPayment.payment_date}
                onChange={(e) => setNewPartialPayment({ ...newPartialPayment, payment_date: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                value={newPartialPayment.payment_amount}
                onChange={(e) => setNewPartialPayment({ ...newPartialPayment, payment_amount: Number.parseFloat(e.target.value) || 0 })}
                placeholder="Enter payment amount"
              />
            </div>
          </div>
          
          {/* Show rent preview */}
          {newPartialPayment.business_id && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-700">
                <span className="font-medium">Monthly Rent:</span>
                <span className="ml-2 text-blue-600 font-semibold">PKR {getSelectedBusinessForPartialPayment()?.rent_amount.toLocaleString()}</span>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="partialPaymentDescription">Description (Optional)</Label>
            <Input
              id="partialPaymentDescription"
              value={newPartialPayment.description}
              onChange={(e) => setNewPartialPayment({ ...newPartialPayment, description: e.target.value })}
              placeholder="Add notes about this payment"
            />
          </div>
          
          <Button onClick={createPartialPaymentRecord} className="bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Partial Payment Record
          </Button>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Partial Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {partialPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No partial payment records found.</p>
                <p className="text-sm">Create partial payment records using the form above.</p>
              </div>
            ) : (
              partialPayments.map((partialPayment) => {
                const business = businesses.find((b) => b.id === partialPayment.business_id)
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                const remainingAmount = partialPayment.total_rent_amount - partialPayment.total_paid_amount
                const statusColor = getStatusColor(partialPayment)
                const statusVariant = getStatusBadgeVariant(partialPayment)
                
                return (
                  <div key={partialPayment.id} className="border rounded-lg">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-sm">
                              {business?.name || "Unknown Business"} - {business?.shop_number}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {monthNames[partialPayment.month - 1]} {partialPayment.year}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right text-sm">
                            <div className={`font-medium ${statusColor}`}>
                              PKR {partialPayment.total_paid_amount.toLocaleString()} / {partialPayment.total_rent_amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Remaining: PKR {remainingAmount.toLocaleString()}
                            </div>
                          </div>
                          <Badge variant={statusVariant}>
                            {getPaymentStatus(partialPayment) === "completed" ? "Completed" : "Pending"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPartialPayment(partialPayment)
                              setAddPaymentDialog(true)
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            disabled={getPaymentStatus(partialPayment) === "completed"}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Payment
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePartialPayment(partialPayment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Payment Entries */}
                      {partialPayment.payment_entries.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="font-medium text-sm mb-3">Payment History</h5>
                          <div className="space-y-2">
                            {partialPayment.payment_entries.map((entry, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                  <div className="text-sm font-medium">PKR {entry.amount.toLocaleString()}</div>
                                  <div className="text-xs text-gray-500">{new Date(entry.payment_date).toLocaleDateString()}</div>
                                </div>
                                {entry.description && (
                                  <div className="text-xs text-gray-600 max-w-xs truncate">{entry.description}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Add Payment Dialog */}
      <Dialog open={addPaymentDialog} onOpenChange={setAddPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Additional Payment</DialogTitle>
          </DialogHeader>
          {selectedPartialPayment && (
            <AddPaymentForm 
              partialPayment={selectedPartialPayment}
              onSubmit={addPaymentToRecord}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  const renderTheft = () => (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Add Theft Record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theftDate">Date</Label>
              <Input
                id="theftDate"
                type="date"
                value={newTheft.date}
                onChange={(e) => setNewTheft({ ...newTheft, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theftBusiness">Business</Label>
              <Select
                value={newTheft.businessId}
                onValueChange={(value) => setNewTheft({ ...newTheft, businessId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name} - {business.shop_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theftAmount">Amount (Optional)</Label>
              <Input
                id="theftAmount"
                type="text"
                value={newTheft.amount}
                onChange={(e) => setNewTheft({ ...newTheft, amount: e.target.value })}
                placeholder="Enter amount if applicable"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theftDescription">Description</Label>
            <Textarea
              id="theftDescription"
              value={newTheft.description}
              onChange={(e) => setNewTheft({ ...newTheft, description: e.target.value })}
              placeholder="Describe the theft incident"
              rows={3}
            />
          </div>
          <Button onClick={addTheftRecord} className="bg-red-600 text-white hover:bg-red-700">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Add Theft Record
          </Button>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Theft Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {theftRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.businessName}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>{record.amount ? `PKR ${record.amount.toLocaleString()}` : "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {theftRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No theft records found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderMeterLoad = () => {
    // Filter businesses to only show those with electricity management enabled
    const electricityManagedBusinesses = businesses.filter(business => business.electricity_management)
    
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Meter Load Management</CardTitle>
          <p className="text-sm text-gray-600">Only businesses with electricity management enabled are shown</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Current Load (KW)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {electricityManagedBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="font-medium">{business.name}</TableCell>
                  <TableCell>{business.shop_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {/* Placeholder for meter load - would need separate table */}0 KW
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Not Connected</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Update Load
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {electricityManagedBusinesses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Electricity Managed Businesses</h3>
              <p className="text-gray-600 mb-4">Only businesses with electricity management enabled will appear here.</p>
              <p className="text-sm text-gray-500">Enable electricity management for businesses in the "View Businesses" section.</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderContent = () => {
    switch (activeSubSection) {
      case "customer-add":
        return renderAddBusiness()
      case "customer-view":
        return renderViewBusiness()
      case "customer-floors":
        return renderFloors()
      case "customer-advance":
        return renderAdvance()
      case "customer-instalments":
        return renderPartialPayments()
      case "customer-theft":
        return renderTheft()
      case "customer-meter-load":
        return renderMeterLoad()
      default:
        return renderViewBusiness()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black">{getSectionTitle()}</h1>
      {renderContent()}
    </div>
  )
}

