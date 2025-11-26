"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  AlertTriangle,
  Home,
  Zap,
  Flame,
  Wrench,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react"
import {
  clientDb,
  getWavedOffDebt,
  type Business,
  type Bill,
  type MaintenanceBill,
  type MeterReading,
} from "@/lib/database"

interface WavedOffBill {
  id: string
  billNumber: string
  businessName: string
  shopNumber: string
  amount: number
  billDate: string
  type: "rent" | "electricity" | "gas" | "maintenance" | "meter-reading"
  category?: string
  description?: string
}

export function WaveoffModule() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [totalDebt, setTotalDebt] = useState(0)
  
  // Data states
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [wavedOffBills, setWavedOffBills] = useState<WavedOffBill[]>([])

  useEffect(() => {
    loadWavedOffData()
  }, [])

  const loadWavedOffData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [businessesResult, billsResult, maintenanceBillsResult, meterReadingsResult, debtTotal] = await Promise.all([
        clientDb.getBusinesses(),
        clientDb.getBills(),
        clientDb.getMaintenanceBills(),
        clientDb.getMeterReadings(),
        getWavedOffDebt()
      ])

      if (businessesResult.error) throw businessesResult.error
      if (billsResult.error) throw billsResult.error
      if (maintenanceBillsResult.error) throw maintenanceBillsResult.error
      if (meterReadingsResult.error) throw meterReadingsResult.error

      const businessesData = businessesResult.data || []
      const billsData = billsResult.data || []
      const maintenanceBillsData = maintenanceBillsResult.data || []
      const meterReadingsData = meterReadingsResult.data || []

      setBusinesses(businessesData)
      setTotalDebt(debtTotal)

      // Transform and combine all waved off bills
      const combinedWavedOffBills: WavedOffBill[] = []

      // Regular bills (rent, electricity, gas)
      billsData
        .filter(bill => bill.status === "waveoff")
        .forEach(bill => {
          const business = businessesData.find(b => b.id === bill.business_id)
          
          // Determine bill type based on charges
          let billType: "rent" | "electricity" | "gas" = "rent"
          if (bill.electricity_charges > 0) billType = "electricity"
          if (bill.gas_charges > 0) billType = "gas"

          combinedWavedOffBills.push({
            id: bill.id,
            billNumber: bill.bill_number,
            businessName: business?.name || "Unknown",
            shopNumber: business?.shop_number || "N/A",
            amount: bill.total_amount,
            billDate: bill.bill_date,
            type: billType,
          })
        })

      // Maintenance bills
      maintenanceBillsData
        .filter(bill => bill.status === "waveoff")
        .forEach(bill => {
          const business = businessesData.find(b => b.id === bill.business_id)
          combinedWavedOffBills.push({
            id: bill.id,
            billNumber: bill.bill_number,
            businessName: business?.name || "Unknown",
            shopNumber: business?.shop_number || "N/A",
            amount: bill.amount,
            billDate: bill.bill_date,
            type: "maintenance",
            category: bill.category,
            description: bill.description,
          })
        })

      // Meter readings
      meterReadingsData
        .filter(reading => reading.payment_status === "waveoff")
        .forEach(reading => {
          const business = businessesData.find(b => b.id === reading.business_id)
          combinedWavedOffBills.push({
            id: reading.id,
            billNumber: reading.bill_number || `MR-${reading.id.slice(-6).toUpperCase()}`,
            businessName: business?.name || "Unknown",
            shopNumber: business?.shop_number || "N/A",
            amount: reading.amount,
            billDate: reading.reading_date,
            type: "meter-reading",
            description: `${reading.meter_type} - ${reading.units_consumed} units`,
          })
        })

      // Sort by date (newest first)
      combinedWavedOffBills.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())
      setWavedOffBills(combinedWavedOffBills)

    } catch (err) {
      console.error("Error loading waved off data:", err)
      setError(err instanceof Error ? err.message : "Failed to load waved off bills")
    } finally {
      setLoading(false)
    }
  }

  const filteredBills = wavedOffBills.filter(bill =>
    bill.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.shopNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFilteredBillsByType = (type: string) => {
    if (type === "all") return filteredBills
    return filteredBills.filter(bill => bill.type === type)
  }

  const getBillTypeIcon = (type: string) => {
    switch (type) {
      case "rent": return <Home className="h-4 w-4 text-green-500" />
      case "electricity": return <Zap className="h-4 w-4 text-yellow-500" />
      case "gas": return <Flame className="h-4 w-4 text-orange-500" />
      case "maintenance": return <Wrench className="h-4 w-4 text-purple-500" />
      case "meter-reading": return <FileText className="h-4 w-4 text-blue-500" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getBillTypeBadgeColor = (type: string) => {
    switch (type) {
      case "rent": return "bg-green-100 text-green-700 border-green-300"
      case "electricity": return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "gas": return "bg-orange-100 text-orange-700 border-orange-300"
      case "maintenance": return "bg-purple-100 text-purple-700 border-purple-300"
      case "meter-reading": return "bg-blue-100 text-blue-700 border-blue-300"
      default: return "bg-gray-100 text-gray-700 border-gray-300"
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading waved off bills...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading waved off bills: {error}</p>
          <button 
            onClick={loadWavedOffData}
            className="text-sm text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const rentBills = filteredBills.filter(bill => bill.type === "rent")
  const electricityBills = filteredBills.filter(bill => bill.type === "electricity")
  const gasBills = filteredBills.filter(bill => bill.type === "gas")
  const maintenanceBills = filteredBills.filter(bill => bill.type === "maintenance")
  const meterReadings = filteredBills.filter(bill => bill.type === "meter-reading")

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Wave off Management</h1>
            <p className="text-lg text-muted-foreground mt-2">All waved off bills across all modules</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Debt</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalDebt)}
                  </p>
                  <p className="text-xs text-gray-500">{wavedOffBills.length} bills waved off</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {wavedOffBills.length > 0 
                      ? formatCurrency(totalDebt / wavedOffBills.length)
                      : formatCurrency(0)
                    }
                  </p>
                  <p className="text-xs text-gray-500">Per waved off bill</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {maintenanceBills.length}
                  </p>
                  <p className="text-xs text-gray-500">Waved off bills</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Other Bills</p>
                  <p className="text-2xl font-bold text-green-600">
                    {rentBills.length + electricityBills.length + gasBills.length + meterReadings.length}
                  </p>
                  <p className="text-xs text-gray-500">Rent, utilities, etc.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bills List with Tabs */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Waved Off Bills</CardTitle>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All ({filteredBills.length})</TabsTrigger>
                <TabsTrigger value="rent">Rent ({rentBills.length})</TabsTrigger>
                <TabsTrigger value="electricity">Electricity ({electricityBills.length})</TabsTrigger>
                <TabsTrigger value="gas">Gas ({gasBills.length})</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance ({maintenanceBills.length})</TabsTrigger>
                <TabsTrigger value="meter-reading">Meter ({meterReadings.length})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Bill Number</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredBillsByType(activeTab).map((bill) => (
                      <TableRow key={`${bill.type}-${bill.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getBillTypeIcon(bill.type)}
                            <Badge 
                              variant="outline" 
                              className={`capitalize ${getBillTypeBadgeColor(bill.type)}`}
                            >
                              {bill.type === "meter-reading" ? "Meter" : bill.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{bill.billNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{bill.businessName}</div>
                          </div>
                        </TableCell>
                        <TableCell>{bill.shopNumber}</TableCell>
                        <TableCell className="font-semibold text-red-600">
                          {formatCurrency(bill.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {bill.billDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          {bill.category && (
                            <Badge variant="outline" className="mr-2 capitalize">
                              {bill.category}
                            </Badge>
                          )}
                          {bill.description && (
                            <span className="text-sm text-gray-600">{bill.description}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {getFilteredBillsByType(activeTab).length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No waved off bills found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm 
                        ? "No bills match your search criteria."
                        : `No ${activeTab === "all" ? "" : activeTab} bills have been waved off yet.`
                      }
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}