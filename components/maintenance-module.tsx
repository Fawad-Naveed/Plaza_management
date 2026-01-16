"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Calendar,
  DollarSign,
  Plus,
  Printer,
  Search,
  Wrench,
  Eye,
  Download,
  CreditCard,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import {
  getBusinesses,
  getMaintenanceBills,
  createMaintenanceBill,
  updateMaintenanceBill,
  getMaintenancePayments,
  createMaintenancePayment,
  getMaintenanceAdvances,
  createMaintenanceAdvance,
  deleteMaintenanceAdvance,
  getMaintenanceInstalments,
  createMaintenanceInstalment,
  clientDb,
  type Business,
  type MaintenanceBill as DBMaintenanceBill,
  type MaintenancePayment as DBMaintenancePayment,
  type MaintenanceAdvance as DBMaintenanceAdvance,
  type MaintenanceInstalment as DBMaintenanceInstalment,
  getInformation,
  type Information,
} from "@/lib/database"
import { generateMaintenanceBillPDF, type MaintenanceBillData } from "@/lib/maintenance-bill-pdf"

interface MaintenanceBill {
  id: string
  billNumber: string
  customerId: string
  customerName: string
  shopNumber: string
  floor: string
  description: string
  amount: number
  paidAmount: number
  remainingAmount: number
  billDate: string
  dueDate: string
  month: string
  year: string
  status: "pending" | "paid" | "overdue" | "cancelled" | "partial" | "waveoff"
  category: "cleaning" | "repair" | "general" | "emergency"
}

interface MaintenancePayment {
  id: string
  receiptNumber: string
  billId: string
  billNumber: string
  customerId: string
  customerName: string
  shopNumber: string
  billAmount: number
  paidAmount: number
  paymentMethod: "cash" | "card" | "upi" | "bank_transfer"
  paymentDate: string
  paymentTime: string
  status: "completed" | "partial"
  notes?: string
}

interface MaintenanceAdvance {
  id: string
  customerId: string
  customerName: string
  shopNumber: string
  advanceAmount: number
  usedAmount: number
  remainingAmount: number
  dateGiven: string
  notes?: string
}

interface MaintenanceInstalment {
  id: string
  customerId: string
  customerName: string
  shopNumber: string
  totalAmount: number
  instalmentAmount: number
  paidInstalments: number
  totalInstalments: number
  nextDueDate: string
  status: "active" | "completed" | "defaulted"
}

interface MaintenanceModuleProps {
  activeSubSection?: string
}

export function MaintenanceModule({ activeSubSection = "maintenance-bill" }: MaintenanceModuleProps) {
  const [activeTab, setActiveTab] = useState("bills")
  const [billsSubTab, setBillsSubTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState<"all" | "currentMonth" | "quarter" | "sixMonths" | "year" | "custom">("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

  // Data states
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [maintenanceBills, setMaintenanceBills] = useState<MaintenanceBill[]>([])
  const [maintenancePayments, setMaintenancePayments] = useState<MaintenancePayment[]>([])
  const [maintenanceAdvances, setMaintenanceAdvances] = useState<MaintenanceAdvance[]>([])
  const [maintenanceInstalments, setMaintenanceInstalments] = useState<MaintenanceInstalment[]>([])

  // Form states
  const [newBill, setNewBill] = useState({
    customerId: "",
    description: "",
    amount: "",
    category: "general" as "cleaning" | "repair" | "general" | "emergency",
    dueDate: "",
  })

  const [newPayment, setNewPayment] = useState({
    billId: "",
    paidAmount: "",
    paymentMethod: "cash" as "cash" | "card" | "upi" | "bank_transfer",
    notes: "",
  })

  const [newAdvance, setNewAdvance] = useState({
    customerId: "",
    advanceAmount: "",
    notes: "",
  })

  const [newInstalment, setNewInstalment] = useState({
    customerId: "",
    totalAmount: "",
    instalmentAmount: "",
    description: "",
  })

  // Dialog states
  const [editingBill, setEditingBill] = useState<MaintenanceBill | null>(null)
  const [printBill, setPrintBill] = useState<MaintenanceBill | null>(null)

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [businessesData, billsData, paymentsData, advancesData, instalmentsData] = await Promise.all([
        getBusinesses(),
        getMaintenanceBills(),
        getMaintenancePayments(),
        getMaintenanceAdvances(),
        getMaintenanceInstalments(),
      ])

      // Filter businesses for maintenance management only
      const maintenanceBusinesses = businessesData.filter(business => business.maintenance_management)
      setBusinesses(maintenanceBusinesses)

      // Transform database bills to component format
      const transformedBills = billsData.map((bill: DBMaintenanceBill) => {
        const business = businessesData.find((b) => b.id === bill.business_id)
        const payments = paymentsData.filter((p: DBMaintenancePayment) => p.maintenance_bill_id === bill.id)
        const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
        const remainingAmount = (bill.amount || 0) - paidAmount

        return {
          id: bill.id,
          billNumber: bill.bill_number,
          customerId: bill.business_id,
          customerName: business?.name || "Unknown",
          shopNumber: business?.shop_number || "N/A",
          floor: `Floor ${business?.floor_number || "N/A"}`,
          description: bill.description,
          amount: bill.amount || 0,
          paidAmount,
          remainingAmount,
          billDate: bill.bill_date,
          dueDate: bill.due_date,
          month: new Date(bill.bill_date).toLocaleDateString("en-US", { month: "long" }),
          year: new Date(bill.bill_date).getFullYear().toString(),
          status:
            bill.status === "waveoff" ? "waveoff" :
            bill.status === "paid" ? "paid" : 
            bill.status === "overdue" ? "overdue" :
            bill.status === "cancelled" ? "cancelled" :
            remainingAmount === 0 ? "paid" : 
            paidAmount > 0 ? "partial" : "pending",
          category: bill.category,
        } as MaintenanceBill
      })

      // Transform database payments to component format
      const transformedPayments = paymentsData.map((payment: DBMaintenancePayment) => {
        const business = businessesData.find((b) => b.id === payment.business_id)
        const bill = billsData.find((b) => b.id === payment.maintenance_bill_id)

        return {
          id: payment.id,
          receiptNumber: `MREC-${payment.id.slice(-6)}`,
          billId: payment.maintenance_bill_id || "",
          billNumber: bill?.bill_number || "N/A",
          customerId: payment.business_id,
          customerName: business?.name || "Unknown",
          shopNumber: business?.shop_number || "N/A",
          billAmount: bill?.amount || 0,
          paidAmount: payment.amount || 0,
          paymentMethod: payment.payment_method === "bank_transfer" ? "bank_transfer" : payment.payment_method,
          paymentDate: payment.payment_date,
          paymentTime: new Date(payment.created_at).toLocaleTimeString("en-US", { hour12: false }),
          status: "completed",
          notes: payment.notes,
        } as MaintenancePayment
      })

      // Transform database advances to component format
      const transformedAdvances = advancesData.map((advance: DBMaintenanceAdvance) => {
        const business = businessesData.find((b) => b.id === advance.business_id)

        return {
          id: advance.id,
          customerId: advance.business_id,
          customerName: business?.name || "Unknown",
          shopNumber: business?.shop_number || "N/A",
          advanceAmount: advance.amount || 0,
          usedAmount: advance.used_amount || 0,
          remainingAmount: advance.remaining_amount || 0,
          dateGiven: advance.advance_date,
          notes: advance.purpose,
        } as MaintenanceAdvance
      })

      // Transform database instalments to component format
      const transformedInstalments = instalmentsData.map((instalment: DBMaintenanceInstalment) => {
        const business = businessesData.find((b) => b.id === instalment.business_id)

        return {
          id: instalment.id,
          customerId: instalment.business_id,
          customerName: business?.name || "Unknown",
          shopNumber: business?.shop_number || "N/A",
          totalAmount: instalment.total_amount || 0,
          instalmentAmount: instalment.instalment_amount || 0,
          paidInstalments: instalment.instalments_paid || 0,
          totalInstalments: instalment.instalments_count || 0,
          nextDueDate: new Date(
            new Date(instalment.start_date).getTime() + (instalment.instalments_paid + 1) * 30 * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split("T")[0],
          status:
            instalment.status === "completed"
              ? "completed"
              : instalment.status === "cancelled"
                ? "defaulted"
                : "active",
        } as MaintenanceInstalment
      })

      setMaintenanceBills(transformedBills)
      setMaintenancePayments(transformedPayments)
      setMaintenanceAdvances(transformedAdvances)
      setMaintenanceInstalments(transformedInstalments)
    } catch (err) {
      console.error("Error loading maintenance data:", err)
      setError("Failed to load maintenance data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const generateMaintenanceBillNumber = async (category: string) => {
    const prefix = "MAINT"
    const year = new Date().getFullYear()

    // Get existing bills for the current year to determine next sequence number
    const currentYearBills = maintenanceBills.filter(bill =>
      bill.year === year.toString() && bill.billNumber.startsWith(`${prefix}-${year}`)
    )

    // Find the highest sequence number for the current year
    let maxSequence = 0
    currentYearBills.forEach(bill => {
      const match = bill.billNumber.match(/MAINT-\d{4}-(\d{3})/)
      if (match) {
        const sequence = parseInt(match[1], 10)
        if (sequence > maxSequence) {
          maxSequence = sequence
        }
      }
    })

    const nextSequence = maxSequence + 1
    return `${prefix}-${year}-${nextSequence.toString().padStart(3, "0")}`
  }

  const handleCreateBill = async () => {
    try {
      // Enhanced validation
      if (!newBill.customerId) {
        setError("Please select a customer")
        return
      }
      if (!newBill.description.trim()) {
        setError("Please provide a description for the maintenance work")
        return
      }
      if (!newBill.amount || parseFloat(newBill.amount) <= 0) {
        setError("Please enter a valid amount greater than 0")
        return
      }
      if (!newBill.dueDate) {
        setError("Please select a due date")
        return
      }

      // Validate due date is not in the past
      const today = new Date().toISOString().split("T")[0]
      if (newBill.dueDate < today) {
        setError("Due date cannot be in the past")
        return
      }

      const billNumber = await generateMaintenanceBillNumber(newBill.category)
      const billDate = new Date().toISOString().split("T")[0]

      await createMaintenanceBill({
        business_id: newBill.customerId,
        bill_number: billNumber,
        bill_date: billDate,
        due_date: newBill.dueDate,
        description: newBill.description.trim(),
        category: newBill.category as "cleaning" | "repair" | "general" | "emergency",
        amount: parseFloat(newBill.amount),
        status: "pending",
      })

      await loadAllData()
      setNewBill({
        customerId: "",
        description: "",
        amount: "",
        category: "general" as "cleaning" | "repair" | "general" | "emergency",
        dueDate: "",
      })
      setError(null)

      // Show success message
      console.log(`Maintenance bill ${billNumber} created successfully`)
    } catch (error) {
      console.error("Error creating maintenance bill:", error)
      setError("Failed to create maintenance bill. Please try again.")
    }
  }

  const handleRecordPayment = async () => {
    try {
      // Enhanced validation
      if (!newPayment.billId) {
        setError("Please select a bill to record payment for")
        return
      }
      if (!newPayment.paidAmount || parseFloat(newPayment.paidAmount) <= 0) {
        setError("Please enter a valid payment amount greater than 0")
        return
      }
      if (!newPayment.paymentMethod) {
        setError("Please select a payment method")
        return
      }

      const bill = maintenanceBills.find(b => b.id === newPayment.billId)
      if (!bill) {
        setError("Selected bill not found")
        return
      }

      const paymentAmount = parseFloat(newPayment.paidAmount)

      // Validate payment amount doesn't exceed remaining amount
      if (paymentAmount > bill.remainingAmount) {
        setError(`Payment amount cannot exceed remaining amount of PKR ${bill.remainingAmount.toFixed(2)}`)
        return
      }

      await createMaintenancePayment({
        business_id: bill.customerId,
        maintenance_bill_id: newPayment.billId,
        payment_date: new Date().toISOString().split("T")[0],
        amount: paymentAmount,
        payment_method: newPayment.paymentMethod as "cash" | "cheque" | "bank_transfer" | "upi" | "card",
        notes: newPayment.notes.trim() || undefined,
      })

      // Update bill status if fully paid
      const newPaidAmount = bill.paidAmount + paymentAmount
      if (newPaidAmount >= bill.amount) {
        await updateMaintenanceBill(bill.id, { status: "paid" })
      }

      await loadAllData()
      setNewPayment({
        billId: "",
        paidAmount: "",
        paymentMethod: "cash" as "cash" | "card" | "upi" | "bank_transfer",
        notes: "",
      })
      setError(null)

      // Show success message
      console.log(`Payment of PKR ${paymentAmount.toFixed(2)} recorded for bill ${bill.billNumber}`)
    } catch (error) {
      console.error("Error recording payment:", error)
      setError("Failed to record payment. Please try again.")
    }
  }

  const handleCreateAdvance = async () => {
    try {
      if (!newAdvance.customerId || !newAdvance.advanceAmount) {
        setError("Please fill in all required fields")
        return
      }

      await createMaintenanceAdvance({
        business_id: newAdvance.customerId,
        amount: parseFloat(newAdvance.advanceAmount),
        used_amount: 0,
        remaining_amount: parseFloat(newAdvance.advanceAmount),
        advance_date: new Date().toISOString().split("T")[0],
        purpose: newAdvance.notes,
        status: "active",
      })

      await loadAllData()
      setNewAdvance({
        customerId: "",
        advanceAmount: "",
        notes: "",
      })
      setError(null)
    } catch (error) {
      console.error("Error creating advance:", error)
      setError("Failed to create advance. Please try again.")
    }
  }

  const handleDeleteAdvance = async (advanceId: string) => {
    try {
      await deleteMaintenanceAdvance(advanceId)
      await loadAllData()
      setError(null)
    } catch (error) {
      console.error("Error deleting maintenance advance:", error)
      setError("Failed to delete maintenance advance. Please try again.")
    }
  }

  const handleCreateInstalment = async () => {
    try {
      if (!newInstalment.customerId || !newInstalment.totalAmount || !newInstalment.instalmentAmount) {
        setError("Please fill in all required fields")
        return
      }

      const instalmentCount = Math.ceil(parseFloat(newInstalment.totalAmount) / parseFloat(newInstalment.instalmentAmount))

      await createMaintenanceInstalment({
        business_id: newInstalment.customerId,
        total_amount: parseFloat(newInstalment.totalAmount),
        instalment_amount: parseFloat(newInstalment.instalmentAmount),
        instalments_count: instalmentCount,
        instalments_paid: 0,
        start_date: new Date().toISOString().split("T")[0],
        description: newInstalment.description,
        status: "active",
      })

      await loadAllData()
      setNewInstalment({
        customerId: "",
        totalAmount: "",
        instalmentAmount: "",
        description: "",
      })
      setError(null)
    } catch (error) {
      console.error("Error creating instalment:", error)
      setError("Failed to create instalment. Please try again.")
    }
  }

  const handleDeleteBill = async (billId: string) => {
    try {
      await clientDb.deleteMaintenanceBill(billId)
      await loadAllData()
      setError(null)
    } catch (error) {
      console.error("Error deleting maintenance bill:", error)
      setError("Failed to delete maintenance bill. Please try again.")
    }
  }

  const handleStatusChange = async (billId: string, newStatus: "pending" | "paid" | "overdue" | "cancelled" | "waveoff") => {
    try {
      console.log(`Attempting to update bill ${billId} to status: ${newStatus}`)
      
      const updateResult = await updateMaintenanceBill(billId, { status: newStatus })
      console.log('Update result:', updateResult)
      
      // If marking as paid, create a maintenance payment record with admin tracking
      if (newStatus === "paid") {
        // Get current auth state for admin info
        const { getAuthState } = await import('@/lib/auth')
        const authState = getAuthState()
        
        const bill = maintenanceBills.find(b => b.id === billId)
        if (bill) {
          const paymentData = {
            business_id: bill.business_id,
            maintenance_bill_id: billId,
            payment_date: new Date().toISOString().split('T')[0],
            amount: bill.amount,
            payment_method: 'cash' as const, // Default payment method when marked by admin
            notes: `Maintenance bill marked as paid by ${authState?.role === 'admin' ? 'admin' : 'business user'}`,
            admin_id: authState?.role === 'admin' ? 'admin' : authState?.businessId,
            marked_paid_by: authState?.role === 'admin' ? 'Admin' : authState?.businessName || 'Business User',
            marked_paid_date: new Date().toISOString()
          }
          
          const paymentResult = await createMaintenancePayment(paymentData)
          if (paymentResult.error) {
            console.error('Error creating maintenance payment record:', paymentResult.error)
          }
        }
      }
      
      console.log('Reloading data after status update...')
      await loadAllData()
      setError(null)
      console.log('Status update completed successfully')
    } catch (error) {
      console.error("Error updating bill status:", error)
      setError(`Failed to update bill status: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    }
  }

  const handleUpdateBill = async () => {
    try {
      if (!editingBill) return

      await updateMaintenanceBill(editingBill.id, {
        description: editingBill.description,
        amount: editingBill.amount,
        due_date: editingBill.dueDate,
        category: editingBill.category,
      })

      await loadAllData()
      setEditingBill(null)
      setError(null)
    } catch (error) {
      console.error("Error updating maintenance bill:", error)
      setError("Failed to update maintenance bill. Please try again.")
    }
  }

  const handlePrintBill = async (bill: MaintenanceBill) => {
    try {
      const business = businesses.find((b) => b.id === bill.customerId)
      
      // Get business information for branding
      let businessInfo: Information | null = null
      try {
        businessInfo = await getInformation()
      } catch (error) {
        console.log("No business information found, using default branding")
      }

      // Get historical maintenance bills for the business (last 12)
      const businessBills = maintenanceBills
        .filter(b => b.customerId === bill.customerId && b.id !== bill.id)
        .sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())
        .slice(0, 12)
        .map(b => ({
          reading_date: b.billDate,
          amount: b.amount,
          units_consumed: 0,
          payment_status: b.status === 'paid' ? 'paid' : 'pending'
        }))

      // Calculate arrears (unpaid previous bills)
      const arrears = maintenanceBills
        .filter(b => 
          b.customerId === bill.customerId && 
          b.status !== 'paid' && 
          b.status !== 'waveoff' &&
          b.id !== bill.id &&
          new Date(b.billDate) < new Date(bill.billDate)
        )
        .reduce((sum, b) => sum + b.amount, 0)

      // Calculate late surcharge (10% of arrears if any)
      const lateSurcharge = arrears > 0 ? arrears * 0.1 : 0

      // Helper functions for PDF generation
      const getBusinessName = (id: string) => {
        const b = businesses.find(bus => bus.id === id)
        return b?.name || 'Unknown'
      }

      const getBusinessShop = (id: string) => {
        const b = businesses.find(bus => bus.id === id)
        return b?.shop_number || 'N/A'
      }

      const getFloorName = (floorNum: number) => {
        return `Floor ${floorNum}`
      }

      const maintenanceBillData: MaintenanceBillData = {
        reading: {
          id: bill.id,
          business_id: bill.customerId,
          bill_number: bill.billNumber,
          reading_date: bill.billDate,
          payment_status: bill.status === 'paid' ? 'paid' : 'pending',
          amount: bill.amount,
          maintenance_charge: bill.amount,
          created_at: bill.billDate
        },
        businessReadings: businessBills,
        business: business,
        businessInfo: businessInfo || undefined,
        getBusinessName,
        getBusinessShop,
        getFloorName,
        arrears,
        lateSurcharge
      }

      await generateMaintenanceBillPDF(maintenanceBillData)
    } catch (error) {
      console.error("Error generating maintenance bill PDF:", error)
      setError("Failed to generate maintenance bill PDF. Please try again.")
    }
  }

  // Date filtering helper function
  const isWithinDateRange = (dateString: string) => {
    if (dateFilter === "all") return true
    
    const billDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    switch (dateFilter) {
      case "currentMonth": {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        return billDate >= firstDayOfMonth && billDate <= lastDayOfMonth
      }
      case "quarter": {
        const currentQuarter = Math.floor(today.getMonth() / 3)
        const firstDayOfQuarter = new Date(today.getFullYear(), currentQuarter * 3, 1)
        const lastDayOfQuarter = new Date(today.getFullYear(), currentQuarter * 3 + 3, 0)
        return billDate >= firstDayOfQuarter && billDate <= lastDayOfQuarter
      }
      case "sixMonths": {
        const sixMonthsAgo = new Date(today)
        sixMonthsAgo.setMonth(today.getMonth() - 6)
        return billDate >= sixMonthsAgo && billDate <= today
      }
      case "year": {
        const oneYearAgo = new Date(today)
        oneYearAgo.setFullYear(today.getFullYear() - 1)
        return billDate >= oneYearAgo && billDate <= today
      }
      case "custom": {
        if (!customStartDate || !customEndDate) return true
        const startDate = new Date(customStartDate)
        const endDate = new Date(customEndDate)
        endDate.setHours(23, 59, 59, 999)
        return billDate >= startDate && billDate <= endDate
      }
      default:
        return true
    }
  }

  // Filter functions
  const filteredBills = maintenanceBills.filter(
    (bill) => {
      const matchesSearch = bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.shopNumber.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDateRange = isWithinDateRange(bill.billDate)
      
      return matchesSearch && matchesDateRange
    }
  )

  const filteredPayments = maintenancePayments.filter(
    (payment) =>
      payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredAdvances = maintenanceAdvances.filter(
    (advance) =>
      advance.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advance.shopNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredInstalments = maintenanceInstalments.filter(
    (instalment) =>
      instalment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instalment.shopNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Filter bills by status
  const paidBills = filteredBills.filter(bill => bill.status === "paid")
  const unpaidBills = filteredBills.filter(bill => bill.status !== "paid" && bill.status !== "waveoff")
  const waveoffBills = filteredBills.filter(bill => bill.status === "waveoff")

  // Get bills based on current sub-tab or activeSubSection
  const getCurrentBills = (subTab?: string) => {
    const currentSubTab = subTab || getCurrentBillsSubTab()
    switch (currentSubTab) {
      case "paid":
        return paidBills
      case "unpaid":
        return unpaidBills
      case "waveoff":
        return waveoffBills
      default:
        return filteredBills
    }
  }

  const renderBillsTab = () => (
    <div className="space-y-6">
      {/* Date Filter Controls */}
      {billsSubTab !== "all" && (
        <Card className="border-0 rounded-4xl">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 md:max-w-xs">
                <Label htmlFor="dateFilter" className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Filter by Date
                </Label>
                <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                  <SelectTrigger id="dateFilter">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="currentMonth">Current Month</SelectItem>
                    <SelectItem value="quarter">Current Quarter</SelectItem>
                    <SelectItem value="sixMonths">Last 6 Months</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateFilter === "custom" && (
                <>
                  <div className="flex-1 md:max-w-xs">
                    <Label htmlFor="customStartDate" className="text-sm font-medium mb-2">
                      Start Date
                    </Label>
                    <Input
                      id="customStartDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 md:max-w-xs">
                    <Label htmlFor="customEndDate" className="text-sm font-medium mb-2">
                      End Date
                    </Label>
                    <Input
                      id="customEndDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Bills Sub-tabs */}
      <Tabs value={billsSubTab} onValueChange={setBillsSubTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Bills ({filteredBills.length})</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid ({unpaidBills.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
          <TabsTrigger value="waveoff">Wave off ({waveoffBills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {renderBillsContent()}
        </TabsContent>
        <TabsContent value="unpaid" className="space-y-6">
          {renderBillsContent()}
        </TabsContent>
        <TabsContent value="paid" className="space-y-6">
          {renderBillsContent()}
        </TabsContent>
        <TabsContent value="waveoff" className="space-y-6">
          {renderBillsContent()}
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderBillsTabWithSubTab = (subTab: string) => (
    <div className="space-y-6">
      {renderBillsContentWithSubTab(subTab)}
    </div>
  )

  const renderBillsContent = () => (
    <div className="space-y-6">
      {/* Create Bill Form - Only show in 'all' tab */}
      {billsSubTab === "all" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {activeSubSection === "maintenance-bill" ? "Generate New Maintenance Bill" : "Create Maintenance Bill"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer <span className="text-red-500">*</span></Label>
                <Select
                  value={newBill.customerId}
                  onValueChange={(value) => setNewBill({ ...newBill, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
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
                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                <Select
                  value={newBill.category}
                  onValueChange={(value: "cleaning" | "repair" | "general" | "emergency") =>
                    setNewBill({ ...newBill, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">
                      <div className="flex flex-col">
                        <span className="font-medium">Cleaning</span>
                        <span className="text-xs text-gray-500">Regular cleaning services</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="repair">
                      <div className="flex flex-col">
                        <span className="font-medium">Repair</span>
                        <span className="text-xs text-gray-500">Equipment and facility repairs</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="general">
                      <div className="flex flex-col">
                        <span className="font-medium">General</span>
                        <span className="text-xs text-gray-500">General maintenance work</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="emergency">
                      <div className="flex flex-col">
                        <span className="font-medium">Emergency</span>
                        <span className="text-xs text-gray-500">Urgent maintenance issues</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR) <span className="text-red-500">*</span></Label>
                <Input
                  id="amount"
                  type="text"
                  step="0.01"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date <span className="text-red-500">*</span></Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newBill.description}
                onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                placeholder="Describe the maintenance work"
                rows={3}
              />
            </div>

            <Button onClick={handleCreateBill} className="bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Maintenance Bill
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards for Unpaid/Paid tabs */}
      {billsSubTab !== "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${
                billsSubTab === "unpaid" ? "text-red-500" : 
                billsSubTab === "waveoff" ? "text-blue-500" : "text-green-500"
              }`} />
              <div>
                <div className="text-sm text-gray-600">
                  {billsSubTab === "unpaid" ? "Unpaid Bills" : 
                   billsSubTab === "waveoff" ? "Waved Off Bills" : "Paid Bills"}
                </div>
                <div className={`text-xl font-bold ${
                  billsSubTab === "unpaid" ? "text-red-600" : 
                  billsSubTab === "waveoff" ? "text-blue-600" : "text-green-600"
                }`}>
                  {getCurrentBills().length}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">
                  {billsSubTab === "unpaid" ? "Total Outstanding" : 
                   billsSubTab === "waveoff" ? "Total Waved Off" : "Total Collected"}
                </div>
                <div className="text-xl font-bold text-blue-600">
                  PKR {getCurrentBills().reduce((sum, bill) =>
                    sum + (billsSubTab === "unpaid" ? bill.remainingAmount : 
                           billsSubTab === "waveoff" ? bill.amount : bill.paidAmount), 0
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-sm text-gray-600">Average Amount</div>
                <div className="text-xl font-bold text-purple-600">
                  PKR {getCurrentBills().length > 0
                    ? (getCurrentBills().reduce((sum, bill) => sum + bill.amount, 0) / getCurrentBills().length).toFixed(2)
                    : "0.00"
                  }
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {billsSubTab === "all" && "All Maintenance Bills"}
            {billsSubTab === "paid" && "Paid Maintenance Bills"}
            {billsSubTab === "unpaid" && "Unpaid Maintenance Bills"}
            {billsSubTab === "waveoff" && "Waved Off Maintenance Bills"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentBills().map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bill.customerName}</div>
                      <div className="text-sm text-gray-500">{bill.shopNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {bill.category}
                    </Badge>
                  </TableCell>
                  <TableCell>PKR {bill.amount.toFixed(2)}</TableCell>
                  <TableCell>PKR {bill.paidAmount.toFixed(2)}</TableCell>
                  <TableCell>PKR {bill.remainingAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 p-2">
                          <Badge variant={bill.status === "paid" ? "default" : bill.status === "waveoff" ? "outline" : "secondary"} className="cursor-pointer">
                            {bill.status === "waveoff" ? "Waved Off" : bill.status}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(bill.id, "pending")}
                          className={bill.status === "pending" ? "bg-blue-50" : ""}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            Generated
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(bill.id, "overdue")}
                          className={bill.status === "overdue" ? "bg-blue-50" : ""}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            Unpaid
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(bill.id, "paid")}
                          className={bill.status === "paid" ? "bg-blue-50" : ""}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Paid
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(bill.id, "waveoff")}
                          className={bill.status === "waveoff" ? "bg-blue-50" : ""}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            Waved Off
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>{bill.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintBill(bill)}
                        className="h-8 w-8 p-0"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBill(bill)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Maintenance Bill</DialogTitle>
                          </DialogHeader>
                          {editingBill && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="editDescription">Description</Label>
                                <Textarea
                                  id="editDescription"
                                  value={editingBill.description}
                                  onChange={(e) => setEditingBill({ ...editingBill, description: e.target.value })}
                                  rows={3}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="editAmount">Amount (PKR )</Label>
                                  <Input
                                    id="editAmount"
                                    type="text"
                                    step="0.01"
                                    value={editingBill.amount}
                                    onChange={(e) => setEditingBill({ ...editingBill, amount: parseFloat(e.target.value) || 0 })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="editDueDate">Due Date</Label>
                                  <Input
                                    id="editDueDate"
                                    type="date"
                                    value={editingBill.dueDate}
                                    onChange={(e) => setEditingBill({ ...editingBill, dueDate: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editCategory">Category</Label>
                                <Select
                                  value={editingBill.category}
                                  onValueChange={(value: "cleaning" | "repair" | "general" | "emergency") =>
                                    setEditingBill({ ...editingBill, category: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cleaning">Cleaning</SelectItem>
                                    <SelectItem value="repair">Repair</SelectItem>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingBill(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateBill}>
                                  Update Bill
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Maintenance Bill</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete bill {bill.billNumber}? This action cannot be undone.
                              All associated payments will also be affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBill(bill.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderBillsContentWithSubTab = (subTab: string) => (
    <div className="space-y-6">
      {/* Date Filter Controls */}
      {subTab !== "all" && (
        <Card className="border-0 rounded-4xl">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 md:max-w-xs">
                <Label htmlFor="dateFilter" className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Filter by Date
                </Label>
                <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                  <SelectTrigger id="dateFilter">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="currentMonth">Current Month</SelectItem>
                    <SelectItem value="quarter">Current Quarter</SelectItem>
                    <SelectItem value="sixMonths">Last 6 Months</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateFilter === "custom" && (
                <>
                  <div className="flex-1 md:max-w-xs">
                    <Label htmlFor="customStartDate" className="text-sm font-medium mb-2">
                      Start Date
                    </Label>
                    <Input
                      id="customStartDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 md:max-w-xs">
                    <Label htmlFor="customEndDate" className="text-sm font-medium mb-2">
                      End Date
                    </Label>
                    <Input
                      id="customEndDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Create Bill Form - Only show in 'all' tab */}
      {subTab === "all" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {activeSubSection === "maintenance-bill" ? "Generate New Maintenance Bill" : "Create Maintenance Bill"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={newBill.customerId}
                  onValueChange={(value) => setNewBill({ ...newBill, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newBill.category}
                  onValueChange={(value: "cleaning" | "repair" | "general" | "emergency") =>
                    setNewBill({ ...newBill, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR )</Label>
                <Input
                  id="amount"
                  type="text"
                  step="0.01"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newBill.description}
                onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                placeholder="Describe the maintenance work"
                rows={3}
              />
            </div>

            <Button onClick={handleCreateBill} className="bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Maintenance Bill
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards for Unpaid/Paid tabs */}
      {subTab !== "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${
                subTab === "unpaid" ? "text-red-500" : 
                subTab === "waveoff" ? "text-blue-500" : "text-green-500"
              }`} />
              <div>
                <div className="text-sm text-gray-600">
                  {subTab === "unpaid" ? "Unpaid Bills" : 
                   subTab === "waveoff" ? "Waved Off Bills" : "Paid Bills"}
                </div>
                <div className={`text-xl font-bold ${
                  subTab === "unpaid" ? "text-red-600" : 
                  subTab === "waveoff" ? "text-blue-600" : "text-green-600"
                }`}>
                  {getCurrentBills(subTab).length}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">
                  {subTab === "unpaid" ? "Total Outstanding" : 
                   subTab === "waveoff" ? "Total Waved Off" : "Total Collected"}
                </div>
                <div className="text-xl font-bold text-blue-600">
                  PKR {getCurrentBills(subTab).reduce((sum, bill) =>
                    sum + (subTab === "unpaid" ? bill.remainingAmount : 
                           subTab === "waveoff" ? bill.amount : bill.paidAmount), 0
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-sm text-gray-600">Average Amount</div>
                <div className="text-xl font-bold text-purple-600">
                  PKR {getCurrentBills(subTab).length > 0
                    ? (getCurrentBills(subTab).reduce((sum, bill) => sum + bill.amount, 0) / getCurrentBills(subTab).length).toFixed(2)
                    : "0.00"
                  }
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {subTab === "all" && "All Maintenance Bills"}
            {subTab === "paid" && "Paid Maintenance Bills"}
            {subTab === "unpaid" && "Unpaid Maintenance Bills"}
            {subTab === "waveoff" && "Waved Off Maintenance Bills"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentBills(subTab).map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bill.customerName}</div>
                      <div className="text-sm text-gray-500">{bill.shopNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {bill.category}
                    </Badge>
                  </TableCell>
                  <TableCell>PKR {bill.amount.toFixed(2)}</TableCell>
                  <TableCell>PKR {bill.paidAmount.toFixed(2)}</TableCell>
                  <TableCell>PKR {bill.remainingAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 p-2">
                          <Badge variant={bill.status === "paid" ? "default" : bill.status === "waveoff" ? "outline" : "secondary"} className="cursor-pointer">
                            {bill.status === "waveoff" ? "Waved Off" : bill.status}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(bill.id, "pending")}
                          className={bill.status === "pending" ? "bg-blue-50" : ""}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            Generated
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(bill.id, "overdue")}
                          className={bill.status === "overdue" ? "bg-blue-50" : ""}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            Unpaid
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(bill.id, "paid")}
                          className={bill.status === "paid" ? "bg-blue-50" : ""}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Paid
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(bill.id, "waveoff")}
                          className={bill.status === "waveoff" ? "bg-blue-50" : ""}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            Waved Off
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>{bill.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintBill(bill)}
                        className="h-8 w-8 p-0"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBill(bill)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Maintenance Bill</DialogTitle>
                          </DialogHeader>
                          {editingBill && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="editDescription">Description</Label>
                                <Textarea
                                  id="editDescription"
                                  value={editingBill.description}
                                  onChange={(e) => setEditingBill({ ...editingBill, description: e.target.value })}
                                  rows={3}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="editAmount">Amount (PKR )</Label>
                                  <Input
                                    id="editAmount"
                                    type="text"
                                    step="0.01"
                                    value={editingBill.amount}
                                    onChange={(e) => setEditingBill({ ...editingBill, amount: parseFloat(e.target.value) || 0 })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="editDueDate">Due Date</Label>
                                  <Input
                                    id="editDueDate"
                                    type="date"
                                    value={editingBill.dueDate}
                                    onChange={(e) => setEditingBill({ ...editingBill, dueDate: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editCategory">Category</Label>
                                <Select
                                  value={editingBill.category}
                                  onValueChange={(value: "cleaning" | "repair" | "general" | "emergency") =>
                                    setEditingBill({ ...editingBill, category: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cleaning">Cleaning</SelectItem>
                                    <SelectItem value="repair">Repair</SelectItem>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingBill(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateBill}>
                                  Update Bill
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Maintenance Bill</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete bill {bill.billNumber}? This action cannot be undone.
                              All associated payments will also be affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBill(bill.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      {/* Record Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Record Maintenance Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billId">Select Bill</Label>
              <Select
                value={newPayment.billId}
                onValueChange={(value) => setNewPayment({ ...newPayment, billId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unpaid maintenance bill" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceBills
                    .filter(bill => bill.remainingAmount > 0)
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{bill.billNumber} - {bill.customerName}</span>
                          <span className="text-xs text-gray-500">
                            {bill.category} | Due: {bill.dueDate} | Remaining: PKR {bill.remainingAmount.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {maintenanceBills.filter(bill => bill.remainingAmount > 0).length === 0 && (
                <div className="text-sm text-gray-500">No unpaid maintenance bills available</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">Payment Amount (PKR )</Label>
              <div className="relative">
                <Input
                  id="paidAmount"
                  type="text"
                  step="0.01"
                  min="0"
                  value={newPayment.paidAmount}
                  onChange={(e) => setNewPayment({ ...newPayment, paidAmount: e.target.value })}
                  placeholder="Enter payment amount"
                />
                {newPayment.billId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 text-xs"
                    onClick={() => {
                      const selectedBill = maintenanceBills.find(b => b.id === newPayment.billId)
                      if (selectedBill) {
                        setNewPayment({ ...newPayment, paidAmount: selectedBill.remainingAmount.toString() })
                      }
                    }}
                  >
                    Full
                  </Button>
                )}
              </div>
              {newPayment.billId && (
                <div className="text-xs text-gray-500">
                  Remaining amount: PKR {maintenanceBills.find(b => b.id === newPayment.billId)?.remainingAmount.toFixed(2) || '0.00'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={newPayment.paymentMethod}
                onValueChange={(value: "cash" | "card" | "upi" | "bank_transfer") =>
                  setNewPayment({ ...newPayment, paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <span>💵</span>
                      <span>Cash Payment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <span>💳</span>
                      <span>Card Payment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <span>📱</span>
                      <span>UPI Payment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-2">
                      <span>🏦</span>
                      <span>Bank Transfer</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                placeholder="Add reference number, receipt details, or other notes..."
              />
              <div className="text-xs text-gray-500">
                Include transaction reference, receipt number, or any special instructions
              </div>
            </div>
          </div>

          <Button onClick={handleRecordPayment} className="bg-green-600 text-white hover:bg-green-700">
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Bill No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                  <TableCell>{payment.billNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.customerName}</div>
                      <div className="text-sm text-gray-500">{payment.shopNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell>PKR {payment.paidAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {payment.paymentMethod.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.paymentDate}</TableCell>
                  <TableCell>
                    <Badge variant="default">{payment.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderAdvancesTab = () => (
    <div className="space-y-6">
      {/* Create Advance Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Create Maintenance Advance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advanceCustomer">Customer</Label>
              <Select
                value={newAdvance.customerId}
                onValueChange={(value) => setNewAdvance({ ...newAdvance, customerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
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
              <Label htmlFor="advanceAmount">Advance Amount (PKR )</Label>
              <Input
                id="advanceAmount"
                type="text"
                step="0.01"
                value={newAdvance.advanceAmount}
                onChange={(e) => setNewAdvance({ ...newAdvance, advanceAmount: e.target.value })}
                placeholder="Enter advance amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="advanceNotes">Notes (Optional)</Label>
            <Textarea
              id="advanceNotes"
              value={newAdvance.notes}
              onChange={(e) => setNewAdvance({ ...newAdvance, notes: e.target.value })}
              placeholder="Add notes about the advance"
              rows={2}
            />
          </div>

          <Button onClick={handleCreateAdvance} className="bg-green-600 text-white hover:bg-green-700">
            <DollarSign className="h-4 w-4 mr-2" />
            Create Advance
          </Button>
        </CardContent>
      </Card>

      {/* Advances List */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Advances</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search advances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Advance Amount</TableHead>
                <TableHead>Used Amount</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Date Given</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvances.map((advance) => (
                <TableRow key={advance.id}>
                  <TableCell className="font-medium">{advance.customerName}</TableCell>
                  <TableCell>{advance.shopNumber}</TableCell>
                  <TableCell>PKR {advance.advanceAmount.toFixed(2)}</TableCell>
                  <TableCell>PKR {advance.usedAmount.toFixed(2)}</TableCell>
                  <TableCell>PKR {advance.remainingAmount.toFixed(2)}</TableCell>
                  <TableCell>{advance.dateGiven}</TableCell>
                  <TableCell>{advance.notes || "-"}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Maintenance Advance</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this advance for {advance.customerName}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAdvance(advance.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderInstalmentsTab = () => (
    <div className="space-y-6">
      {/* Create Partial Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create Maintenance Partial Payment Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instalmentCustomer">Customer</Label>
              <Select
                value={newInstalment.customerId}
                onValueChange={(value) => setNewInstalment({ ...newInstalment, customerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
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
              <Label htmlFor="totalAmount">Total Amount (PKR )</Label>
              <Input
                id="totalAmount"
                type="text"
                step="0.01"
                value={newInstalment.totalAmount}
                onChange={(e) => setNewInstalment({ ...newInstalment, totalAmount: e.target.value })}
                placeholder="Enter total amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instalmentAmount">Partial Payment Amount (PKR )</Label>
              <Input
                id="instalmentAmount"
                type="text"
                step="0.01"
                value={newInstalment.instalmentAmount}
                onChange={(e) => setNewInstalment({ ...newInstalment, instalmentAmount: e.target.value })}
                placeholder="Enter partial payment amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Calculated Partial Payments</Label>
              <div className="p-2 bg-gray-50 rounded">
                {newInstalment.totalAmount && newInstalment.instalmentAmount
                  ? Math.ceil(parseFloat(newInstalment.totalAmount) / parseFloat(newInstalment.instalmentAmount))
                  : 0}{" "}
                partial payments
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instalmentDescription">Description (Optional)</Label>
            <Textarea
              id="instalmentDescription"
              value={newInstalment.description}
              onChange={(e) => setNewInstalment({ ...newInstalment, description: e.target.value })}
              placeholder="Describe the partial payment plan"
              rows={2}
            />
          </div>

          <Button onClick={handleCreateInstalment} className="bg-purple-600 text-white hover:bg-purple-700">
            <Calendar className="h-4 w-4 mr-2" />
            Create Partial Payment Plan
          </Button>
        </CardContent>
      </Card>

      {/* Partial Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Partial Payments</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search partial payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Partial Payment Amount</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstalments.map((instalment) => (
                <TableRow key={instalment.id}>
                  <TableCell className="font-medium">{instalment.customerName}</TableCell>
                  <TableCell>{instalment.shopNumber}</TableCell>
                  <TableCell>PKR {instalment.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>PKR {instalment.instalmentAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    {instalment.paidInstalments}/{instalment.totalInstalments}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(instalment.paidInstalments / instalment.totalInstalments) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </TableCell>
                  <TableCell>{instalment.nextDueDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        instalment.status === "completed"
                          ? "default"
                          : instalment.status === "defaulted"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {instalment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading maintenance data...</span>
      </div>
    )
  }

  // Determine the correct bills sub-tab based on activeSubSection
  const getCurrentBillsSubTab = () => {
    if (activeSubSection === "maintenance-unpaid") return "unpaid"
    if (activeSubSection === "maintenance-paid") return "paid"
    if (activeSubSection === "maintenance-waveoff") return "waveoff"
    return billsSubTab
  }

  // Get section-specific titles
  const getSectionTitle = () => {
    switch (activeSubSection) {
      case "maintenance-bill":
        return "Generate Maintenance Bills"
      case "maintenance-payment":
        return "Record Maintenance Payment"
      case "maintenance-unpaid":
        return "Unpaid Maintenance Bills"
      case "maintenance-paid":
        return "Paid Maintenance Bills"
      case "maintenance-waveoff":
        return "Waved Off Maintenance Bills"
      case "maintenance-advance":
        return "Maintenance Advances"
      case "maintenance-instalments":
        return "Maintenance Instalments"
      default:
        return "Maintenance Management"
    }
  }

  // Render different content based on activeSubSection
  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case "maintenance-bill":
        return renderBillsTab()
      case "maintenance-advance":
        return renderAdvancesTab()
      case "maintenance-instalments":
        return renderInstalmentsTab()
      case "maintenance-payment":
        return renderPaymentsTab()
      case "maintenance-unpaid":
        return renderBillsTabWithSubTab("unpaid")
      case "maintenance-paid":
        return renderBillsTabWithSubTab("paid")
      case "maintenance-waveoff":
        return renderBillsTabWithSubTab("waveoff")
      default:
        return renderBillsTab()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-medium text-black">{getSectionTitle()}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {renderSubSectionContent()}
    </div>
  )
}