"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Download,
  Calendar,
  Users,
  DollarSign,
  Zap,
  Wrench,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  Flame,
  Building,
} from "lucide-react"
import dynamic from "next/dynamic"
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false })
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false })
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false })
const Legend = dynamic(() => import("recharts").then(m => m.Legend), { ssr: false })
import { getBills, getMeterReadings, getBusinesses, getMaintenanceBills } from "@/lib/database"

interface ReportsModuleProps {
  activeSubSection: string
}

interface ReportFilters {
  period: "quarterly" | "semi-annual" | "annual"
  startDate: string
  endDate: string
  businessId?: string
}

export function ReportsModule({ activeSubSection }: ReportsModuleProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    period: "quarterly",
    startDate: "",
    endDate: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [meterReadings, setMeterReadings] = useState<any[]>([])
  const [maintenanceBills, setMaintenanceBills] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    updateDateRange()
  }, [filters.period])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [businessesData, billsData, meterReadingsData, maintenanceBillsData] = await Promise.all([
        getBusinesses(),
        getBills(),
        getMeterReadings(),
        getMaintenanceBills(),
      ])
      
      setBusinesses(businessesData)
      setBills(billsData)
      setMeterReadings(meterReadingsData)
      setMaintenanceBills(maintenanceBillsData)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const updateDateRange = () => {
    const now = new Date()
    let startDate = new Date()
    
    switch (filters.period) {
      case "quarterly":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "semi-annual":
        startDate.setMonth(now.getMonth() - 6)
        break
      case "annual":
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }
    
    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    }))
  }

  const getBusinessName = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId)
    return business ? business.name : "Unknown Business"
  }

  const getBusinessShop = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId)
    return business ? business.shop_number : "Unknown Shop"
  }

  const filterDataByDateRange = (data: any[]) => {
    if (!filters.startDate || !filters.endDate) return data
    
    return data.filter(item => {
      const itemDate = new Date(item.bill_date || item.reading_date || item.created_at)
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  const downloadExcel = async (reportType: string) => {
    try {
      setLoading(true)
      
      // Dynamically import xlsx library
      const XLSX = await import('xlsx')
      
      let data: any[] = []
      let fileName = ""
      
      switch (reportType) {
        case "rent":
          data = filterDataByDateRange(bills.filter(bill => bill.bill_number.startsWith('RENT')))
          data = data.map(bill => ({
            'Business Name': getBusinessName(bill.business_id),
            'Shop Number': getBusinessShop(bill.business_id),
            'Bill Number': bill.bill_number,
            'Bill Date': bill.bill_date,
            'Due Date': bill.due_date,
            'Rent Amount': bill.rent_amount || bill.maintenance_charges,
            'Payment Status': bill.payment_status,
            'Payment Date': bill.payment_date || 'Not Paid',
            'Total Amount': bill.total_amount,
            'Month': bill.month,
            'Year': bill.year
          }))
          fileName = `Rent_History_${filters.period}_${filters.startDate}_to_${filters.endDate}.xlsx`
          break
          
        case "maintenance":
          data = filterDataByDateRange(maintenanceBills)
          data = data.map(bill => ({
            'Business Name': getBusinessName(bill.business_id),
            'Shop Number': getBusinessShop(bill.business_id),
            'Bill Number': bill.bill_number,
            'Bill Date': bill.bill_date,
            'Due Date': bill.due_date,
            'Maintenance Amount': bill.amount,
            'Description': bill.description,
            'Payment Status': bill.payment_status,
            'Payment Date': bill.payment_date || 'Not Paid',
            'Total Amount': bill.total_amount
          }))
          fileName = `Maintenance_History_${filters.period}_${filters.startDate}_to_${filters.endDate}.xlsx`
          break
          
        case "gas":
          data = filterDataByDateRange(meterReadings.filter(reading => reading.meter_type === 'gas'))
          data = data.map(reading => ({
            'Business Name': getBusinessName(reading.business_id),
            'Shop Number': getBusinessShop(reading.business_id),
            'Reading Date': reading.reading_date,
            'Previous Reading': reading.previous_reading,
            'Current Reading': reading.current_reading,
            'Units Consumed': reading.units_consumed,
            'Rate per Unit': reading.rate_per_unit,
            'Amount': reading.amount,
            'Payment Status': reading.payment_status,
            'Payment Date': reading.payment_date || 'Not Paid',
            'Bill Number': reading.bill_number || 'N/A'
          }))
          fileName = `Gas_History_${filters.period}_${filters.startDate}_to_${filters.endDate}.xlsx`
          break
          
        case "electricity":
          data = filterDataByDateRange(meterReadings.filter(reading => reading.meter_type === 'electricity'))
          data = data.map(reading => ({
            'Business Name': getBusinessName(reading.business_id),
            'Shop Number': getBusinessShop(reading.business_id),
            'Reading Date': reading.reading_date,
            'Previous Reading': reading.previous_reading,
            'Current Reading': reading.current_reading,
            'Units Consumed': reading.units_consumed,
            'Rate per Unit': reading.rate_per_unit,
            'Amount': reading.amount,
            'Payment Status': reading.payment_status,
            'Payment Date': reading.payment_date || 'Not Paid',
            'Bill Number': reading.bill_number || 'N/A'
          }))
          fileName = `Electricity_History_${filters.period}_${filters.startDate}_to_${filters.endDate}.xlsx`
          break
      }
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(data)
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, reportType.charAt(0).toUpperCase() + reportType.slice(1))
      
      // Generate and download file
      XLSX.writeFile(workbook, fileName)
      
    } catch (err) {
      console.error("Error downloading Excel:", err)
      setError("Failed to download Excel file")
    } finally {
      setLoading(false)
    }
  }

  const getReportTitle = () => {
    switch (activeSubSection) {
      case "reports-rent":
        return "Rent History Reports"
      case "reports-maintenance":
        return "Maintenance History Reports"
      case "reports-gas":
        return "Gas History Reports"
      case "reports-electricity":
        return "Electricity History Reports"
      default:
        return "Reports"
    }
  }

  const getReportIcon = () => {
    switch (activeSubSection) {
      case "reports-rent":
        return <Building className="h-6 w-6 text-blue-500" />
      case "reports-maintenance":
        return <Wrench className="h-6 w-6 text-orange-500" />
      case "reports-gas":
        return <Flame className="h-6 w-6 text-red-500" />
      case "reports-electricity":
        return <Zap className="h-6 w-6 text-yellow-500" />
      default:
        return <FileText className="h-6 w-6 text-gray-500" />
    }
  }

  const getReportDescription = () => {
    switch (activeSubSection) {
      case "reports-rent":
        return "Download comprehensive rent history reports with payment details, dates, and amounts for each business."
      case "reports-maintenance":
        return "Download detailed maintenance history reports including bill details, descriptions, and payment status."
      case "reports-gas":
        return "Download gas meter reading history reports with consumption details, rates, and payment information."
      case "reports-electricity":
        return "Download electricity meter reading history reports with consumption details, rates, and payment information."
      default:
        return "Generate and download various types of reports."
    }
  }

  const renderFilters = () => (
    <Card className="border-gray-200 mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          Report Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="period">Report Period</Label>
            <Select value={filters.period} onValueChange={(value: "quarterly" | "semi-annual" | "annual") => 
              setFilters(prev => ({ ...prev, period: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                <SelectItem value="semi-annual">Semi-Annual (6 months)</SelectItem>
                <SelectItem value="annual">Annual (12 months)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business">Business (Optional)</Label>
            <Select value={filters.businessId || "all"} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, businessId: value === "all" ? undefined : value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                {businesses.map(business => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name} - {business.shop_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={loadData}>
            <Search className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" onClick={() => {
            setFilters({
              period: "quarterly",
              startDate: "",
              endDate: "",
            })
          }}>
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderDownloadSection = () => (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {getReportIcon()}
          Download {getReportTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">{getReportDescription()}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => downloadExcel(activeSubSection.replace('reports-', ''))}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Generating..." : "Download Excel"}
            </Button>
            
            <div className="text-sm text-gray-600">
              <div className="font-medium">Period: {filters.period.charAt(0).toUpperCase() + filters.period.slice(1)}</div>
              <div>Date Range: {filters.startDate} to {filters.endDate}</div>
            </div>
            
            <div className="text-sm text-gray-600">
              <div className="font-medium">Business Filter:</div>
              <div>{filters.businessId ? getBusinessName(filters.businessId) : "All Businesses"}</div>
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderSummaryStats = () => {
    let data: any[] = []
    let totalAmount = 0
    let totalRecords = 0
    let paidRecords = 0
    
    switch (activeSubSection) {
      case "reports-rent":
        data = filterDataByDateRange(bills.filter(bill => bill.bill_number.startsWith('RENT')))
        totalAmount = data.reduce((sum, bill) => sum + (bill.total_amount || 0), 0)
        totalRecords = data.length
        paidRecords = data.filter(bill => bill.payment_status === 'paid').length
        break
      case "reports-maintenance":
        data = filterDataByDateRange(maintenanceBills)
        totalAmount = data.reduce((sum, bill) => sum + (bill.total_amount || 0), 0)
        totalRecords = data.length
        paidRecords = data.filter(bill => bill.payment_status === 'paid').length
        break
      case "reports-gas":
        data = filterDataByDateRange(meterReadings.filter(reading => reading.meter_type === 'gas'))
        totalAmount = data.reduce((sum, reading) => sum + (reading.amount || 0), 0)
        totalRecords = data.length
        paidRecords = data.filter(reading => reading.payment_status === 'paid').length
        break
      case "reports-electricity":
        data = filterDataByDateRange(meterReadings.filter(reading => reading.meter_type === 'electricity'))
        totalAmount = data.reduce((sum, reading) => sum + (reading.amount || 0), 0)
        totalRecords = data.length
        paidRecords = data.filter(reading => reading.payment_status === 'paid').length
        break
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">Total Records</div>
                <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold text-green-600">PKR {totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-sm text-gray-600">Payment Rate</div>
                <div className="text-2xl font-bold text-purple-600">
                  {totalRecords > 0 ? Math.round((paidRecords / totalRecords) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {getReportIcon()}
        <h1 className="text-2xl font-bold text-black">{getReportTitle()}</h1>
      </div>
      
      {renderFilters()}
      {renderSummaryStats()}
      {renderDownloadSection()}
    </div>
  )
}
