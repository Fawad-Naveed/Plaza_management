"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Receipt,
  CreditCard,
  User,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Circle
} from "lucide-react"
import { getAuthState, logout } from "@/lib/auth"
import { clientDb, createPendingPayment, getPendingPaymentsByBusiness } from "@/lib/database"
import type { Business, Bill, Payment, MaintenanceBill, MaintenancePayment, MeterReading, PendingPayment } from "@/lib/database"

export function BusinessDashboard() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [maintenanceBills, setMaintenanceBills] = useState<MaintenanceBill[]>([])
  const [maintenancePayments, setMaintenancePayments] = useState<MaintenancePayment[]>([])
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([])
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadBusinessData()
  }, [])

  // Function to submit payment for admin approval (instead of direct payment)
  const submitPaymentForApproval = async (billId: string, billType: 'regular' | 'maintenance' | 'electricity', currentStatus: string) => {
    // Only allow submission for unpaid bills
    if (currentStatus === 'paid') {
      alert('This bill is already paid!')
      return
    }
    
    try {
      setLoading(true)
      
      const authState = getAuthState()
      if (!authState || !authState.businessId) {
        setError('Authentication required')
        return
      }
      
      let bill: Bill | MaintenanceBill | MeterReading | undefined
      let amount: number
      
      if (billType === 'regular') {
        bill = bills.find(b => b.id === billId)
        amount = bill?.total_amount || 0
      } else if (billType === 'maintenance') {
        bill = maintenanceBills.find(b => b.id === billId)
        amount = (bill as MaintenanceBill)?.amount || 0
      } else if (billType === 'electricity') {
        bill = meterReadings.find(r => r.id === billId)
        amount = (bill as MeterReading)?.amount || 0
      }
      
      if (!bill) {
        setError('Bill not found')
        return
      }
      
      // For electricity meter readings, we create a pending payment using the meter reading ID directly
      // We'll indicate it's from a meter reading in the notes field
      if (billType === 'electricity') {
        // Create pending payment for electricity meter reading
        const pendingPaymentData = {
          business_id: authState.businessId,
          bill_id: billId, // Use the meter reading ID directly
          amount: amount,
          payment_method: 'cash' as const,
          payment_date: new Date().toISOString().split('T')[0],
          notes: `[ELECTRICITY] Payment submitted by ${authState.businessName || 'Business User'} for electricity meter reading. Meter Reading ID: ${billId}`,
          submitted_by: authState.businessName || 'Business User'
        }
        
        await createPendingPayment(pendingPaymentData)
        
        alert('Electricity bill payment submitted for admin approval! Please wait for approval.')
        
        // Reload data to reflect any changes
        await loadBusinessData()
        return
      }
      
      // Create pending payment for admin approval (only for rental and maintenance bills)
      const pendingPaymentData = {
        business_id: authState.businessId,
        bill_id: billId,
        amount: amount,
        payment_method: 'cash' as const, // Default method, admin can see this
        payment_date: new Date().toISOString().split('T')[0],
        notes: `Payment submitted by ${authState.businessName || 'Business User'} for ${billType} bill`,
        submitted_by: authState.businessName || 'Business User'
      }
      
      await createPendingPayment(pendingPaymentData)
      
      alert('Payment submitted for admin approval! Please wait for approval.')
      
      // Reload data to reflect any changes
      await loadBusinessData()
      
    } catch (err) {
      console.error('Error submitting payment for approval:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit payment for approval')
      alert('Failed to submit payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadBusinessData = async () => {
    try {
      setLoading(true)
      setError('')

      const authState = getAuthState()
      if (!authState || !authState.businessId) {
        setError('No authentication found. Please sign in again.')
        setTimeout(() => logout(), 3000)
        return
      }

      const businessId = authState.businessId

      // Load business details
      const businessResult = await clientDb.getBusiness(businessId)
      if (businessResult.error) throw businessResult.error
      setBusiness(businessResult.data)

      // Load bills
      const billsResult = await clientDb.getBills(businessId)
      if (billsResult.error) throw billsResult.error
      setBills(billsResult.data || [])

      // Load payments
      const paymentsResult = await clientDb.getPayments(businessId)
      if (paymentsResult.error) throw paymentsResult.error
      setPayments(paymentsResult.data || [])

      // Load maintenance bills
      const maintenanceBillsResult = await clientDb.getMaintenanceBills(businessId)
      if (maintenanceBillsResult.error) throw maintenanceBillsResult.error
      setMaintenanceBills(maintenanceBillsResult.data || [])

      // Load maintenance payments
      const maintenancePaymentsResult = await clientDb.getMaintenancePayments(businessId)
      if (maintenancePaymentsResult.error) throw maintenancePaymentsResult.error
      setMaintenancePayments(maintenancePaymentsResult.data || [])

      // Load meter readings (electricity bills)
      const meterReadingsResult = await clientDb.getMeterReadings(businessId)
      if (meterReadingsResult.error) throw meterReadingsResult.error
      setMeterReadings(meterReadingsResult.data || [])

      // Load pending payments
      const pendingPaymentsData = await getPendingPaymentsByBusiness(businessId)
      setPendingPayments(pendingPaymentsData || [])

    } catch (err) {
      console.error('Error loading business data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load business data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Helper function to check if a bill has a pending payment
  const hasPendingPayment = (billId: string, billType: 'regular' | 'maintenance' | 'electricity') => {
    return pendingPayments.some(pending => {
      if (billType === 'electricity') {
        // For electricity bills, check if there's a pending payment with the meter reading ID in notes
        return pending.notes && pending.notes.includes(`[ELECTRICITY]`) && pending.notes.includes(billId)
      }
      return pending.bill_id === billId && pending.status === 'pending'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading your business data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => logout()} className="w-full">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Business not found</p>
            <Button onClick={() => logout()} className="mt-4">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const authState = getAuthState()
  const totalBills = bills.length + maintenanceBills.length + meterReadings.length
  const paidElectricityBills = meterReadings.filter(reading => reading.payment_status === 'paid')
  const totalPayments = payments.length + maintenancePayments.length + paidElectricityBills.length
  const unpaidBills = [...bills, ...maintenanceBills].filter(bill => bill.status === 'pending')
  const unpaidMeterReadings = meterReadings.filter(reading => reading.payment_status !== 'paid')
  const allUnpaidBills = [...unpaidBills, ...unpaidMeterReadings]
  const totalUnpaidAmount = unpaidBills.reduce((sum, bill) => sum + (bill.total_amount || bill.amount), 0) + 
                          unpaidMeterReadings.reduce((sum, reading) => sum + (reading.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
                <p className="text-sm text-gray-600">Business Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Welcome, {authState?.businessName}
                </p>
                <p className="text-xs text-gray-600">Shop {business.shop_number}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:shadow-2xl hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBills}</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:shadow-2xl hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unpaid Bills</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-orange-600">{allUnpaidBills.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:shadow-2xl hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
                <CreditCard className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalUnpaidAmount)}</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:shadow-2xl hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalPayments}</div>
              </CardContent>
            </Card>
          </div>

          {/* Business Details */}
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden transition-all duration-300 ease-out hover:shadow-2xl hover:scale-[1.01]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Contact Person</p>
                      <p className="font-medium">{business.contact_person}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{business.phone}</p>
                    </div>
                  </div>
                  
                  {business.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{business.email}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">Floor {business.floor_number}, Shop {business.shop_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Monthly Rent</p>
                      <p className="font-medium">{formatCurrency(business.rent_amount)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <div>{getStatusBadge(business.status)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Bills */}
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden transition-all duration-300 ease-out hover:shadow-2xl hover:scale-[1.01]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Bills</CardTitle>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <Circle className="h-4 w-4" />
                    <span>Unpaid - Click to submit for approval</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Pending - Waiting for admin approval</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Paid - Approved by admin</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {totalBills === 0 ? (
                <p className="text-gray-600 text-center py-8">No bills found</p>
              ) : (
                <div className="space-y-4">
                  {/* Regular Bills */}
                  {bills.slice(0, 5).map((bill) => (
                    <div key={`bill-${bill.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Status indicator and checkbox */}
                        <div className="flex items-center">
                          <button
                            onClick={() => submitPaymentForApproval(bill.id, 'regular', bill.status)}
                            className="flex items-center gap-1 hover:text-green-600 transition-colors"
                            title={
                              bill.status === 'paid' ? 'Already paid' : 
                              hasPendingPayment(bill.id, 'regular') ? 'Payment submitted, waiting for approval' :
                              'Submit payment for approval'
                            }
                            disabled={loading || bill.status === 'paid' || hasPendingPayment(bill.id, 'regular')}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              bill.status === 'paid' ? 'bg-green-500' : 
                              hasPendingPayment(bill.id, 'regular') ? 'bg-blue-500' : 'bg-orange-500'
                            }`}></div>
                            {bill.status === 'paid' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : hasPendingPayment(bill.id, 'regular') ? (
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
                            )}
                          </button>
                        </div>
                        <div>
                          <p className="font-medium">{bill.bill_number}</p>
                          <p className="text-sm text-gray-600">Due: {formatDate(bill.due_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(bill.total_amount)}</p>
                        {getStatusBadge(bill.status)}
                      </div>
                    </div>
                  ))}
                  
                  {/* Maintenance Bills */}
                  {maintenanceBills.slice(0, 5).map((bill) => (
                    <div key={`maintenance-${bill.id}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Status indicator and checkbox */}
                        <div className="flex items-center">
                          <button
                            onClick={() => submitPaymentForApproval(bill.id, 'maintenance', bill.status)}
                            className="flex items-center gap-1 hover:text-green-600 transition-colors"
                            title={
                              bill.status === 'paid' ? 'Already paid' : 
                              hasPendingPayment(bill.id, 'maintenance') ? 'Payment submitted, waiting for approval' :
                              'Submit payment for approval'
                            }
                            disabled={loading || bill.status === 'paid' || hasPendingPayment(bill.id, 'maintenance')}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              bill.status === 'paid' ? 'bg-green-500' : 
                              hasPendingPayment(bill.id, 'maintenance') ? 'bg-blue-500' : 'bg-orange-500'
                            }`}></div>
                            {bill.status === 'paid' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : hasPendingPayment(bill.id, 'maintenance') ? (
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
                            )}
                          </button>
                        </div>
                        <div>
                          <p className="font-medium">{bill.bill_number}</p>
                          <p className="text-sm text-gray-600">Maintenance - {formatDate(bill.due_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(bill.amount)}</p>
                        {getStatusBadge(bill.status)}
                      </div>
                    </div>
                  ))}
                  
                  {/* Electricity Meter Readings */}
                  {meterReadings.filter(reading => reading.meter_type === 'electricity').slice(0, 5).map((reading) => (
                    <div key={`electricity-${reading.id}`} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Status indicator and checkbox */}
                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              // For meter readings, we need to handle differently since they don't use the same status system
                              if (reading.payment_status === 'paid') {
                                alert('This electricity bill is already paid!')
                                return
                              }
                              if (hasPendingPayment(reading.id, 'electricity')) {
                                alert('Payment already submitted for this electricity bill!')
                                return
                              }
                              // Create a pending payment for this meter reading
                              submitPaymentForApproval(reading.id, 'electricity', reading.payment_status || 'pending')
                            }}
                            className="flex items-center gap-1 hover:text-green-600 transition-colors"
                            title={
                              reading.payment_status === 'paid' ? 'Already paid' : 
                              hasPendingPayment(reading.id, 'electricity') ? 'Payment submitted, waiting for approval' :
                              'Submit payment for approval'
                            }
                            disabled={loading || reading.payment_status === 'paid' || hasPendingPayment(reading.id, 'electricity')}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              reading.payment_status === 'paid' ? 'bg-green-500' : 
                              hasPendingPayment(reading.id, 'electricity') ? 'bg-blue-500' : 'bg-orange-500'
                            }`}></div>
                            {reading.payment_status === 'paid' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : hasPendingPayment(reading.id, 'electricity') ? (
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
                            )}
                          </button>
                        </div>
                        <div>
                          <p className="font-medium">{reading.bill_number || `ELE-${reading.id.slice(-6).toUpperCase()}`}</p>
                          <p className="text-sm text-gray-600">Electricity - {formatDate(reading.reading_date)} ({reading.units_consumed} units)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(reading.amount)}</p>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reading.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reading.payment_status === 'paid' ? 'paid' : 'pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden transition-all duration-300 ease-out hover:shadow-2xl hover:scale-[1.01]">
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Create unified list of all payments sorted by date
                const allPayments = [
                  ...payments.map(p => ({ 
                    ...p, 
                    type: 'regular', 
                    date: new Date(p.payment_date),
                    displayTitle: `Rent Payment - ${p.payment_method.toUpperCase()}`,
                    bgColor: 'bg-green-50 hover:bg-green-100',
                    textColor: 'text-green-600'
                  })),
                  ...maintenancePayments.map(p => ({ 
                    ...p, 
                    type: 'maintenance', 
                    date: new Date(p.payment_date),
                    displayTitle: `Maintenance Payment - ${p.payment_method.toUpperCase()}`,
                    bgColor: 'bg-blue-50 hover:bg-blue-100',
                    textColor: 'text-blue-600'
                  })),
                  ...paidElectricityBills.map(r => ({ 
                    ...r, 
                    type: 'electricity', 
                    date: new Date(r.marked_paid_date || r.reading_date),
                    displayTitle: 'Electricity Payment',
                    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
                    textColor: 'text-yellow-600'
                  }))
                ].sort((a, b) => b.date.getTime() - a.date.getTime())
                
                return totalPayments === 0 ? (
                  <p className="text-gray-600 text-center py-8">No payments found</p>
                ) : (
                  <div className="space-y-4">
                    {allPayments.slice(0, 8).map((payment) => (
                      <div key={`${payment.type}-${payment.id}`} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${payment.bgColor}`}>
                        <div>
                          <p className="font-medium">{payment.displayTitle}</p>
                          {payment.type === 'electricity' ? (
                            <>
                              <p className="text-sm text-gray-600">
                                {payment.bill_number || `ELE-${payment.id.slice(-6).toUpperCase()}`} - {formatDate(payment.reading_date)}
                              </p>
                              <p className="text-xs text-gray-500">{payment.units_consumed} units consumed</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-600">{formatDate(payment.payment_date)}</p>
                          )}
                          {payment.marked_paid_by && (
                            <p className="text-xs text-blue-600">
                              {payment.type === 'electricity' ? 'Approved by' : 'Marked by'}: {payment.marked_paid_by}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${payment.textColor}`}>{formatCurrency(payment.amount)}</p>
                          {payment.reference_number && (
                            <p className="text-xs text-gray-500">Ref: {payment.reference_number}</p>
                          )}
                          {payment.marked_paid_date && (
                            <p className="text-xs text-gray-500">Paid: {formatDate(payment.marked_paid_date)}</p>
                          )}
                          {payment.type === 'electricity' && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                              ⚡ Approved
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}