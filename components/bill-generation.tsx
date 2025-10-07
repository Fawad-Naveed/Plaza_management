"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileText, Plus, Zap, Wrench, Search, Eye, Download, Loader2, Edit, Trash2, Printer, Flame } from "lucide-react"
import { clientDb, type Business, type Bill as DBBill, type MeterReading, type Floor, type Advance, type PartialPayment, getInformation, type Information, updateMeterReading, type TermsCondition, getTCs, type TC } from "@/lib/database"
import { TermsSelectionDialog } from "./terms-selection-dialog"
import { useBreakpoint } from "@/hooks/use-mobile"

declare global {
  interface Window {
    jsPDF: any
  }
}

interface BillGenerationProps {
  activeSubSection: string
}

export function BillGeneration({ activeSubSection }: BillGenerationProps) {
  const { isMobile, isTablet } = useBreakpoint()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [bills, setBills] = useState<DBBill[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([])
  const [advances, setAdvances] = useState<Advance[]>([])
  const [partialPayments, setPartialPayments] = useState<PartialPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newBill, setNewBill] = useState({
    businessId: "",
    billType: "electricity" as "electricity" | "maintenance" | "combined" | "rent" | "gas",
    electricityUnits: "",
    electricityRate: "8.5",
    gasUnits: "",
    gasRate: "150.0",
    maintenanceAmount: "",
    maintenanceDescription: "",
    waterCharges: "",
    otherCharges: "",
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().getFullYear().toString(),
    dueDate: "",
  })

  // Determine if we're in rent management mode
  const isRentManagement = activeSubSection === "bill-generate" || activeSubSection === "bill-all"
  
  // Determine if we're in electricity management mode
  const isElectricityManagement = activeSubSection === "electricity-generate" || activeSubSection === "electricity-all"

  // Determine if we're in gas management mode
  const isGasManagement = activeSubSection === "gas-all"

  // Filter businesses based on management type
  const filteredBusinesses = businesses.filter(business => {
    if (isRentManagement) {
      return business.rent_management
    } else if (isElectricityManagement) {
      return business.electricity_management
    } else if (isGasManagement) {
      return business.gas_management
    } else if (activeSubSection === "maintenance-generate" || activeSubSection === "maintenance-all") {
      return business.maintenance_management
    }
    // Default: show all businesses
    return true
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<DBBill | null>(null)
  const [editingBill, setEditingBill] = useState<DBBill | null>(null)
  const [viewingBill, setViewingBill] = useState<DBBill | null>(null)
  const [deletingBill, setDeletingBill] = useState<DBBill | null>(null)
  const [deletingMeterReading, setDeletingMeterReading] = useState<MeterReading | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [advanceWarning, setAdvanceWarning] = useState<{
    show: boolean;
    advance: Advance | null;
    businessName: string;
  }>({ show: false, advance: null, businessName: "" })
  
  // Add partial payment dialog state
  const [addingPaymentToPartial, setAddingPaymentToPartial] = useState<PartialPayment | null>(null)
  const [newPartialPaymentEntry, setNewPartialPaymentEntry] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    description: ""
  })
  
  // Add tab state for rent management
  const [billsSubTab, setBillsSubTab] = useState("all")
  
  // Terms and conditions state
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [selectedTerms, setSelectedTerms] = useState<TermsCondition[]>([])
  const [termsText, setTermsText] = useState("")
  const [billCreationLoading, setBillCreationLoading] = useState(false)
  const [availableTerms, setAvailableTerms] = useState<TC[]>([])
  const [selectedTermsIds, setSelectedTermsIds] = useState<string[]>([])
  
  // Form validation state
  const [validationErrors, setValidationErrors] = useState({
    businessId: false,
    month: false,
    dueDate: false
  })

  useEffect(() => {
    loadBillData()
    loadTermsConditions()
    
    // Set bill type based on management mode
    if (isRentManagement) {
      setNewBill(prev => ({ ...prev, billType: "rent" }))
    } else if (isElectricityManagement) {
      setNewBill(prev => ({ ...prev, billType: "electricity" }))
    } else if (isGasManagement) {
      setNewBill(prev => ({ ...prev, billType: "gas" }))
    }
  }, [isRentManagement, isElectricityManagement, isGasManagement])

  // Auto-populate rent amount when bill type is "rent" or in rent management mode and business is selected
  useEffect(() => {
    if ((newBill.billType === "rent" || isRentManagement) && newBill.businessId) {
      const selectedBusiness = businesses.find(b => b.id === newBill.businessId)
      if (selectedBusiness && selectedBusiness.rent_amount) {
        setNewBill(prev => ({
          ...prev,
          maintenanceAmount: selectedBusiness.rent_amount.toString()
        }))
      }
    }
  }, [newBill.billType, newBill.businessId, businesses, isRentManagement])

  const loadBillData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [businessesResult, billsResult, floorsResult, meterReadingsResult, advancesResult, partialPaymentsResult] = await Promise.all([
        clientDb.getBusinesses(),
        clientDb.getBills(),
        clientDb.getFloors(),
        clientDb.getMeterReadings(),
        clientDb.getAdvances(),
        clientDb.getPartialPayments(),
      ])

      if (businessesResult.error) throw businessesResult.error
      if (billsResult.error) throw billsResult.error
      if (floorsResult.error) throw floorsResult.error
      if (meterReadingsResult.error) throw meterReadingsResult.error
      if (advancesResult.error) throw advancesResult.error
      if (partialPaymentsResult.error) throw partialPaymentsResult.error

      setBusinesses(businessesResult.data || [])
      setBills(billsResult.data || [])
      setFloors(floorsResult.data || [])
      setMeterReadings(meterReadingsResult.data || [])
      setAdvances(advancesResult.data || [])
      setPartialPayments(partialPaymentsResult.data || [])
    } catch (err) {
      console.error("[v0] Error loading bill data:", err)
      setError(err instanceof Error ? err.message : "Failed to load bill data")
    } finally {
      setLoading(false)
    }
  }

  const loadTermsConditions = async () => {
    try {
      const terms = await getTCs()
      setAvailableTerms(terms)
    } catch (err) {
      console.error("Error loading terms and conditions:", err)
      // Don't set error state as this is optional functionality
    }
  }

  const generateBillNumber = async (type: string) => {
    const prefix = type === "electricity" ? "ELE" : type === "maintenance" ? "MAIN" : type === "rent" ? "RENT" : type === "gas" ? "GAS" : "COMB"
    const year = new Date().getFullYear()

    // Get all existing bills to find the highest number for this prefix and year
    const { data: existingBills } = await clientDb.getBills()
    const prefixPattern = `${prefix}-${year}-`

    const existingNumbers = (existingBills || [])
      .filter((b) => b.bill_number.startsWith(prefixPattern))
      .map((b) => {
        const numberPart = b.bill_number.replace(prefixPattern, "")
        return Number.parseInt(numberPart, 10)
      })
      .filter((num) => !isNaN(num))

    // Find the next available number
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1

    return `${prefix}-${year}-${nextNumber.toString().padStart(3, "0")}`
  }

  const calculateElectricityAmount = (units: number, rate: number) => {
    return units * rate
  }

  const calculateGasAmount = (units: number, rate: number) => {
    return units * rate
  }

  const getBusinessName = (businessId: string) => {
    const business = businesses.find((b) => b.id === businessId)
    return business ? business.name : "Unknown Business"
  }

  const getBusinessShop = (businessId: string) => {
    const business = businesses.find((b) => b.id === businessId)
    return business ? business.shop_number : "Unknown Shop"
  }

  const getFloorName = (floorNumber: number) => {
    const floor = floors.find((f) => f.floor_number === floorNumber)
    return floor ? floor.floor_name : `Floor ${floorNumber}`
  }

  const getLatestMeterReading = (businessId: string) => {
    const businessReadings = meterReadings
      .filter((r) => r.business_id === businessId && r.meter_type === "electricity")
      .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())
    return businessReadings[0]
  }

  const getLatestGasMeterReading = (businessId: string) => {
    const businessReadings = meterReadings
      .filter((r) => r.business_id === businessId && r.meter_type === "gas")
      .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())
    return businessReadings[0]
  }

  // Check if business has existing advance for the month/year (only for rent management)
  const checkExistingAdvance = (businessId: string, month: string, year: string) => {
    if (isElectricityManagement) return null // No advance checks for electricity
    
    const monthNumber = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ].indexOf(month) + 1
    
    return advances.find(advance => 
      advance.business_id === businessId && 
      advance.type === "rent" &&
      advance.month === monthNumber &&
      advance.year === parseInt(year) &&
      advance.status === "active"
    )
  }
  
  // Helper function to clear validation errors when fields are updated
  const clearValidationError = (field: 'businessId' | 'month' | 'dueDate') => {
    setValidationErrors(prev => ({ ...prev, [field]: false }))
  }

  // Handle adding payment to partial payment record
  const handleAddPaymentToPartial = async () => {
    if (!addingPaymentToPartial || !newPartialPaymentEntry.amount) {
      alert("Please enter a payment amount")
      return
    }

    const paymentAmount = parseFloat(newPartialPaymentEntry.amount)
    if (paymentAmount <= 0) {
      alert("Payment amount must be greater than 0")
      return
    }

    const remainingAmount = addingPaymentToPartial.total_rent_amount - addingPaymentToPartial.total_paid_amount
    if (paymentAmount > remainingAmount) {
      alert(`Payment amount cannot exceed remaining amount of PKR ${remainingAmount.toFixed(2)}`)
      return
    }

    try {
      // Create new payment entry
      const newPaymentEntry = {
        amount: paymentAmount,
        payment_date: newPartialPaymentEntry.payment_date,
        description: newPartialPaymentEntry.description || undefined
      }

      // Update partial payment with new payment entry
      const updatedPaymentEntries = [...addingPaymentToPartial.payment_entries, newPaymentEntry]
      const updatedTotalPaid = addingPaymentToPartial.total_paid_amount + paymentAmount
      const updatedStatus = updatedTotalPaid >= addingPaymentToPartial.total_rent_amount ? "completed" : "active"

      const { error } = await clientDb.updatePartialPayment(addingPaymentToPartial.id, {
        payment_entries: updatedPaymentEntries,
        total_paid_amount: updatedTotalPaid,
        status: updatedStatus as "active" | "completed" | "cancelled"
      })

      if (error) {
        console.error("Error updating partial payment:", error)
        alert("Failed to add payment. Please try again.")
        return
      }

      // Reload data to reflect changes
      await loadBillData()

      // Close dialog and reset form
      setAddingPaymentToPartial(null)
      setNewPartialPaymentEntry({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        description: ""
      })

      alert(`Payment of PKR ${paymentAmount.toFixed(2)} added successfully!`)
    } catch (error) {
      console.error("Error adding payment to partial payment:", error)
      alert("Failed to add payment. Please try again.")
    }
  }

  const handleCreateBillClick = () => {
    // Set current year automatically
    const currentYear = new Date().getFullYear().toString()
    const billWithYear = { ...newBill, year: currentYear }
    
    // Validate required fields
    const errors = {
      businessId: !billWithYear.businessId,
      month: !billWithYear.month,
      dueDate: !billWithYear.dueDate
    }
    
    setValidationErrors(errors)
    
    // If there are validation errors, don't proceed
    if (errors.businessId || errors.month || errors.dueDate) {
      setError("Please fill in all required fields")
      return
    }
    
    // Clear any previous errors
    setError(null)
    
    if (billWithYear.businessId && billWithYear.billType && billWithYear.month && billWithYear.dueDate) {
      // Update the state with current year
      setNewBill(billWithYear)
      
      // For rent management, use selected terms from toggles
      if (isRentManagement || billWithYear.billType === "rent") {
        const selectedTermsData = availableTerms.filter(term => selectedTermsIds.includes(term.id))
        const termsText = selectedTermsData.map(term => `${term.title}: ${term.description || ''}`).join('\n\n')
        createBillWithTerms(selectedTermsData, termsText)
      } else {
        // Show terms selection dialog before creating the bill for other bill types
        setShowTermsDialog(true)
      }
    }
  }

  const handleTermsConfirm = (selectedTerms: TermsCondition[], termsText: string) => {
    setSelectedTerms(selectedTerms)
    setTermsText(termsText)
    setShowTermsDialog(false)
    
    // Now create the bill with the selected terms
    createBillWithTerms(selectedTerms, termsText)
  }

  const handleTermsCancel = () => {
    setShowTermsDialog(false)
    setSelectedTerms([])
    setTermsText("")
  }

  const createBillWithTerms = async (terms: (TermsCondition | TC)[], termsTextValue: string) => {
    // Ensure current year is used
    const currentYear = new Date().getFullYear().toString()
    const billToProcess = { ...newBill, year: currentYear }
    
    if (billToProcess.businessId && billToProcess.billType && billToProcess.month && billToProcess.dueDate) {
      try {
        setBillCreationLoading(true)
        const business = businesses.find((b) => b.id === billToProcess.businessId)
        if (!business) return

        // Check for existing rent advance if generating rent bill
        if ((billToProcess.billType === "rent" || isRentManagement)) {
          const existingAdvance = checkExistingAdvance(billToProcess.businessId, billToProcess.month, billToProcess.year)
          if (existingAdvance) {
            setAdvanceWarning({
              show: true,
              advance: existingAdvance,
              businessName: business.name
            })
            return // Stop bill creation and show warning dialog
          }
        }

        let electricityCharges = 0
        let gasCharges = 0
        let maintenanceCharges = 0
        const waterCharges = isElectricityManagement || isGasManagement ? 0 : (Number.parseFloat(billToProcess.waterCharges) || 0)
        const otherCharges = isElectricityManagement || isGasManagement ? 0 : (Number.parseFloat(billToProcess.otherCharges) || 0)

        if (isElectricityManagement || billToProcess.billType === "electricity" || billToProcess.billType === "combined") {
          const units = Number.parseFloat(billToProcess.electricityUnits) || 0
          const rate = Number.parseFloat(billToProcess.electricityRate) || 0
          electricityCharges = calculateElectricityAmount(units, rate)
        }

        if (isGasManagement || billToProcess.billType === "gas") {
          const units = Number.parseFloat(billToProcess.gasUnits) || 0
          const rate = Number.parseFloat(billToProcess.gasRate) || 0
          gasCharges = calculateGasAmount(units, rate)
        }

        if (billToProcess.billType === "maintenance" || billToProcess.billType === "combined") {
          maintenanceCharges = Number.parseFloat(billToProcess.maintenanceAmount) || 0
        }

        if (billToProcess.billType === "rent" || isRentManagement) {
          // For rent bills, use the rent amount from business data or manual input
          maintenanceCharges = Number.parseFloat(billToProcess.maintenanceAmount) || business.rent_amount || 0
        }

        const totalAmount = electricityCharges + gasCharges + maintenanceCharges + waterCharges + otherCharges

        const billNumber = await generateBillNumber(
          isRentManagement ? "rent" : 
          isElectricityManagement ? "electricity" : 
          isGasManagement ? "gas" :
          billToProcess.billType
        )

        const billData = {
          business_id: billToProcess.businessId,
          bill_number: billNumber,
          bill_date: new Date().toISOString().split("T")[0],
          due_date: billToProcess.dueDate,
          rent_amount: Number(business.rent_amount) || 0,
          maintenance_charges: Number(maintenanceCharges) || 0,
          electricity_charges: Number(electricityCharges) || 0,
          gas_charges: Number(gasCharges) || 0,
          water_charges: Number(waterCharges) || 0,
          other_charges: Number(otherCharges) || 0,
          total_amount: Number(isRentManagement || billToProcess.billType === "rent" 
            ? totalAmount // For rent bills, totalAmount already includes rent via maintenanceCharges
            : totalAmount + (business.rent_amount || 0)) || 0, // For other bills, add rent_amount separately
          status: "pending" as const,
          terms_conditions_ids: terms.map(t => t.id) || null,
          terms_conditions_text: termsTextValue || null,
        }

        // Validate required fields
        const requiredFields = ['business_id', 'bill_number', 'bill_date', 'due_date']
        const missingFields = requiredFields.filter(field => !billData[field])
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
        }
        
        const { error } = await clientDb.createBill(billData)
        if (error) throw error

        await loadBillData() // Reload data

        // Reset form and terms
        setNewBill({
          businessId: "",
          billType: "electricity",
          electricityUnits: "",
          electricityRate: "8.5",
          gasUnits: "",
          gasRate: "150.0",
          maintenanceAmount: "",
          maintenanceDescription: "",
          waterCharges: "",
          otherCharges: "",
          month: new Date().toLocaleString("default", { month: "long" }),
          year: new Date().getFullYear().toString(),
          dueDate: "",
        })
        setSelectedTerms([])
        setTermsText("")
        setSelectedTermsIds([])
        setValidationErrors({ businessId: false, month: false, dueDate: false })
      } catch (err) {
        console.error("[v0] Error creating bill:", err)
        setError(err instanceof Error ? err.message : "Failed to create bill")
      } finally {
        setBillCreationLoading(false)
      }
    }
  }

  // Generate PDF for meter reading with complete history
  const downloadMeterReadingPDF = async (reading: MeterReading) => {
    try {
      // Import jsPDF dynamically with error handling
      const jsPDFModule = await import("jspdf")
      const jsPDF = jsPDFModule.jsPDF
      
      if (!jsPDF) {
        throw new Error("jsPDF not loaded properly")
      }

      const doc = new jsPDF()
      const business = businesses.find((b) => b.id === reading.business_id)

      // Get all meter readings for this business (same type as current reading)
      const { data: allReadings } = await clientDb.getMeterReadings(reading.business_id)
      const businessReadings = (allReadings || [])
        .filter(r => r.meter_type === reading.meter_type)
        .sort((a, b) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime())

      // Get business information for branding
      let businessInfo: Information | null = null
      try {
        businessInfo = await getInformation()
      } catch (error) {
        console.log("No business information found, using default branding")
      }

      let headerYPos = 20

      // Add logo if available
      if (businessInfo?.logo_url) {
        try {
          const img = new Image()
          img.crossOrigin = "anonymous"

          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = businessInfo.logo_url!
          })

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = 30
          canvas.height = 30
          ctx?.drawImage(img, 0, 0, 30, 30)

          const logoDataUrl = canvas.toDataURL('image/png')
          doc.addImage(logoDataUrl, 'PNG', 90, headerYPos - 5, 30, 30)
          headerYPos += 35
        } catch (logoError) {
          console.log("Failed to load logo, proceeding without it")
        }
      }

      // Header with business name or default
      doc.setFontSize(20)
      const businessName = businessInfo?.business_name || "PLAZA MANAGEMENT"
      doc.text(businessName.toUpperCase(), 105, headerYPos, { align: "center" })

      doc.setFontSize(14)
      const invoiceTitle = reading.meter_type === "gas" ? "Gas Meter Reading Invoice" : "Electricity Meter Reading Invoice"
      doc.text(invoiceTitle, 105, headerYPos + 10, { align: "center" })

      // Add contact info if available
      if (businessInfo?.contact_email || businessInfo?.contact_phone) {
        doc.setFontSize(10)
        let contactText = ""
        if (businessInfo.contact_email) contactText += businessInfo.contact_email
        if (businessInfo.contact_phone) {
          if (contactText) contactText += " | "
          contactText += businessInfo.contact_phone
        }
        doc.text(contactText, 105, headerYPos + 20, { align: "center" })
        headerYPos += 10
      }

      // Invoice details
      const invoiceDetailsYPos = headerYPos + 30
      doc.setFontSize(12)
      doc.text("Bill To:", 20, invoiceDetailsYPos)
      doc.text(getBusinessName(reading.business_id) || "Unknown Business", 20, invoiceDetailsYPos + 10)
      doc.text(`Shop: ${getBusinessShop(reading.business_id) || "Unknown Shop"}`, 20, invoiceDetailsYPos + 20)
      doc.text(`${getFloorName(business?.floor_number || 1) || "Floor 1"}`, 20, invoiceDetailsYPos + 30)

      // Invoice info (right side)
      const invoiceNumber = reading.bill_number || `MR-${reading.id.slice(-6).toUpperCase()}`
      doc.text(`Invoice No: ${invoiceNumber}`, 120, invoiceDetailsYPos)
      doc.text(`Reading Date: ${reading.reading_date || 'N/A'}`, 120, invoiceDetailsYPos + 10)
      doc.text(`Meter Type: ${(reading.meter_type || 'electricity').charAt(0).toUpperCase() + (reading.meter_type || 'electricity').slice(1)}`, 120, invoiceDetailsYPos + 20)
      doc.text(`Status: ${reading.payment_status ? reading.payment_status.charAt(0).toUpperCase() + reading.payment_status.slice(1) : 'Pending'}`, 120, invoiceDetailsYPos + 30)

      // Current meter reading details
      let yPos = invoiceDetailsYPos + 50
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text("Current Reading Details:", 20, yPos)
      doc.setFont(undefined, 'normal')
      yPos += 15

      doc.setFontSize(12)
      doc.text(`Previous Reading: ${reading.previous_reading || 0} units`, 20, yPos)
      yPos += 10
      doc.text(`Current Reading: ${reading.current_reading || 0} units`, 20, yPos)
      yPos += 10
      doc.text(`Units Consumed: ${reading.units_consumed || 0} units`, 20, yPos)
      yPos += 10
      doc.text(`Rate per Unit: PKR ${(reading.rate_per_unit || 0).toFixed(2)}/unit`, 20, yPos)
      yPos += 15

      // Calculation breakdown
      doc.setFontSize(10)
      doc.text(`Calculation: ${reading.units_consumed || 0} units × PKR ${(reading.rate_per_unit || 0).toFixed(2)} = PKR ${(reading.amount || 0).toFixed(2)}`, 20, yPos)
      yPos += 15

      // Total amount for current reading
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text(`Current Bill Amount: PKR ${(reading.amount || 0).toFixed(2)}`, 20, yPos)
      doc.setFont(undefined, 'normal')
      yPos += 20

      // Reading History Section
      if (businessReadings.length > 1) {
        doc.setFontSize(14)
        doc.setFont(undefined, 'bold')
        const historyTitle = reading.meter_type === "gas" ? "Gas Reading History:" : "Electricity Reading History:"
        doc.text(historyTitle, 20, yPos)
        doc.setFont(undefined, 'normal')
        yPos += 15

        // Create table headers
        const tableStartY = yPos
        const colWidths = [25, 35, 35, 25, 30, 35] // Date, Prev, Current, Units, Rate, Amount
        const colPositions = [20, 45, 80, 115, 140, 170]
        const rowHeight = 10

        // Table headers
        doc.setFontSize(9)
        doc.setFont(undefined, 'bold')
        doc.text("Date", colPositions[0], yPos)
        doc.text("Previous", colPositions[1], yPos)
        doc.text("Current", colPositions[2], yPos)
        doc.text("Units", colPositions[3], yPos)
        doc.text("Rate", colPositions[4], yPos)
        doc.text("Amount", colPositions[5], yPos)
        
        // Draw header line
        yPos += 3
        doc.line(20, yPos, 200, yPos)
        yPos += 7
        
        doc.setFont(undefined, 'normal')
        
        // Add reading history rows (limit to last 10 readings to prevent overflow)
        const recentReadings = businessReadings.slice(-10)
        
        for (let i = 0; i < recentReadings.length; i++) {
          const historyReading = recentReadings[i]
          
          // Check if we need to add a new page
          if (yPos > 250) {
            doc.addPage()
            yPos = 30
            
            // Add page header
            doc.setFontSize(12)
            doc.setFont(undefined, 'bold')
            const continuedTitle = reading.meter_type === "gas" ? "Gas Reading History (continued):" : "Electricity Reading History (continued):"
            doc.text(continuedTitle, 20, yPos)
            doc.setFont(undefined, 'normal')
            yPos += 15
            
            // Re-add table headers
            doc.setFontSize(9)
            doc.setFont(undefined, 'bold')
            doc.text("Date", colPositions[0], yPos)
            doc.text("Previous", colPositions[1], yPos)
            doc.text("Current", colPositions[2], yPos)
            doc.text("Units", colPositions[3], yPos)
            doc.text("Rate", colPositions[4], yPos)
            doc.text("Amount", colPositions[5], yPos)
            yPos += 3
            doc.line(20, yPos, 200, yPos)
            yPos += 7
            doc.setFont(undefined, 'normal')
          }
          
          // Highlight current reading
          if (historyReading.id === reading.id) {
            doc.setFillColor(255, 255, 0) // Yellow background
            doc.rect(19, yPos - 7, 182, rowHeight, 'F')
            doc.setTextColor(0, 0, 0) // Black text
          }
          
          doc.setFontSize(8)
          doc.text(historyReading.reading_date, colPositions[0], yPos)
          doc.text(`${historyReading.previous_reading}`, colPositions[1], yPos)
          doc.text(`${historyReading.current_reading}`, colPositions[2], yPos)
          doc.text(`${historyReading.units_consumed}`, colPositions[3], yPos)
          doc.text(`${historyReading.rate_per_unit.toFixed(1)}`, colPositions[4], yPos)
          doc.text(`PKR ${historyReading.amount.toFixed(0)}`, colPositions[5], yPos)
          
          yPos += rowHeight
          
          // Reset background color after current reading
          if (historyReading.id === reading.id) {
            doc.setFillColor(255, 255, 255) // Reset to white
          }
        }
        
        // Draw table border
        doc.line(20, tableStartY + 3, 200, tableStartY + 3) // Top border
        doc.line(20, yPos - 3, 200, yPos - 3) // Bottom border
        
        yPos += 10
        
        // Summary of history
        if (businessReadings.length > 10) {
          doc.setFontSize(8)
          doc.setTextColor(100, 100, 100)
          doc.text(`* Showing last 10 readings out of ${businessReadings.length} total readings`, 20, yPos)
          doc.setTextColor(0, 0, 0)
          yPos += 10
        }
        
        // Calculate totals
        const totalUnits = businessReadings.reduce((sum, r) => sum + r.units_consumed, 0)
        const totalAmount = businessReadings.reduce((sum, r) => sum + r.amount, 0)
        
        doc.setFontSize(10)
        doc.text(`Total Historical Consumption: ${totalUnits.toFixed(0)} units`, 20, yPos)
        yPos += 8
        doc.text(`Total Historical Amount: PKR ${totalAmount.toFixed(2)}`, 20, yPos)
        yPos += 15
      }

      // Payment status box
      const statusColor = reading.payment_status === 'paid' ? [34, 197, 94] : [234, 179, 8] // green for paid, yellow for pending
      doc.setFillColor(...statusColor)
      doc.rect(20, yPos, 170, 15, 'F')
      doc.setTextColor(255, 255, 255) // White text
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text(`Payment Status: ${reading.payment_status ? reading.payment_status.toUpperCase() : 'PENDING'}`, 25, yPos + 10)
      doc.setTextColor(0, 0, 0) // Reset to black
      doc.setFont(undefined, 'normal')
      yPos += 25

      // Footer
      doc.setFontSize(10)
      doc.text("Thank you for your business!", 105, yPos, { align: "center" })
      if (reading.payment_status !== 'paid') {
        doc.text("Please settle this invoice at your earliest convenience.", 105, yPos + 10, { align: "center" })
      }
      doc.text("For any queries, please contact the management office.", 105, yPos + 20, { align: "center" })

      // Download the PDF
      const meterType = reading.meter_type === "gas" ? "Gas" : "Electricity"
      const fileName = `${meterType}_Meter_Reading_Invoice_${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error("[v0] Error generating meter reading PDF:", error)
      setError("Failed to generate meter reading invoice. Please try again.")
    }
  }

  // Helper function to get bill terms from stored IDs
  const getBillTerms = async (bill: DBBill): Promise<TC[]> => {
    if (!bill.terms_conditions_ids || bill.terms_conditions_ids.length === 0) {
      return []
    }
    
    try {
      // Get all available terms
      const allTerms = await getTCs()
      // Filter to only include terms that were selected for this bill
      return allTerms.filter(term => bill.terms_conditions_ids!.includes(term.id))
    } catch (error) {
      console.error("Error loading bill terms:", error)
      return []
    }
  }

  const downloadPDF = async (bill: DBBill) => {
    try {
      // Import jsPDF dynamically with error handling
      const jsPDFModule = await import("jspdf")
      const jsPDF = jsPDFModule.jsPDF
      
      if (!jsPDF) {
        throw new Error("jsPDF not loaded properly")
      }

      const doc = new jsPDF()
      const business = businesses.find((b) => b.id === bill.business_id)
      
      // Get terms for this bill
      const billTerms = await getBillTerms(bill)

      // Get business information for branding
      let businessInfo: Information | null = null
      try {
        businessInfo = await getInformation()
      } catch (error) {
        console.log("No business information found, using default branding")
      }

      let headerYPos = 20

      // Add logo if available
      if (businessInfo?.logo_url) {
        try {
          // Create an image element to load the logo
          const img = new Image()
          img.crossOrigin = "anonymous"

          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = businessInfo.logo_url!
          })

          // Add logo to PDF (centered, 30x30 size)
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = 30
          canvas.height = 30
          ctx?.drawImage(img, 0, 0, 30, 30)

          const logoDataUrl = canvas.toDataURL('image/png')
          doc.addImage(logoDataUrl, 'PNG', 90, headerYPos - 5, 30, 30)
          headerYPos += 35
        } catch (logoError) {
          console.log("Failed to load logo, proceeding without it")
        }
      }

      // Header with business name or default
      doc.setFontSize(20)
      const businessName = businessInfo?.business_name || "PLAZA MANAGEMENT"
      doc.text(businessName.toUpperCase(), 105, headerYPos, { align: "center" })

      doc.setFontSize(14)
      // Determine bill type based on bill number or management mode
      const isRentBill = bill.bill_number.startsWith('RENT') || isRentManagement
      const billTypeText = isRentBill ? "Rent Bill" : "Electricity & Maintenance Bill"
      doc.text(billTypeText, 105, headerYPos + 10, { align: "center" })

      // Add contact info if available
      if (businessInfo?.contact_email || businessInfo?.contact_phone) {
        doc.setFontSize(10)
        let contactText = ""
        if (businessInfo.contact_email) contactText += businessInfo.contact_email
        if (businessInfo.contact_phone) {
          if (contactText) contactText += " | "
          contactText += businessInfo.contact_phone
        }
        doc.text(contactText, 105, headerYPos + 20, { align: "center" })
        headerYPos += 10
      }

      // Bill details (adjust position based on header height)
      const billDetailsYPos = headerYPos + 30
      doc.setFontSize(12)
      doc.text("Bill To:", 20, billDetailsYPos)
      doc.text(getBusinessName(bill.business_id) || "Unknown Business", 20, billDetailsYPos + 10)
      doc.text(`Shop: ${getBusinessShop(bill.business_id) || "Unknown Shop"}`, 20, billDetailsYPos + 20)
      doc.text(`${getFloorName(business?.floor_number || 1) || "Floor 1"}`, 20, billDetailsYPos + 30)

      // Bill info (right side)
      doc.text(`Bill No: ${bill.bill_number}`, 120, billDetailsYPos)
      doc.text(`Date: ${bill.bill_date}`, 120, billDetailsYPos + 10)
      doc.text(`Due Date: ${bill.due_date}`, 120, billDetailsYPos + 20)

      // Charges breakdown (adjust position)
      let yPos = billDetailsYPos + 50
      doc.text("Charges Breakdown:", 20, yPos)
      yPos += 10

      // For rent bills, only show rent amount (maintenance_charges is the rent amount for RENT bills)
      if (isRentBill) {
        doc.text(`Rent Amount: PKR ${bill.maintenance_charges.toFixed(2)}`, 20, yPos)
        yPos += 10
      } else {
        // For non-rent bills, show all applicable charges
        doc.text(`Rent Amount: PKR ${bill.rent_amount.toFixed(2)}`, 20, yPos)
        yPos += 10

        if (bill.electricity_charges > 0) {
          doc.text(`Electricity Charges: PKR ${bill.electricity_charges.toFixed(2)}`, 20, yPos)
          yPos += 10
        }

        if (bill.maintenance_charges > 0) {
          doc.text(`Maintenance Charges: PKR ${bill.maintenance_charges.toFixed(2)}`, 20, yPos)
          yPos += 10
        }
      }

      // Show additional charges for all bill types (if applicable)
      if (bill.water_charges > 0) {
        doc.text(`Water Charges: PKR ${bill.water_charges.toFixed(2)}`, 20, yPos)
        yPos += 10
      }

      if (bill.other_charges > 0) {
        doc.text(`Other Charges: PKR ${bill.other_charges.toFixed(2)}`, 20, yPos)
        yPos += 10
      }

      // Total
      yPos += 10
      doc.setFontSize(14)
      doc.text(`Total Amount: PKR ${bill.total_amount.toFixed(2)}`, 20, yPos)

      // Terms and conditions section (if any terms are associated with this bill)
      if (billTerms.length > 0) {
        yPos += 20
        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        doc.text("Terms and Conditions:", 20, yPos)
        doc.setFont(undefined, 'normal')
        yPos += 10
        
        doc.setFontSize(9)
        billTerms.forEach((term, index) => {
          // Check if we need a new page
          if (yPos > 250) {
            doc.addPage()
            yPos = 30
            doc.setFontSize(12)
            doc.setFont(undefined, 'bold')
            doc.text("Terms and Conditions (continued):", 20, yPos)
            doc.setFont(undefined, 'normal')
            yPos += 15
            doc.setFontSize(9)
          }
          
          // Add term title
          doc.setFont(undefined, 'bold')
          doc.text(`${index + 1}. ${term.title}`, 20, yPos)
          doc.setFont(undefined, 'normal')
          yPos += 5
          
          // Add term description if available
          if (term.description) {
            const descriptionLines = doc.splitTextToSize(term.description, 170)
            doc.text(descriptionLines, 25, yPos)
            yPos += descriptionLines.length * 4
          }
          
          yPos += 5 // Space between terms
        })
        
        yPos += 10
      }

      // Footer
      yPos += 20
      doc.setFontSize(10)
      doc.text("Thank you for your business!", 105, yPos, { align: "center" })
      doc.text("Please pay by the due date to avoid late fees.", 105, yPos + 10, { align: "center" })

      // Download the PDF
      doc.save(`Bill_${bill.bill_number}.pdf`)
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      setError("Failed to generate PDF. Please try again.")
    }
  }

  const handleEditBill = (bill: DBBill) => {
    setEditingBill(bill)
    setIsEditMode(true)

    // Pre-populate the form with bill data
    const business = businesses.find(b => b.id === bill.business_id)
    setNewBill({
      businessId: bill.business_id,
      billType: bill.bill_number.startsWith('RENT') ? 'rent' :
        bill.bill_number.startsWith('ELE') ? 'electricity' :
          bill.bill_number.startsWith('MAIN') ? 'maintenance' : 'combined',
      electricityUnits: "", // Will be calculated from electricity_charges if needed
      electricityRate: "8.5", // Default rate
      maintenanceAmount: bill.maintenance_charges?.toString() || "",
      maintenanceDescription: "", // Not stored in database
      waterCharges: bill.water_charges?.toString() || "",
      otherCharges: bill.other_charges?.toString() || "",
      month: new Date().toLocaleString("default", { month: "long" }), // Default to current month
      year: new Date().getFullYear().toString(), // Default to current year
      dueDate: bill.due_date || "",
    })
  }

  const handleUpdateBill = async () => {
    if (!editingBill) return

    try {
      setLoading(true)

      const electricityCharges = parseFloat(newBill.electricityUnits) * parseFloat(newBill.electricityRate) || 0
      const maintenanceCharges = parseFloat(newBill.maintenanceAmount) || 0
      const waterCharges = isElectricityManagement ? 0 : (parseFloat(newBill.waterCharges) || 0)
      const otherCharges = isElectricityManagement ? 0 : (parseFloat(newBill.otherCharges) || 0)
      const totalAmount = electricityCharges + maintenanceCharges + waterCharges + otherCharges

      const updatedBillData = {
        business_id: newBill.businessId,
        electricity_charges: electricityCharges,
        maintenance_charges: maintenanceCharges,
        water_charges: waterCharges,
        other_charges: otherCharges,
        total_amount: totalAmount,
        due_date: newBill.dueDate,
      }

      const { error } = await clientDb.updateBill(editingBill.id, updatedBillData)

      if (error) throw error

      // Reload bills to show updated data
      await loadBillData()

      // Reset form and close edit mode
      setIsEditMode(false)
      setEditingBill(null)
      setNewBill({
        businessId: "",
        billType: "electricity",
        electricityUnits: "",
        electricityRate: "8.5",
        maintenanceAmount: "",
        maintenanceDescription: "",
        waterCharges: "",
        otherCharges: "",
        month: new Date().toLocaleString("default", { month: "long" }),
        year: new Date().getFullYear().toString(),
        dueDate: "",
      })

    } catch (error) {
      console.error("[v0] Error updating bill:", error)
      setError("Failed to update bill. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBill = async () => {
    if (!deletingBill) return

    try {
      setLoading(true)

      const { error } = await clientDb.deleteBill(deletingBill.id)

      if (error) throw error

      // Reload bills to show updated data
      await loadBillData()

      // Close delete dialog
      setDeletingBill(null)

    } catch (error) {
      console.error("[v0] Error deleting bill:", error)
      setError("Failed to delete bill. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMeterReading = async () => {
    if (!deletingMeterReading) return

    try {
      setLoading(true)

      const { error } = await clientDb.deleteMeterReading(deletingMeterReading.id)

      if (error) throw error

      // Reload data to show updated list
      await loadBillData()

      // Close delete dialog
      setDeletingMeterReading(null)

    } catch (error) {
      console.error("[v0] Error deleting meter reading:", error)
      setError("Failed to delete meter reading. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewBill = (bill: DBBill) => {
    setViewingBill(bill)
  }

  const handleStatusChange = async (billId: string, newStatus: "pending" | "paid" | "waveoff") => {
    try {
      setLoading(true)
      
      const { error } = await clientDb.updateBill(billId, { status: newStatus })
      
      if (error) throw error
      
      // If marking as paid, create a payment record with admin tracking
      if (newStatus === "paid") {
        // Get current auth state for admin info
        const { getAuthState } = await import('@/lib/auth')
        const authState = getAuthState()
        
        const bill = bills.find(b => b.id === billId)
        if (bill) {
          const paymentData = {
            business_id: bill.business_id,
            bill_id: billId,
            payment_date: new Date().toISOString().split('T')[0],
            amount: bill.total_amount,
            payment_method: 'cash' as const, // Default payment method when marked by admin
            notes: `Marked as paid by ${authState?.role === 'admin' ? 'admin' : 'business user'}`,
            admin_id: authState?.role === 'admin' ? 'admin' : authState?.businessId,
            marked_paid_by: authState?.role === 'admin' ? 'Admin' : authState?.businessName || 'Business User',
            marked_paid_date: new Date().toISOString()
          }
          
          const paymentResult = await clientDb.createPayment(paymentData)
          if (paymentResult.error) {
            console.error('Error creating payment record:', paymentResult.error)
          }
        }
      }
      
      // Reload bills to show updated status
      await loadBillData()
      
    } catch (error) {
      console.error("Error updating bill status:", error)
      setError("Failed to update bill status. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Generate bill number for meter readings
  const generateMeterReadingBillNumber = async () => {
    const prefix = "ELE-MR"
    const year = new Date().getFullYear()

    // Get all existing meter readings with bill numbers
    const { data: existingReadings } = await clientDb.getMeterReadings()
    const prefixPattern = `${prefix}-${year}-`

    const existingNumbers = (existingReadings || [])
      .filter((r) => r.bill_number && r.bill_number.startsWith(prefixPattern))
      .map((r) => {
        const numberPart = r.bill_number!.replace(prefixPattern, "")
        return Number.parseInt(numberPart, 10)
      })
      .filter((num) => !isNaN(num))

    // Find the next available number
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1

    return `${prefix}-${year}-${nextNumber.toString().padStart(3, "0")}`
  }

  // Handle meter reading status change with schema refresh and retry logic
  const handleMeterReadingStatusChange = async (readingId: string, newStatus: "pending" | "paid" | "waveoff") => {
    try {
      console.log("Starting meter reading status update for:", readingId, "to:", newStatus)
      
      const reading = meterReadings.find(r => r.id === readingId)
      if (!reading) {
        console.error("Meter reading not found:", readingId)
        setError("Meter reading not found")
        return
      }

      // Generate bill number if it doesn't exist
      let billNumber = reading.bill_number
      if (!billNumber) {
        console.log("Generating new bill number for meter reading")
        billNumber = await generateMeterReadingBillNumber()
        console.log("Generated bill number:", billNumber)
      }
      
      console.log("Updating meter reading with:", { 
        payment_status: newStatus,
        bill_number: billNumber
      })
      
      // Try direct database update with supabase client
      const supabase = clientDb['getClient']()
      
      // First, let's try updating with a raw query to bypass schema cache
      const { data, error } = await supabase
        .from('meter_readings')
        .update({ 
          payment_status: newStatus,
          bill_number: billNumber
        })
        .eq('id', readingId)
        .select()
      
      if (error) {
        console.error("Direct update error:", error)
        
        // If schema cache error, try to refresh the schema by doing a simple select first
        if (error.message.includes('schema cache') || error.message.includes('Could not find')) {
          console.log("Schema cache issue detected, attempting refresh...")
          
          // Try to refresh schema cache by doing a simple select
          await supabase.from('meter_readings').select('id').limit(1)
          
          // Wait a moment
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Retry the update
          const retryResult = await supabase
            .from('meter_readings')
            .update({ 
              payment_status: newStatus,
              bill_number: billNumber
            })
            .eq('id', readingId)
            .select()
          
          if (retryResult.error) {
            throw retryResult.error
          }
          
          console.log("Retry successful:", retryResult.data)
        } else {
          throw error
        }
      } else {
      console.log("Update successful:", data)
      }
      
      // If marking as paid, create a payment record with admin tracking
      if (newStatus === "paid") {
        const { getAuthState } = await import('@/lib/auth')
        const authState = getAuthState()
        
        const paymentData = {
          business_id: reading.business_id,
          payment_date: new Date().toISOString().split('T')[0],
          amount: reading.amount,
          payment_method: 'cash' as const, // Default payment method when marked by admin
          notes: `Electricity meter reading marked as paid by ${authState?.role === 'admin' ? 'admin' : 'business user'}`,
          admin_id: authState?.role === 'admin' ? 'admin' : authState?.businessId,
          marked_paid_by: authState?.role === 'admin' ? 'Admin' : authState?.businessName || 'Business User',
          marked_paid_date: new Date().toISOString()
        }
        
        const paymentResult = await clientDb.createPayment(paymentData)
        if (paymentResult.error) {
          console.error('Error creating payment record for meter reading:', paymentResult.error)
        }
      }
      
      // Reload data to show updated status
      console.log("Reloading bill data...")
      await loadBillData()
      console.log("Status update completed successfully")
      
    } catch (error) {
      console.error("Error updating meter reading status:", error)
      setError(`Failed to update meter reading status: ${error instanceof Error ? error.message : 'Unknown error'}. Please refresh the page and try again.`)
    }
  }

  const filteredBills = bills.filter((bill) => {
    const businessName = getBusinessName(bill.business_id)
    const shopNumber = getBusinessShop(bill.business_id)
    const matchesSearch = (
      businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shopNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    // Filter by management mode
    if (isRentManagement) {
      return matchesSearch && bill.bill_number.startsWith('RENT')
    } else if (isElectricityManagement) {
      return matchesSearch && bill.bill_number.startsWith('ELE')
    } else if (isGasManagement) {
      return matchesSearch && bill.bill_number.startsWith('GAS')
    }
    
    return matchesSearch
  })

  // Get electricity meter readings for electricity management
  const filteredMeterReadings = isElectricityManagement ? meterReadings.filter((reading) => {
    const businessName = getBusinessName(reading.business_id)
    const shopNumber = getBusinessShop(reading.business_id)
    const matchesSearch = (
      businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reading.bill_number && reading.bill_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      shopNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    return reading.meter_type === "electricity" && matchesSearch
  }) : []

  // Get gas meter readings for gas management
  const filteredGasMeterReadings = isGasManagement ? meterReadings.filter((reading) => {
    const businessName = getBusinessName(reading.business_id)
    const shopNumber = getBusinessShop(reading.business_id)
    const matchesSearch = (
      businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reading.bill_number && reading.bill_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      shopNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    return reading.meter_type === "gas" && matchesSearch
  }) : []

  // Get rent advances to display alongside bills in rent management mode (not for electricity)
  const rentAdvances = isRentManagement ? advances.filter(advance => 
    advance.type === "rent" && 
    advance.status === "active" &&
    (searchTerm === "" || 
     getBusinessName(advance.business_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
     getBusinessShop(advance.business_id).toLowerCase().includes(searchTerm.toLowerCase()))
  ) : []

  // Get partial payments for rent management mode
  const filteredPartialPayments = isRentManagement ? partialPayments.filter(partialPayment => 
    partialPayment.status === "active" &&
    (searchTerm === "" || 
     getBusinessName(partialPayment.business_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
     getBusinessShop(partialPayment.business_id).toLowerCase().includes(searchTerm.toLowerCase()))
  ) : []

  // Filter bills by status for rent management
  const paidBills = filteredBills.filter(bill => bill.status === "paid")
  const unpaidBills = filteredBills.filter(bill => bill.status === "pending" || bill.status === "overdue")

  // Filter meter readings by status for electricity management
  const paidMeterReadings = filteredMeterReadings.filter(reading => reading.payment_status === "paid")
  const unpaidMeterReadings = filteredMeterReadings.filter(reading => reading.payment_status === "pending" || reading.payment_status === "overdue" || !reading.payment_status)

  // Filter gas meter readings by status for gas management
  const paidGasMeterReadings = filteredGasMeterReadings.filter(reading => reading.payment_status === "paid")
  const unpaidGasMeterReadings = filteredGasMeterReadings.filter(reading => reading.payment_status === "pending" || reading.payment_status === "overdue" || !reading.payment_status)

  // Filter partial payments by status
  const paidPartialPayments = filteredPartialPayments.filter(partialPayment => 
    partialPayment.total_paid_amount >= partialPayment.total_rent_amount
  )
  const unpaidPartialPayments = filteredPartialPayments.filter(partialPayment => 
    partialPayment.total_paid_amount < partialPayment.total_rent_amount
  )

  // Get bills based on current sub-tab
  const getCurrentBills = () => {
    switch (billsSubTab) {
      case "paid":
        return paidBills
      case "unpaid":
        return unpaidBills
      default:
        return filteredBills
    }
  }

  // Get meter readings based on current sub-tab (only for electricity management)
  const getCurrentMeterReadings = () => {
    if (!isElectricityManagement) return []
    
    switch (billsSubTab) {
      case "paid":
        return paidMeterReadings
      case "unpaid":
        return unpaidMeterReadings
      default:
        return filteredMeterReadings
    }
  }

  // Get gas meter readings based on current sub-tab (only for gas management)
  const getCurrentGasMeterReadings = () => {
    if (!isGasManagement) return []
    
    switch (billsSubTab) {
      case "paid":
        return paidGasMeterReadings
      case "unpaid":
        return unpaidGasMeterReadings
      default:
        return filteredGasMeterReadings
    }
  }

  // Get current advances based on sub-tab (only for rent management, not electricity)
  const getCurrentAdvances = () => {
    if (!isRentManagement || isElectricityManagement) return []
    
    switch (billsSubTab) {
      case "paid":
        return rentAdvances // Advances are considered "paid" since they are prepayments
      case "unpaid":
        return [] // Advances don't show in unpaid tab
      default:
        return rentAdvances // Show all advances in "all" tab
    }
  }

  // Get current partial payments based on sub-tab (only for rent management)
  const getCurrentPartialPayments = () => {
    if (!isRentManagement) return []
    
    switch (billsSubTab) {
      case "paid":
        return paidPartialPayments
      case "unpaid":
        return unpaidPartialPayments
      default:
        return filteredPartialPayments
    }
  }

  const getSectionTitle = () => {
    if (isEditMode) {
      return "Edit Bill"
    }

    switch (activeSubSection) {
      case "bill-generate":
        return isRentManagement ? "Generate Rent Bill" : "Generate Bill"
      case "bill-all":
        return isRentManagement ? "All Rent Bills" : "All Bills"
      case "electricity-generate":
        return "Generate Electricity Bill"
      case "electricity-all":
        return "All Electricity Bills"
      case "gas-all":
        return "All Gas Bills"
      default:
        if (isRentManagement) return "Rent Bill Generation"
        if (isElectricityManagement) return "Electricity Bill Generation"
        if (isGasManagement) return "Gas Bill Generation"
        return "Bill Generation"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading bill data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading bills: {error}</p>
          <Button onClick={loadBillData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const renderGenerateBill = () => (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {isEditMode ? `Edit Bill - ${editingBill?.bill_number}` : 
           isRentManagement ? "Generate New Rent Bill" :
           isElectricityManagement ? "Generate New Electricity Bill" :
           isGasManagement ? "Generate New Gas Bill" : "Generate New Bill"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="business" className={validationErrors.businessId ? "text-red-500" : ""}>Business *</Label>
            <Select
              value={newBill.businessId}
              onValueChange={(value) => {
                const selectedBusiness = businesses.find(b => b.id === value)
                clearValidationError('businessId')
                setNewBill({ ...newBill, businessId: value })

                // Auto-populate electricity data from latest meter reading when in electricity management or electricity bill type
                if (isElectricityManagement || newBill.billType === "electricity" || newBill.billType === "combined") {
                  const latestReading = getLatestMeterReading(value)
                  if (latestReading) {
                    setNewBill((prev) => ({
                      ...prev,
                      businessId: value,
                      electricityUnits: latestReading.units_consumed.toString(),
                      electricityRate: latestReading.rate_per_unit.toString(),
                    }))
                  } else {
                    setNewBill((prev) => ({
                      ...prev,
                      businessId: value,
                    }))
                  }
                }
              }}
            >
              <SelectTrigger className={validationErrors.businessId ? "border-red-500" : ""}>
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                {filteredBusinesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name} - {business.shop_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isRentManagement && !isElectricityManagement && (
            <div className="space-y-2">
              <Label htmlFor="billType">Bill Type</Label>
              <Select
                value={newBill.billType}
                onValueChange={(value: "electricity" | "maintenance" | "combined" | "rent") =>
                  setNewBill({ ...newBill, billType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent Only</SelectItem>
                  <SelectItem value="electricity">Electricity Only</SelectItem>
                  <SelectItem value="maintenance">Maintenance Only</SelectItem>
                  <SelectItem value="combined">Combined Bill</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="month" className={validationErrors.month ? "text-red-500" : ""}>Month *</Label>
            <Select value={newBill.month} onValueChange={(value) => {
              clearValidationError('month')
              setNewBill({ ...newBill, month: value })
            }}>
              <SelectTrigger className={validationErrors.month ? "border-red-500" : ""}>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div className="space-y-2">
            <Label htmlFor="dueDate" className={validationErrors.dueDate ? "text-red-500" : ""}>Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={newBill.dueDate}
              onChange={(e) => {
                clearValidationError('dueDate')
                setNewBill({ ...newBill, dueDate: e.target.value })
              }}
              className={validationErrors.dueDate ? "border-red-500" : ""}
            />
          </div>
        </div>

        {(isElectricityManagement || (!isRentManagement && (newBill.billType === "electricity" || newBill.billType === "combined"))) && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Electricity Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="electricityUnits">Units Consumed</Label>
                <Input
                  id="electricityUnits"
                  type="text"
                  value={newBill.electricityUnits}
                  onChange={(e) => setNewBill({ ...newBill, electricityUnits: e.target.value })}
                  placeholder="Enter units"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="electricityRate">Rate per Unit (PKR )</Label>
                <Input
                  id="electricityRate"
                  type="text"
                  step="0.1"
                  value={newBill.electricityRate}
                  onChange={(e) => setNewBill({ ...newBill, electricityRate: e.target.value })}
                  placeholder="8.5"
                />
              </div>
            </div>
            {newBill.electricityUnits && newBill.electricityRate && (
              <div className="text-sm text-gray-600">
                Electricity Amount: PKR
                {calculateElectricityAmount(
                  Number.parseFloat(newBill.electricityUnits),
                  Number.parseFloat(newBill.electricityRate),
                ).toFixed(2)}
              </div>
            )}
          </div>
        )}

        {(isGasManagement || (!isRentManagement && !isElectricityManagement && newBill.billType === "gas")) && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Gas Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gasUnits">Units Consumed</Label>
                <Input
                  id="gasUnits"
                  type="text"
                  value={newBill.gasUnits}
                  onChange={(e) => setNewBill({ ...newBill, gasUnits: e.target.value })}
                  placeholder="Enter units"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gasRate">Rate per Unit (PKR )</Label>
                <Input
                  id="gasRate"
                  type="text"
                  step="0.1"
                  value={newBill.gasRate}
                  onChange={(e) => setNewBill({ ...newBill, gasRate: e.target.value })}
                  placeholder="150.0"
                />
              </div>
            </div>
            {newBill.gasUnits && newBill.gasRate && (
              <div className="text-sm text-gray-600">
                Gas Amount: PKR
                {calculateGasAmount(
                  Number.parseFloat(newBill.gasUnits),
                  Number.parseFloat(newBill.gasRate),
                ).toFixed(2)}
              </div>
            )}
          </div>
        )}

        {!isElectricityManagement && (newBill.billType === "rent" || isRentManagement) && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              Rent Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentAmount">Rent Amount (PKR)</Label>
                <Input
                  id="rentAmount"
                  type="text"
                  value={newBill.maintenanceAmount}
                  onChange={(e) => setNewBill({ ...newBill, maintenanceAmount: e.target.value })}
                  placeholder="Auto-filled from business data"
                />
                <p className="text-xs text-gray-500">
                  Amount is automatically filled from business rent data
                </p>
              </div>
            </div>
          </div>
        )}

        {!isRentManagement && !isElectricityManagement && (newBill.billType === "maintenance" || newBill.billType === "combined") && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-500" />
              Maintenance Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenanceAmount">Maintenance Amount (PKR )</Label>
                <Input
                  id="maintenanceAmount"
                  type="text"
                  value={newBill.maintenanceAmount}
                  onChange={(e) => setNewBill({ ...newBill, maintenanceAmount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenanceDescription">Description</Label>
              <Textarea
                id="maintenanceDescription"
                value={newBill.maintenanceDescription}
                onChange={(e) => setNewBill({ ...newBill, maintenanceDescription: e.target.value })}
                placeholder="Describe maintenance work"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Terms & Conditions Section - only show for rent management */}
        {isRentManagement && availableTerms.length > 0 && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              Terms & Conditions
            </h3>
            <p className="text-sm text-gray-600">
              Select the terms and conditions to include in this bill:
            </p>
            <div className="space-y-3">
              {availableTerms.map((term) => (
                <div key={term.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Switch
                    id={`term-${term.id}`}
                    checked={selectedTermsIds.includes(term.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTermsIds([...selectedTermsIds, term.id])
                      } else {
                        setSelectedTermsIds(selectedTermsIds.filter(id => id !== term.id))
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`term-${term.id}`} className="text-sm font-medium cursor-pointer">
                      {term.title}
                    </Label>
                    {term.description && (
                      <p className="text-sm text-gray-500 mt-1">{term.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Effective Date: {new Date(term.effective_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {selectedTermsIds.length > 0 && (
              <div className="text-sm text-green-600">
                {selectedTermsIds.length} term{selectedTermsIds.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        )}

        {!isElectricityManagement && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Additional Charges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="waterCharges">Water Charges (PKR )</Label>
                <Input
                  id="waterCharges"
                  type="text"
                  value={newBill.waterCharges}
                  onChange={(e) => setNewBill({ ...newBill, waterCharges: e.target.value })}
                  placeholder="Enter water charges"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherCharges">Other Charges (PKR )</Label>
                <Input
                  id="otherCharges"
                  type="text"
                  value={newBill.otherCharges}
                  onChange={(e) => setNewBill({ ...newBill, otherCharges: e.target.value })}
                  placeholder="Enter other charges"
                />
              </div>
            </div>
          </div>
        )}

        {(validationErrors.businessId || validationErrors.month || validationErrors.dueDate) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium">Please fill in the following required fields:</p>
            <ul className="text-red-600 text-sm mt-1 list-disc list-inside">
              {validationErrors.businessId && <li>Business</li>}
              {validationErrors.month && <li>Month</li>}
              {validationErrors.dueDate && <li>Due Date</li>}
            </ul>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={isEditMode ? handleUpdateBill : handleCreateBillClick}
            className="bg-black text-white hover:bg-gray-800"
            disabled={billCreationLoading}
          >
            {billCreationLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Bill...
              </>
            ) : isEditMode ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Update Bill
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {isRentManagement ? "Create Rent Bill" : 
                 isElectricityManagement ? "Create Electricity Bill" : "Create Bill"}
              </>
            )}
          </Button>
          {isEditMode && (
            <Button
              variant="outline"
              onClick={() => {
                setIsEditMode(false)
                setEditingBill(null)
                setSelectedTermsIds([])
                setNewBill({
                  businessId: "",
                  billType: "electricity",
                  electricityUnits: "",
                  electricityRate: "8.5",
                  maintenanceAmount: "",
                  maintenanceDescription: "",
                  waterCharges: "",
                  otherCharges: "",
                  month: new Date().toLocaleString("default", { month: "long" }),
                  year: new Date().getFullYear().toString(),
                  dueDate: "",
                })
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderBillListCard = () => (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          {isRentManagement && billsSubTab === "all" && "All Rent Bills"}
          {isRentManagement && billsSubTab === "paid" && "Paid Rent Bills"}
          {isRentManagement && billsSubTab === "unpaid" && "Unpaid Rent Bills"}
          {isElectricityManagement && billsSubTab === "all" && "All Electricity Bills"}
          {isElectricityManagement && billsSubTab === "paid" && "Paid Electricity Bills"}
          {isElectricityManagement && billsSubTab === "unpaid" && "Unpaid Electricity Bills"}
          {isGasManagement && billsSubTab === "all" && "All Gas Bills"}
          {isGasManagement && billsSubTab === "paid" && "Paid Gas Bills"}
          {isGasManagement && billsSubTab === "unpaid" && "Unpaid Gas Bills"}
          <div className="flex items-center gap-2">
            {(isElectricityManagement || isGasManagement) && !isMobile && (
              <Button
                onClick={() => {
                  // Switch to bill generation mode
                  if (isElectricityManagement) {
                    window.location.hash = 'electricity-generate'
                  } else if (isGasManagement) {
                    window.location.hash = 'gas-generate'
                  }
                }}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isElectricityManagement ? "Generate New Electricity Bill" : "Generate New Gas Bill"}
              </Button>
            )}
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{(isElectricityManagement || isGasManagement) ? "Bill Number" : "Bill/Advance Number"}</TableHead>
              <TableHead>Customer</TableHead>
              {(isElectricityManagement || isGasManagement) && <TableHead>Units</TableHead>}
              {(isElectricityManagement || isGasManagement) && <TableHead>Rate</TableHead>}
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              {isRentManagement && <TableHead>Advance Payment</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Regular Bills */}
            {getCurrentBills().map((bill) => {
              // Calculate units from charges and rate (for electricity and gas bills)
              const estimatedElectricityUnits = bill.electricity_charges > 0 && bill.electricity_charges / 8.5 || 0
              const estimatedElectricityRate = bill.electricity_charges > 0 && estimatedElectricityUnits > 0 ? bill.electricity_charges / estimatedElectricityUnits : 8.5
              const estimatedGasUnits = bill.gas_charges > 0 && bill.gas_charges / 150.0 || 0
              const estimatedGasRate = bill.gas_charges > 0 && estimatedGasUnits > 0 ? bill.gas_charges / estimatedGasUnits : 150.0
              
              return (
                <TableRow key={`bill-${bill.id}`}>
                  <TableCell className="font-medium">{bill.bill_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getBusinessName(bill.business_id)}</div>
                      <div className="text-sm text-gray-500">{getBusinessShop(bill.business_id)}</div>
                    </div>
                  </TableCell>
                  {(isElectricityManagement || isGasManagement) && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isElectricityManagement ? (
                          <>
                            <Zap className="h-3 w-3 text-yellow-500" />
                            <span>{Math.round(estimatedElectricityUnits)} units</span>
                          </>
                        ) : (
                          <>
                            <Flame className="h-3 w-3 text-orange-500" />
                            <span>{Math.round(estimatedGasUnits)} units</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {(isElectricityManagement || isGasManagement) && (
                    <TableCell>
                      {isElectricityManagement 
                        ? `PKR ${estimatedElectricityRate.toFixed(1)}/unit`
                        : `PKR ${estimatedGasRate.toFixed(1)}/unit`
                      }
                    </TableCell>
                  )}
                  <TableCell>PKR {bill.total_amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Select
                    value={bill.status}
                    onValueChange={(value: "pending" | "paid" | "waveoff") => handleStatusChange(bill.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>
                        <Badge variant={bill.status === "paid" ? "default" : bill.status === "waveoff" ? "outline" : "secondary"}>
                          {bill.status === "pending" ? "Unpaid" : bill.status === "paid" ? "Paid" : bill.status === "waveoff" ? "Waved Off" : bill.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span>Unpaid</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="paid">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Paid</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="waveoff">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Waved Off</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                {isRentManagement && (
                  <TableCell>
                    {(() => {
                      const monthNumber = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ].indexOf(bill.month) + 1
                      
                      const existingAdvance = advances.find(advance => 
                        advance.business_id === bill.business_id && 
                        advance.type === "rent" &&
                        advance.month === monthNumber &&
                        advance.year === parseInt(bill.year) &&
                        advance.status === "active"
                      )
                      
                      if (existingAdvance) {
                        return (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                              Advance Paid
                            </Badge>
                            <span className="text-xs text-gray-600">
                              PKR {existingAdvance.amount.toFixed(2)}
                            </span>
                          </div>
                        )
                      } else {
                        return (
                          <span className="text-gray-400 text-sm">No Advance</span>
                        )
                      }
                    })()}
                  </TableCell>
                )}
                <TableCell>{bill.due_date}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleViewBill(bill)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadPDF(bill)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditBill(bill)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingBill(bill)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                </TableRow>
              )
            })}
            {/* Meter Readings - only for electricity management */}
            {isElectricityManagement && getCurrentMeterReadings().map((reading) => {
              return (
                <TableRow key={`meter-${reading.id}`} className="bg-green-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{reading.bill_number || "MR-" + reading.id.slice(-6).toUpperCase()}</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        Meter Reading
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getBusinessName(reading.business_id)}</div>
                      <div className="text-sm text-gray-500">{getBusinessShop(reading.business_id)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span>{reading.units_consumed} units</span>
                    </div>
                  </TableCell>
                  <TableCell>PKR {reading.rate_per_unit.toFixed(1)}/unit</TableCell>
                  <TableCell>PKR {reading.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Select
                      value={reading.payment_status || "pending"}
                      onValueChange={(value: "pending" | "paid" | "waveoff") => handleMeterReadingStatusChange(reading.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          <Badge variant={(reading.payment_status === "paid") ? "default" : (reading.payment_status === "waveoff") ? "outline" : "secondary"}>
                            {(reading.payment_status === "pending" || !reading.payment_status) ? "Unpaid" : reading.payment_status === "paid" ? "Paid" : reading.payment_status === "waveoff" ? "Waved Off" : reading.payment_status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span>Unpaid</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="paid">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Paid</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="waveoff">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>Waved Off</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {isRentManagement && (
                    <TableCell>
                      <span className="text-gray-400 text-sm">N/A</span>
                    </TableCell>
                  )}
                  <TableCell>{reading.reading_date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          // Show meter reading details
                          alert(`Meter Reading Details:\n\nBusiness: ${getBusinessName(reading.business_id)}\nShop: ${getBusinessShop(reading.business_id)}\nReading Date: ${reading.reading_date}\nPrevious Reading: ${reading.previous_reading}\nCurrent Reading: ${reading.current_reading}\nUnits Consumed: ${reading.units_consumed}\nRate: PKR ${reading.rate_per_unit}/unit\nAmount: PKR ${reading.amount.toFixed(2)}\nStatus: ${reading.payment_status || 'Pending'}`)
                        }}
                        title="View Meter Reading Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadMeterReadingPDF(reading)}
                        title="Print Invoice"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingMeterReading(reading)}
                        title="Delete Meter Reading"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {/* Gas Meter Readings - only for gas management */}
            {isGasManagement && getCurrentGasMeterReadings().map((reading) => {
              return (
                <TableRow key={`gas-meter-${reading.id}`} className="bg-orange-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{reading.bill_number || "GMR-" + reading.id.slice(-6).toUpperCase()}</span>
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                        Gas Reading
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getBusinessName(reading.business_id)}</div>
                      <div className="text-sm text-gray-500">{getBusinessShop(reading.business_id)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                      <span>{reading.units_consumed} units</span>
                    </div>
                  </TableCell>
                  <TableCell>PKR {reading.rate_per_unit.toFixed(1)}/unit</TableCell>
                  <TableCell>PKR {reading.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Select
                      value={reading.payment_status || "pending"}
                      onValueChange={(value: "pending" | "paid" | "waveoff") => handleMeterReadingStatusChange(reading.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          <Badge variant={(reading.payment_status === "paid") ? "default" : (reading.payment_status === "waveoff") ? "outline" : "secondary"}>
                            {(reading.payment_status === "pending" || !reading.payment_status) ? "Unpaid" : reading.payment_status === "paid" ? "Paid" : reading.payment_status === "waveoff" ? "Waved Off" : reading.payment_status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span>Unpaid</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="paid">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Paid</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="waveoff">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>Waved Off</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {isRentManagement && (
                    <TableCell>
                      <span className="text-gray-400 text-sm">N/A</span>
                    </TableCell>
                  )}
                  <TableCell>{reading.reading_date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          // Show gas meter reading details
                          alert(`Gas Meter Reading Details:\n\nBusiness: ${getBusinessName(reading.business_id)}\nShop: ${getBusinessShop(reading.business_id)}\nReading Date: ${reading.reading_date}\nPrevious Reading: ${reading.previous_reading}\nCurrent Reading: ${reading.current_reading}\nUnits Consumed: ${reading.units_consumed}\nRate: PKR ${reading.rate_per_unit}/unit\nAmount: PKR ${reading.amount.toFixed(2)}\nStatus: ${reading.payment_status || 'Pending'}`)
                        }}
                        title="View Gas Meter Reading Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadMeterReadingPDF(reading)}
                        title="Print Invoice"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingMeterReading(reading)}
                        title="Delete Gas Meter Reading"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {/* Partial Payments - only for rent management */}
            {!isElectricityManagement && !isGasManagement && getCurrentPartialPayments().map((partialPayment) => {
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
              const remainingAmount = partialPayment.total_rent_amount - partialPayment.total_paid_amount
              const isFullyPaid = remainingAmount <= 0
              
              return (
                <TableRow key={`partial-payment-${partialPayment.id}`} className="bg-purple-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>PP-{partialPayment.year}-{partialPayment.id.slice(-3).toUpperCase()}</span>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                        Partial Payment
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getBusinessName(partialPayment.business_id)}</div>
                      <div className="text-sm text-gray-500">
                        {getBusinessShop(partialPayment.business_id)} • {monthNames[partialPayment.month - 1]} {partialPayment.year}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>PKR {partialPayment.total_rent_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={isFullyPaid ? "default" : "secondary"} className={isFullyPaid ? "bg-green-600" : "bg-yellow-500"}>
                      {isFullyPaid ? "Fully Paid" : "Partially Paid"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={isFullyPaid ? "bg-green-100 text-green-700 border-green-300" : "bg-orange-100 text-orange-700 border-orange-300"}>
                          Paid: PKR {partialPayment.total_paid_amount.toFixed(2)}
                        </Badge>
                      </div>
                      {!isFullyPaid && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                          Remaining: PKR {remainingAmount.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(partialPayment.created_at).toISOString().split('T')[0]}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          // Show partial payment details
                          const paymentsList = partialPayment.payment_entries.map((entry, index) => 
                            `Payment ${index + 1}: PKR ${entry.amount} on ${entry.payment_date}${entry.description ? ` (${entry.description})` : ''}`
                          ).join('\n')
                          alert(`Partial Payment Details:\n\nBusiness: ${getBusinessName(partialPayment.business_id)}\nMonth/Year: ${monthNames[partialPayment.month - 1]} ${partialPayment.year}\nTotal Rent: PKR ${partialPayment.total_rent_amount.toLocaleString()}\nTotal Paid: PKR ${partialPayment.total_paid_amount.toLocaleString()}\nRemaining: PKR ${remainingAmount.toLocaleString()}\n\nPayments Made:\n${paymentsList}\n\n${partialPayment.description ? `Notes: ${partialPayment.description}` : ''}`)
                        }}
                        title="View Partial Payment Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!isFullyPaid && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-green-50 text-green-700 hover:bg-green-100"
                          onClick={() => {
                            setAddingPaymentToPartial(partialPayment)
                            setNewPartialPaymentEntry({
                              amount: "",
                              payment_date: new Date().toISOString().split("T")[0],
                              description: ""
                            })
                          }}
                          title="Add Payment"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {/* Advance Payments - only for rent management */}
            {!isElectricityManagement && !isGasManagement && getCurrentAdvances().map((advance) => {
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
              return (
                <TableRow key={`advance-${advance.id}`} className="bg-blue-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>ADV-{advance.year}-{advance.id.slice(-3).toUpperCase()}</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        Advance
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getBusinessName(advance.business_id)}</div>
                      <div className="text-sm text-gray-500">
                        {getBusinessShop(advance.business_id)} • {monthNames[advance.month - 1]} {advance.year}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>PKR {advance.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-600">
                      Advance Paid
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        Advance Payment
                      </Badge>
                      <span className="text-xs text-gray-600">
                        PKR {advance.amount.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{advance.advance_date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          // Show advance details in a simple alert or modal
                          alert(`Advance Payment Details:\n\nBusiness: ${getBusinessName(advance.business_id)}\nAmount: PKR ${advance.amount.toLocaleString()}\nMonth: ${monthNames[advance.month - 1]} {advance.year}\nDate: ${advance.advance_date}\n${advance.purpose ? `Purpose: ${advance.purpose}` : ''}`)
                        }}
                        title="View Advance Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {getCurrentBills().length === 0 && getCurrentAdvances().length === 0 && getCurrentPartialPayments().length === 0 && getCurrentMeterReadings().length === 0 && getCurrentGasMeterReadings().length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{isElectricityManagement ? "No electricity bills found." : isGasManagement ? "No gas bills found." : "No bills, advances, or partial payments found."}</p>
            <p className="text-sm">Try adjusting your search or create a new bill.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderBillList = () => (
    <div className="space-y-6">
      {/* Summary Cards for Unpaid/Paid tabs */}
      {billsSubTab !== "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className={`h-5 w-5 ${billsSubTab === "unpaid" ? "text-red-500" : "text-green-500"}`} />
              <div>
                <div className="text-sm text-gray-600">
                  {billsSubTab === "unpaid" ? "Unpaid Bills" : "Paid Bills"}
                </div>
                <div className={`text-xl font-bold ${billsSubTab === "unpaid" ? "text-red-600" : "text-green-600"}`}>
                  {isElectricityManagement ? getCurrentBills().length + getCurrentMeterReadings().length : 
                   isGasManagement ? getCurrentBills().length + getCurrentGasMeterReadings().length : 
                   getCurrentBills().length + getCurrentPartialPayments().length}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">
                  {billsSubTab === "unpaid" ? "Total Outstanding" : "Total Collected"}
                </div>
                <div className="text-xl font-bold text-blue-600">
                  PKR {(
                    getCurrentBills().reduce((sum, bill) => sum + bill.total_amount, 0) +
                    (isElectricityManagement ? getCurrentMeterReadings().reduce((sum, reading) => sum + reading.amount, 0) : 0) +
                    (isGasManagement ? getCurrentGasMeterReadings().reduce((sum, reading) => sum + reading.amount, 0) : 0) +
                    (billsSubTab === "paid" ? getCurrentPartialPayments().reduce((sum, pp) => sum + pp.total_paid_amount, 0) : 
                     billsSubTab === "unpaid" ? getCurrentPartialPayments().reduce((sum, pp) => sum + (pp.total_rent_amount - pp.total_paid_amount), 0) :
                     getCurrentPartialPayments().reduce((sum, pp) => sum + pp.total_rent_amount, 0))
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-sm text-gray-600">Average Amount</div>
                <div className="text-xl font-bold text-purple-600">
                  PKR {(() => {
                    const billsTotal = getCurrentBills().reduce((sum, bill) => sum + bill.total_amount, 0)
                    const readingsTotal = isElectricityManagement ? getCurrentMeterReadings().reduce((sum, reading) => sum + reading.amount, 0) : 
                                        isGasManagement ? getCurrentGasMeterReadings().reduce((sum, reading) => sum + reading.amount, 0) : 0
                    const partialPaymentsTotal = billsSubTab === "paid" ? getCurrentPartialPayments().reduce((sum, pp) => sum + pp.total_paid_amount, 0) : 
                                                billsSubTab === "unpaid" ? getCurrentPartialPayments().reduce((sum, pp) => sum + (pp.total_rent_amount - pp.total_paid_amount), 0) :
                                                getCurrentPartialPayments().reduce((sum, pp) => sum + pp.total_rent_amount, 0)
                    const totalCount = getCurrentBills().length + 
                                     (isElectricityManagement ? getCurrentMeterReadings().length : 0) +
                                     (isGasManagement ? getCurrentGasMeterReadings().length : 0) +
                                     getCurrentPartialPayments().length
                    return totalCount > 0 ? ((billsTotal + readingsTotal + partialPaymentsTotal) / totalCount).toFixed(2) : "0.00"
                  })()}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Bills List */}
      {renderBillListCard()}
    </div>
  )

  const renderAllBills = () => {
    // If in rent, electricity, or gas management mode, show tabbed interface
    if (isRentManagement || isElectricityManagement || isGasManagement) {
      return (
        <div className="space-y-6">
          <Tabs value={billsSubTab} onValueChange={setBillsSubTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                {isElectricityManagement 
                  ? `All (${filteredBills.length + filteredMeterReadings.length})`
                  : isGasManagement
                  ? `All (${filteredBills.length + filteredGasMeterReadings.length})`
                  : `All (${filteredBills.length + rentAdvances.length + filteredPartialPayments.length})`
                }
              </TabsTrigger>
              <TabsTrigger value="unpaid">
                {isElectricityManagement 
                  ? `Unpaid (${unpaidBills.length + unpaidMeterReadings.length})`
                  : isGasManagement
                  ? `Unpaid (${unpaidBills.length + unpaidGasMeterReadings.length})`
                  : `Unpaid (${unpaidBills.length + unpaidPartialPayments.length})`
                }
              </TabsTrigger>
              <TabsTrigger value="paid">
                {isElectricityManagement 
                  ? `Paid (${paidBills.length + paidMeterReadings.length})`
                  : isGasManagement
                  ? `Paid (${paidBills.length + paidGasMeterReadings.length})`
                  : `Paid (${paidBills.length + rentAdvances.length + paidPartialPayments.length})`
                }
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {renderBillListCard()}
            </TabsContent>
            <TabsContent value="unpaid" className="space-y-6">
              {renderBillList()}
            </TabsContent>
            <TabsContent value="paid" className="space-y-6">
              {renderBillList()}
            </TabsContent>
          </Tabs>
        </div>
      )
    }

    // Default behavior for non-rent management
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            All Bills
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.bill_number}</TableCell>
                  <TableCell>{getBusinessName(bill.business_id)}</TableCell>
                  <TableCell>{getBusinessShop(bill.business_id)}</TableCell>
                  <TableCell>{bill.bill_date}</TableCell>
                  <TableCell>PKR {bill.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Select
                      value={bill.status}
                      onValueChange={(value: "pending" | "paid") => handleStatusChange(bill.id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span>Unpaid</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="paid">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Paid</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleViewBill(bill)} title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditBill(bill)} title="Edit Bill">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadPDF(bill)} title="Print/Download PDF">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingBill(bill)}
                        title="Delete Bill"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredBills.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bills found.</p>
              <p className="text-sm">Generate your first bill above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderContent = () => {
    // If in edit mode, show the generate bill form with edit functionality
    if (isEditMode) {
      return renderGenerateBill()
    }

    switch (activeSubSection) {
      case "bill-generate":
        return renderGenerateBill()
      case "bill-all":
        return renderAllBills()
      case "electricity-generate":
        return renderGenerateBill()
      case "electricity-all":
        return renderAllBills()
      case "gas-all":
        return renderAllBills()
      case "gas-generate":
        return renderGenerateBill()
      default:
        return renderGenerateBill()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black">{getSectionTitle()}</h1>
      {renderContent()}

      {/* View Bill Dialog */}
      <Dialog open={!!viewingBill} onOpenChange={() => setViewingBill(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
            <DialogDescription>
              View complete bill information
            </DialogDescription>
          </DialogHeader>
          {viewingBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Bill Number</Label>
                  <p className="text-sm">{viewingBill.bill_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{viewingBill.bill_date}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">{getBusinessName(viewingBill.business_id)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Shop</Label>
                  <p className="text-sm">{getBusinessShop(viewingBill.business_id)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={viewingBill.status === "paid" ? "default" : "secondary"}>
                    {viewingBill.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p className="text-sm">{viewingBill.due_date}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Charges Breakdown</h4>
                {viewingBill.electricity_charges > 0 && (
                  <div className="flex justify-between">
                    <span>Electricity Charges</span>
                    <span>PKR {viewingBill.electricity_charges.toFixed(2)}</span>
                  </div>
                )}
                {viewingBill.maintenance_charges > 0 && (
                  <div className="flex justify-between">
                    <span>
                      {viewingBill.bill_number.startsWith('RENT') ? 'Rent Charges' : 'Maintenance Charges'}
                    </span>
                    <span>PKR {viewingBill.maintenance_charges.toFixed(2)}</span>
                  </div>
                )}
                {viewingBill.water_charges > 0 && (
                  <div className="flex justify-between">
                    <span>Water Charges</span>
                    <span>PKR {viewingBill.water_charges.toFixed(2)}</span>
                  </div>
                )}
                {viewingBill.other_charges > 0 && (
                  <div className="flex justify-between">
                    <span>Other Charges</span>
                    <span>PKR {viewingBill.other_charges.toFixed(2)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span>PKR {viewingBill.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingBill(null)}>
              Close
            </Button>
            {viewingBill && (
              <Button onClick={() => downloadPDF(viewingBill)}>
                <Printer className="h-4 w-4 mr-2" />
                Print PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingBill} onOpenChange={() => setDeletingBill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete bill {deletingBill?.bill_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBill}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Meter Reading Confirmation Dialog */}
      <AlertDialog open={!!deletingMeterReading} onOpenChange={() => setDeletingMeterReading(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meter Reading</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this meter reading for {deletingMeterReading ? getBusinessName(deletingMeterReading.business_id) : ''}? 
              <br /><br />
              <strong>Reading Details:</strong>
              <br />• Bill Number: {deletingMeterReading?.bill_number || "MR-" + deletingMeterReading?.id.slice(-6).toUpperCase()}
              <br />• Date: {deletingMeterReading?.reading_date}
              <br />• Units: {deletingMeterReading?.units_consumed} units
              <br />• Amount: PKR {deletingMeterReading?.amount.toFixed(2)}
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeterReading}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Advance Payment Warning Dialog */}
      <AlertDialog open={advanceWarning.show} onOpenChange={(open) => !open && setAdvanceWarning({ show: false, advance: null, businessName: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Advance Payment Already Exists</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>{advanceWarning.businessName}</strong> has already paid an advance for{" "}
                {advanceWarning.advance && (
                  <strong>
                    {[
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ][advanceWarning.advance.month - 1]} {advanceWarning.advance.year}
                  </strong>
                )}.
              </p>
              {advanceWarning.advance && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm">
                    <strong>Advance Details:</strong>
                  </p>
                  <p className="text-sm">
                    • Amount: PKR {advanceWarning.advance.amount.toLocaleString()}
                  </p>
                  <p className="text-sm">
                    • Date: {advanceWarning.advance.advance_date}
                  </p>
                  {advanceWarning.advance.purpose && (
                    <p className="text-sm">
                      • Purpose: {advanceWarning.advance.purpose}
                    </p>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">
                You cannot generate a new bill for this month as the advance payment already covers it.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAdvanceWarning({ show: false, advance: null, businessName: "" })}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Payment to Partial Payment Dialog */}
      <Dialog open={!!addingPaymentToPartial} onOpenChange={(open) => !open && setAddingPaymentToPartial(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Add a payment to the partial payment record for {addingPaymentToPartial ? getBusinessName(addingPaymentToPartial.business_id) : ''}
            </DialogDescription>
          </DialogHeader>
          {addingPaymentToPartial && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Rent:</span>
                    <br />PKR {addingPaymentToPartial.total_rent_amount.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Already Paid:</span>
                    <br />PKR {addingPaymentToPartial.total_paid_amount.toFixed(2)}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Remaining Amount:</span>
                    <br />PKR {(addingPaymentToPartial.total_rent_amount - addingPaymentToPartial.total_paid_amount).toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount (PKR) *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={newPartialPaymentEntry.amount}
                  onChange={(e) => setNewPartialPaymentEntry({ ...newPartialPaymentEntry, amount: e.target.value })}
                  placeholder="Enter payment amount"
                  max={addingPaymentToPartial.total_rent_amount - addingPaymentToPartial.total_paid_amount}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={newPartialPaymentEntry.payment_date}
                  onChange={(e) => setNewPartialPaymentEntry({ ...newPartialPaymentEntry, payment_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentDescription">Description (Optional)</Label>
                <Input
                  id="paymentDescription"
                  value={newPartialPaymentEntry.description}
                  onChange={(e) => setNewPartialPaymentEntry({ ...newPartialPaymentEntry, description: e.target.value })}
                  placeholder="Add a note for this payment"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingPaymentToPartial(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPaymentToPartial}
              disabled={!newPartialPaymentEntry.amount || !newPartialPaymentEntry.payment_date}
            >
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms Selection Dialog */}
      <TermsSelectionDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onConfirm={handleTermsConfirm}
        onCancel={handleTermsCancel}
        loading={billCreationLoading}
      />
    </div>
  )
}
