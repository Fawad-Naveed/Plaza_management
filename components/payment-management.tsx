"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Receipt, Search, Calendar, AlertCircle, CheckCircle, Clock, Download } from "lucide-react"
import {
  getBusinesses,
  getBillsByBusinessId,
  getPayments,
  createPayment,
  getBills,
  updateBill,
  getInformation,
  getPendingPayments,
  approvePendingPayment,
  rejectPendingPayment,
  getMeterReadings,
  getMaintenanceBills,
  type Business,
  type Bill,
  type Payment,
  type Information,
  type PendingPayment,
  type MeterReading,
} from "@/lib/database"

interface PaymentWithDetails extends Payment {
  receiptNumber: string
  billNumber?: string
  customerName?: string
  shopNumber?: string
  billAmount?: number
  paymentTime: string
  status: "completed" | "partial" | "pending"
}

interface BillWithDetails extends Bill {
  customerName?: string
  shopNumber?: string
  floor?: string
  billType: "electricity" | "maintenance" | "combined"
  paidAmount: number
  remainingAmount: number
  month: string
  year: string
  daysOverdue?: number
}

interface PendingPaymentWithDetails extends PendingPayment {
  customerName?: string
  shopNumber?: string
  billNumber?: string
  floor?: string
  businessType?: string
  billType?: 'Electricity' | 'Gas' | 'Maintenance' | 'Regular'
}

interface PaymentManagementProps {
  activeSubSection: string
}

export function PaymentManagement({ activeSubSection }: PaymentManagementProps) {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [bills, setBills] = useState<BillWithDetails[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [businessBills, setBusinessBills] = useState<BillWithDetails[]>([])
  const [businessInfo, setBusinessInfo] = useState<Information | null>(null)
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPendingPayments, setLoadingPendingPayments] = useState(true)
  const [loadingBusinesses, setLoadingBusinesses] = useState(false)
  const [loadingBills, setLoadingBills] = useState(false)
  const [selectedPendingPayment, setSelectedPendingPayment] = useState<PendingPaymentWithDetails | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)

  const [newPayment, setNewPayment] = useState({
    businessId: "",
    paidAmount: "",
    paymentMethod: "cash" as "cash" | "cheque" | "bank_transfer" | "upi" | "card",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentWithDetails | null>(null)
  const [activeTab, setActiveTab] = useState("bill-payment")

  const generateReceiptNumber = () => {
    const year = new Date().getFullYear()
    const count = payments.length + 1
    return `REC-${year}-${count.toString().padStart(3, "0")}`
  }

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // Filter bills based on search term
  const filteredBills = bills.filter((bill) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      bill.bill_number.toLowerCase().includes(searchLower) ||
      bill.customerName?.toLowerCase().includes(searchLower) ||
      bill.shopNumber?.toLowerCase().includes(searchLower)
    )
  })

  // Separate bills by status
  const filteredUnpaidBills = filteredBills.filter(bill => bill.status === "pending" || bill.status === "overdue")
  const filteredPaidBills = filteredBills.filter(bill => bill.status === "paid")

  const updateBillStatus = async (billId: string, newStatus: "pending" | "paid" | "waveoff") => {
    try {
      await updateBill(billId, { status: newStatus })
      // Reload data to reflect changes
      loadAllData()
    } catch (error) {
      console.error("Error updating bill status:", error)
    }
  }

  const downloadReceiptPDF = async (receipt: PaymentWithDetails) => {
    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import("jspdf")

      const doc = new jsPDF()

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
      doc.text("Payment Receipt", 105, headerYPos + 10, { align: "center" })

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

      // Receipt details
      const detailsYPos = headerYPos + 40
      doc.setFontSize(12)

      doc.text(`Receipt No: ${receipt.receiptNumber}`, 20, detailsYPos)
      doc.text(`Bill No: ${receipt.billNumber}`, 20, detailsYPos + 10)
      doc.text(`Customer: ${receipt.customerName}`, 20, detailsYPos + 20)
      doc.text(`Shop: ${receipt.shopNumber}`, 20, detailsYPos + 30)
      doc.text(`Date: ${receipt.payment_date}`, 20, detailsYPos + 40)
      doc.text(`Time: ${receipt.paymentTime}`, 20, detailsYPos + 50)
      doc.text(`Method: ${receipt.payment_method.replace("_", " ").toUpperCase()}`, 20, detailsYPos + 60)

      // Amount details
      const amountYPos = detailsYPos + 80
      doc.text(`Bill Amount: PKR ${(receipt.billAmount || 0).toFixed(2)}`, 20, amountYPos)

      doc.setFontSize(14)
      doc.text(`Amount Paid: PKR ${(receipt.amount || 0).toFixed(2)}`, 20, amountYPos + 15)

      // Notes if available
      if (receipt.notes) {
        doc.setFontSize(10)
        doc.text("Notes:", 20, amountYPos + 35)
        doc.text(receipt.notes, 20, amountYPos + 45)
      }

      // Footer
      const footerYPos = amountYPos + 60
      doc.setFontSize(10)
      doc.text("Thank you for your payment!", 105, footerYPos, { align: "center" })
      doc.text("Keep this receipt for your records.", 105, footerYPos + 10, { align: "center" })

      // Download the PDF
      doc.save(`Receipt_${receipt.receiptNumber}.pdf`)
    } catch (error) {
      console.error("Error generating receipt PDF:", error)
    }
  }

  const recordPayment = async () => {
    console.log("Record payment clicked", newPayment)

    if (!newPayment.businessId) {
      alert("Please select a business")
      return
    }

    if (!newPayment.paidAmount) {
      alert("Please enter payment amount")
      return
    }

    if (!newPayment.paymentDate) {
      alert("Please select payment date")
      return
    }

    try {
      // Find the oldest unpaid bill for this business
      const businessUnpaidBills = bills
        .filter(bill => bill.business_id === newPayment.businessId && bill.status !== "paid")
        .sort((a, b) => new Date(a.bill_date).getTime() - new Date(b.bill_date).getTime())

      const oldestBill = businessUnpaidBills[0]

      if (!oldestBill) {
        alert("No unpaid bills found for this business")
        return
      }

      const paidAmount = Number.parseFloat(newPayment.paidAmount)
      const newPaidTotal = (oldestBill.paidAmount || 0) + paidAmount
      const newRemainingAmount = (oldestBill.total_amount || 0) - newPaidTotal

      const paymentData = {
        business_id: newPayment.businessId,
        bill_id: oldestBill.id,
        payment_date: newPayment.paymentDate,
        amount: paidAmount,
        payment_method: newPayment.paymentMethod,
        notes: newPayment.notes,
      }

      const createdPayment = await createPayment(paymentData)

      if (!createdPayment) {
        throw new Error("Failed to create payment")
      }

      const updatedBillData = {
        status: newRemainingAmount <= 0 ? ("paid" as const) : ("pending" as const),
      }

      await updateBill(oldestBill.id, updatedBillData)

      const business = businesses.find(b => b.id === newPayment.businessId)
      const paymentWithDetails: PaymentWithDetails = {
        ...createdPayment,
        receiptNumber: generateReceiptNumber(),
        billNumber: oldestBill.bill_number,
        customerName: business?.name || "Unknown",
        shopNumber: business?.shop_number || "N/A",
        billAmount: oldestBill.total_amount,
        paymentTime: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
        status: newRemainingAmount <= 0 ? "completed" : "partial",
      }

      setPayments([...payments, paymentWithDetails])

      await loadAllData()

      setNewPayment({
        businessId: "",
        paidAmount: "",
        paymentMethod: "cash",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
      })
    } catch (error) {
      console.error("Error recording payment:", error)
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    setLoadingPendingPayments(true)
    try {
      const businessesData = await getBusinesses()
      setBusinesses(businessesData)

      // Load business information for branding
      try {
        const info = await getInformation()
        setBusinessInfo(info)
      } catch (error) {
        console.log("No business information found")
      }

      const billsData = await getBills()
      const paymentsData = await getPayments()
      const pendingPaymentsData = await getPendingPayments()
      const meterReadingsData = await getMeterReadings() // Load all meter readings
      const maintenanceBillsData = await getMaintenanceBills() // Load all maintenance bills

      // Load pending payments with details
      const pendingPaymentsWithDetails = pendingPaymentsData.map((pendingPayment): PendingPaymentWithDetails => {
        const business = businessesData.find((b) => b.id === pendingPayment.business_id)
        let billNumber = "N/A"
        let billType = "Regular"
        
        // Debug logging
        console.log('Processing pending payment:', {
          id: pendingPayment.id,
          bill_id: pendingPayment.bill_id,
          notes: pendingPayment.notes,
          maintenanceBillsCount: maintenanceBillsData.length
        })
        
        // Check if this is a meter reading payment (check notes for [ELECTRICITY] or [GAS] marker)
        if (pendingPayment.notes?.includes('[ELECTRICITY]')) {
          // This is an electricity payment - find the meter reading
          const meterReading = meterReadingsData.find(mr => mr.id === pendingPayment.bill_id)
          if (meterReading) {
            billNumber = meterReading.bill_number || `ELE-${pendingPayment.bill_id.slice(-6).toUpperCase()}`
            billType = "Electricity"
          } else {
            billNumber = `ELE-${pendingPayment.bill_id.slice(-6).toUpperCase()}`
            billType = "Electricity"
          }
        } else if (pendingPayment.notes?.includes('[GAS]')) {
          // This is a gas payment - find the meter reading
          const meterReading = meterReadingsData.find(mr => mr.id === pendingPayment.bill_id)
          if (meterReading) {
            billNumber = meterReading.bill_number || `GAS-${pendingPayment.bill_id.slice(-6).toUpperCase()}`
            billType = "Gas"
          } else {
            billNumber = `GAS-${pendingPayment.bill_id.slice(-6).toUpperCase()}`
            billType = "Gas"
          }
        } else if (pendingPayment.notes?.toLowerCase().includes('maintenance')) {
          // This is a maintenance bill - find the maintenance bill
          console.log('Found maintenance in notes, looking for bill_id:', pendingPayment.bill_id)
          const maintenanceBill = maintenanceBillsData.find(mb => mb.id === pendingPayment.bill_id)
          console.log('Found maintenance bill:', maintenanceBill)
          if (maintenanceBill) {
            billNumber = maintenanceBill.bill_number || `MAINT-${pendingPayment.bill_id.slice(-6).toUpperCase()}`
            billType = "Maintenance"
          } else {
            billNumber = `MAINT-${pendingPayment.bill_id.slice(-6).toUpperCase()}`
            billType = "Maintenance"
          }
        } else {
          // Check if this is a maintenance bill by looking at the bill_id
          console.log('Checking fallback - looking for bill_id in maintenance bills:', pendingPayment.bill_id)
          const maintenanceBill = maintenanceBillsData.find(mb => mb.id === pendingPayment.bill_id)
          console.log('Fallback maintenance bill found:', maintenanceBill)
          if (maintenanceBill) {
            billNumber = maintenanceBill.bill_number || `MAINT-${pendingPayment.bill_id.slice(-6).toUpperCase()}`
            billType = "Maintenance"
          } else {
            // Regular bill
            const bill = billsData.find((b) => b.id === pendingPayment.bill_id)
            billNumber = bill?.bill_number || "N/A"
            billType = "Regular"
          }
        }

        return {
          ...pendingPayment,
          customerName: business?.name || "Unknown",
          shopNumber: business?.shop_number || "N/A",
          billNumber: billNumber,
          billType: billType,
          floor: `Floor ${business?.floor_number || 0}`,
          businessType: business?.type || "Unknown",
        }
      })
      setPendingPayments(pendingPaymentsWithDetails)
      setLoadingPendingPayments(false)

      const billsWithDetails = billsData.map((bill): BillWithDetails => {
        const business = businessesData.find((b) => b.id === bill.business_id)
        const totalAmount = bill.total_amount || 0

        const paidAmount = paymentsData
          .filter((payment) => payment.bill_id === bill.id)
          .reduce((sum, payment) => sum + (payment.amount || 0), 0)

        const remainingAmount = totalAmount - paidAmount

        return {
          ...bill,
          customerName: business?.name || "Unknown",
          shopNumber: business?.shop_number || "N/A",
          floor: `Floor ${business?.floor_number || 0}`,
          billType:
            bill.electricity_charges > 0 && bill.maintenance_charges > 0
              ? "combined"
              : bill.electricity_charges > 0
                ? "electricity"
                : "maintenance",
          paidAmount,
          remainingAmount,
          month: new Date(bill.bill_date).toLocaleDateString("en-US", { month: "long" }),
          year: new Date(bill.bill_date).getFullYear().toString(),
          daysOverdue: bill.status === "overdue" ? calculateDaysOverdue(bill.due_date) : undefined,
        }
      })
      setBills(billsWithDetails)

      const paymentsWithDetails = paymentsData.map((payment): PaymentWithDetails => {
        const business = businessesData.find((b) => b.id === payment.business_id)
        const bill = billsData.find((b) => b.id === payment.bill_id)

        return {
          ...payment,
          receiptNumber: `REC-${new Date(payment.payment_date).getFullYear()}-${payment.id.slice(-3)}`,
          billNumber: bill?.bill_number || "N/A",
          customerName: business?.name || "Unknown",
          shopNumber: business?.shop_number || "N/A",
          billAmount: bill?.total_amount || 0,
          paymentTime: new Date(payment.created_at).toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "completed" as const,
        }
      })
      setPayments(paymentsWithDetails)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadBusinessRentAmount = async (businessId: string) => {
    console.log("Loading rent amount for business:", businessId)
    setLoadingBills(true)
    try {
      const business = businesses.find((b) => b.id === businessId)
      if (business) {
        // Set the rent amount from the business record
        setNewPayment(prev => ({
          ...prev,
          paidAmount: business.rent_amount.toString()
        }))
        console.log("Loaded rent amount:", business.rent_amount)
      }
    } catch (error) {
      console.error("Error loading business rent amount:", error)
    } finally {
      setLoadingBills(false)
    }
  }

  const handleApprovePendingPayment = async (pendingPayment: PendingPaymentWithDetails, action: 'approve' | 'reject') => {
    setSelectedPendingPayment(pendingPayment)
    if (action === 'approve') {
      setShowApprovalDialog(true)
    } else {
      // For rejection, we can ask for notes directly
      const notes = prompt('Please provide a reason for rejection:')
      if (notes) {
        setLoadingPendingPayments(true)
        await handleRejectPayment(pendingPayment.id, notes)
      }
    }
  }

  const handleApprovePayment = async () => {
    if (!selectedPendingPayment) return
    
    try {
      setLoading(true)
      setLoadingPendingPayments(true)
      await approvePendingPayment(selectedPendingPayment.id, 'Admin', reviewNotes)
      setShowApprovalDialog(false)
      setSelectedPendingPayment(null)
      setReviewNotes('')
      await loadAllData() // Reload data to reflect changes
      alert('Payment approved successfully!')
    } catch (error) {
      console.error('Error approving payment:', error)
      alert('Failed to approve payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectPayment = async (pendingPaymentId: string, notes: string) => {
    try {
      setLoading(true)
      await rejectPendingPayment(pendingPaymentId, 'Admin', notes)
      await loadAllData() // Reload data to reflect changes
      alert('Payment rejected successfully!')
    } catch (error) {
      console.error('Error rejecting payment:', error)
      alert('Failed to reject payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const allUnpaidBills = bills.filter((bill) => bill.status !== "paid")
  const allPaidBills = bills.filter((bill) => bill.status === "paid")

  const filteredPayments = payments.filter(
    (payment) =>
      payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const searchFilteredUnpaidBills = allUnpaidBills.filter(
    (bill) =>
      bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.shopNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getSectionTitle = () => {
    return "Payment Management"
  }

  const renderBillPayment = () => (
    <div className="space-y-6">
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Record Rent Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Debug info - remove in production */}
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            Debug: {businesses.length} businesses loaded
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business">Select Business</Label>
              <Select
                value={newPayment.businessId}
                onValueChange={(value) => setNewPayment({ ...newPayment, businessId: value })}
                disabled={loadingBusinesses}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingBusinesses ? "Loading businesses..." : "Select business"} />
                </SelectTrigger>
                <SelectContent>
                  {businesses.length === 0 ? (
                    <SelectItem value="no-businesses" disabled>
                      No businesses found
                    </SelectItem>
                  ) : (
                    businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name} - {business.shop_number}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>



            <div className="space-y-2">
              <Label htmlFor="paidAmount">Rent Amount (PKR)</Label>
              <Input
                id="paidAmount"
                type="text"
                step="0.01"
                value={newPayment.paidAmount}
                onChange={(e) => setNewPayment({ ...newPayment, paidAmount: e.target.value })}
                placeholder="Rent amount will be loaded automatically"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={newPayment.paymentMethod}
                onValueChange={(value) =>
                  setNewPayment({ ...newPayment, paymentMethod: value as "cash" | "cheque" | "bank_transfer" | "upi" | "card" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={newPayment.paymentDate}
                onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={newPayment.notes}
              onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
              placeholder="Add payment notes"
            />
          </div>

          {newPayment.businessId && (
            <div className="p-4 bg-gray-50 rounded-lg">
              {(() => {
                const selectedBusiness = businesses.find((b) => b.id === newPayment.businessId)
                const businessUnpaidBills = bills.filter(bill =>
                  bill.business_id === newPayment.businessId && bill.status !== "paid"
                ).length

                return selectedBusiness ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Business:</span>
                      <br />
                      {selectedBusiness.name}
                    </div>
                    <div>
                      <span className="font-medium">Shop Number:</span>
                      <br />{selectedBusiness.shop_number}
                    </div>
                    <div>
                      <span className="font-medium">Monthly Rent:</span>
                      <br />PKR {selectedBusiness.rent_amount.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Unpaid Bills:</span>
                      <br />{businessUnpaidBills} bill(s)
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          )}

          <Button
            onClick={recordPayment}
            className="bg-green-600 text-white hover:bg-green-700"
            disabled={!newPayment.businessId || !newPayment.paidAmount || !newPayment.paymentDate}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Record Rent Payment
          </Button>

          {(!newPayment.businessId || !newPayment.paidAmount) && (
            <p className="text-sm text-gray-500">
              Please select a business and enter rent amount to record payment.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading payments...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.slice(-5).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                    <TableCell>{payment.customerName}</TableCell>
                    <TableCell>{payment.billNumber}</TableCell>
                    <TableCell>PKR {(payment.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.payment_method.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.payment_date}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(payment)}>
                        <Receipt className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderUnpaidBills = () => (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Unpaid Bills
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-sm text-gray-600">Overdue Bills</div>
                <div className="text-xl font-bold text-red-600">
                  {allUnpaidBills.filter((b) => b.status === "overdue").length}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-sm text-gray-600">Pending Bills</div>
                <div className="text-xl font-bold text-yellow-600">
                  {allUnpaidBills.filter((b) => b.status === "pending").length}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">Total Outstanding</div>
                <div className="text-xl font-bold text-blue-600">
                  PKR {allUnpaidBills.reduce((sum, bill) => sum + (bill.remainingAmount || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill No.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Paid Amount</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchFilteredUnpaidBills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">{bill.bill_number}</TableCell>
                <TableCell>{bill.customerName}</TableCell>
                <TableCell>{bill.shopNumber}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {bill.billType}
                  </Badge>
                </TableCell>
                <TableCell>PKR {(bill.total_amount || 0).toFixed(2)}</TableCell>
                <TableCell>PKR {(bill.paidAmount || 0).toFixed(2)}</TableCell>
                <TableCell className="font-medium">PKR {(bill.remainingAmount || 0).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {bill.due_date}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      bill.status === "overdue" ? "destructive" :
                        bill.status === "waveoff" ? "outline" :
                        bill.paidAmount > 0 && bill.remainingAmount > 0 ? "secondary" :
                          "outline"
                    }
                  >
                    {bill.paidAmount > 0 && bill.remainingAmount > 0 ? "Partial" : bill.status === "waveoff" ? "Waved Off" : bill.status}
                    {bill.daysOverdue && bill.daysOverdue > 0 && ` (${bill.daysOverdue}d)`}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={bill.status}
                    onValueChange={(value: "pending" | "paid" | "waveoff") => updateBillStatus(bill.id, value)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="waveoff">Waved Off</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  const renderPaidBills = () => (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Paid Bills
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-600">Paid Bills</div>
                <div className="text-xl font-bold text-green-600">{allPaidBills.length}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">Total Collected</div>
                <div className="text-xl font-bold text-blue-600">
                  PKR {allPaidBills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-sm text-gray-600">This Month</div>
                <div className="text-xl font-bold text-purple-600">
                  {
                    allPaidBills.filter((b) => {
                      const billMonth = new Date(b.bill_date).getMonth()
                      const currentMonth = new Date().getMonth()
                      return billMonth === currentMonth
                    }).length
                  }
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill No.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Bill Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPaidBills.filter((bill) =>
              bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
              bill.shopNumber?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">{bill.bill_number}</TableCell>
                <TableCell>{bill.customerName}</TableCell>
                <TableCell>{bill.shopNumber}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {bill.billType}
                  </Badge>
                </TableCell>
                <TableCell>PKR {(bill.total_amount || 0).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {bill.bill_date}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={bill.status === "waveoff" ? "outline" : "default"}>
                    {bill.status === "waveoff" ? "Waved Off" : bill.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={bill.status}
                    onValueChange={(value: "pending" | "paid" | "waveoff") => updateBillStatus(bill.id, value)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="waveoff">Waved Off</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  const renderPendingPayments = () => (
    <div className="space-y-6">
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            Pending Payment Approvals
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search pending payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPendingPayments && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
              <p className="ml-4 text-lg font-semibold text-gray-600">Loading pending payments...</p>
            </div>
          )}
          {!loadingPendingPayments && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="text-sm text-gray-600">Pending Approvals</div>
                    <div className="text-xl font-bold text-yellow-600">
                      {pendingPayments.filter(p => p.status === 'pending').length}
                    </div>
                  </div>
                </div>
              </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-sm text-gray-600">Approved Today</div>
                  <div className="text-xl font-bold text-green-600">
                    {pendingPayments.filter(p => p.status === 'approved' && 
                      new Date(p.reviewed_at || '').toDateString() === new Date().toDateString()).length}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-sm text-gray-600">Total Amount Pending</div>
                  <div className="text-xl font-bold text-red-600">
                    PKR {pendingPayments
                      .filter(p => p.status === 'pending')
                      .reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
            </div>
          )}

          {!loadingPendingPayments && pendingPayments.filter(p => p.status === 'pending').length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Pending Payments</h3>
              <p className="text-sm text-gray-500">There are currently no payment submissions awaiting approval.</p>
            </div>
          )}

          {!loadingPendingPayments && pendingPayments.filter(p => p.status === 'pending').length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments
                  .filter(payment => payment.status === 'pending')
                  .filter(payment =>
                    payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    payment.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    payment.shopNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(payment.submitted_at).toLocaleDateString()}</div>
                        <div className="text-gray-500">{new Date(payment.submitted_at).toLocaleTimeString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.customerName}</div>
                        <div className="text-sm text-gray-500">{payment.shopNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.billNumber}</div>
                        <div className="text-xs">
                          <Badge
                            variant="outline"
                            className={
                              payment.billType === 'Electricity'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : payment.billType === 'Maintenance'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                            }
                          >
                            {payment.billType === 'Electricity' ? '⚡ Electricity' : payment.billType === 'Maintenance' ? '🛠 Maintenance' : '🏢 Rental'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-green-600">PKR {payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.payment_method.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprovePendingPayment(payment, 'approve')}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApprovePendingPayment(payment, 'reject')}
                          disabled={loading}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    // If activeSubSection is payment-unpaid, show pending payments for admin approval
    if (activeSubSection === 'payment-unpaid') {
      return renderPendingPayments()
    }
    
    // If activeSubSection is payment-paid, show payment history
    if (activeSubSection === 'payment-paid') {
      return renderPaidBills()
    }
    
    // Default tabbed interface for other cases
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bill-payment">Bill Payment</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid Bills ({allUnpaidBills.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid Bills ({allPaidBills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="bill-payment" className="space-y-6">
          {renderBillPayment()}
        </TabsContent>

        <TabsContent value="unpaid" className="space-y-6">
          {renderUnpaidBills()}
        </TabsContent>

        <TabsContent value="paid" className="space-y-6">
          {renderPaidBills()}
        </TabsContent>
      </Tabs>
    )
  }

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    if (newPayment.businessId) {
      loadBusinessRentAmount(newPayment.businessId)
    } else {
      setNewPayment((prev) => ({ ...prev, paidAmount: "" }))
    }
  }, [newPayment.businessId])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black">{getSectionTitle()}</h1>
      {renderContent()}

      {selectedReceipt && (
        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                {businessInfo?.logo_url && (
                  <div className="flex justify-center mb-2">
                    <img
                      src={businessInfo.logo_url}
                      alt={businessInfo.business_name}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <h2 className="text-lg font-bold">
                  {businessInfo?.business_name?.toUpperCase() || "PLAZA MANAGEMENT"}
                </h2>
                <p className="text-sm text-gray-600">Payment Receipt</p>
                {businessInfo?.contact_email && (
                  <p className="text-xs text-gray-500">{businessInfo.contact_email}</p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Receipt No:</span>
                  <span className="font-medium">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bill No:</span>
                  <span className="font-medium">{selectedReceipt.billNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-medium">{selectedReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shop:</span>
                  <span className="font-medium">{selectedReceipt.shopNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">{selectedReceipt.payment_date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">{selectedReceipt.paymentTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="font-medium capitalize">{selectedReceipt.payment_method.replace("_", " ")}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Bill Amount:</span>
                  <span>PKR {(selectedReceipt.billAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Amount Paid:</span>
                  <span>PKR {(selectedReceipt.amount || 0).toFixed(2)}</span>
                </div>
              </div>

              {selectedReceipt.notes && (
                <div className="text-sm">
                  <span className="font-medium">Notes:</span>
                  <p className="text-gray-600">{selectedReceipt.notes}</p>
                </div>
              )}

              <div className="text-center text-xs text-gray-500 border-t pt-4">
                <p>Thank you for your payment!</p>
                <p>Keep this receipt for your records.</p>
              </div>

              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => downloadReceiptPDF(selectedReceipt)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Dialog */}
      {showApprovalDialog && selectedPendingPayment && (
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Approve Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Business:</span>
                  <span className="font-medium">{selectedPendingPayment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shop:</span>
                  <span className="font-medium">{selectedPendingPayment.shopNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bill No:</span>
                  <span className="font-medium">{selectedPendingPayment.billNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium text-green-600">PKR {selectedPendingPayment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium capitalize">{selectedPendingPayment.payment_method.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Submitted:</span>
                  <span className="font-medium">{new Date(selectedPendingPayment.submitted_at).toLocaleString()}</span>
                </div>
                {selectedPendingPayment.notes && (
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="text-gray-600 text-xs mt-1">{selectedPendingPayment.notes}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="review-notes">Admin Notes (Optional)</Label>
                <textarea
                  id="review-notes"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Add any notes about this approval..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalDialog(false)
                    setSelectedPendingPayment(null)
                    setReviewNotes('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApprovePayment}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
