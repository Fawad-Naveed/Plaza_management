"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useBreakpoint } from "@/hooks/use-mobile"
import dynamic from "next/dynamic"
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false })
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false })
const Legend = dynamic(() => import("recharts").then(m => m.Legend), { ssr: false })
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false })
import { Users, UserCheck, UserX, Building, Zap, Plus, FileText, CreditCard, Loader2 } from "lucide-react"
import { clientDb, type Business, type Floor, type Bill, type MaintenanceBill, type Advance } from "@/lib/database"
import { RevenueInsights } from "@/components/revenue-insights"

export function Dashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [maintenanceBills, setMaintenanceBills] = useState<MaintenanceBill[]>([])
  const [advances, setAdvances] = useState<Advance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isMobile, isTablet } = useBreakpoint()


  const [showAddFloorDialog, setShowAddFloorDialog] = useState(false)
  const [newFloor, setNewFloor] = useState({
    name: "",
    shops: "",
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [businessesResult, floorsResult, billsResult, maintenanceBillsResult, advancesResult] = await Promise.all([
        clientDb.getBusinesses(),
        clientDb.getFloors(),
        clientDb.getBills(),
        clientDb.getMaintenanceBills(),
        clientDb.getAdvances(),
      ])

      if (businessesResult.error) throw businessesResult.error
      if (floorsResult.error) throw floorsResult.error
      if (billsResult.error) throw billsResult.error
      if (maintenanceBillsResult.error) throw maintenanceBillsResult.error
      if (advancesResult.error) throw advancesResult.error

      setBusinesses(businessesResult.data || [])
      setFloors(floorsResult.data || [])
      setBills(billsResult.data || [])
      setMaintenanceBills(maintenanceBillsResult.data || [])
      setAdvances(advancesResult.data || [])
    } catch (err) {
      console.error("[v0] Error loading dashboard data:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const addFloor = async () => {
    if (newFloor.name && newFloor.shops) {
      try {
        const { data, error } = await clientDb.createFloor({
          floor_number: floors.length + 1,
          floor_name: newFloor.name,
          total_shops: Number.parseInt(newFloor.shops) || 0,
          occupied_shops: 0,
          total_area_sqft: 0,
        })

        if (error) throw error

        if (data) {
          setFloors((prev) => [...prev, data])
        }

        setNewFloor({ name: "", shops: "" })
        setShowAddFloorDialog(false)
      } catch (err) {
        console.error("[v0] Error adding floor:", err)
        setError(err instanceof Error ? err.message : "Failed to add floor")
      }
    }
  }


  const customerStats = (() => {
    // Total customers equals total businesses
    const total = businesses.length

    // Track unique business IDs that have at least one paid bill
    const paidCustomerIds = new Set<string>()
    const unpaidCustomerIds = new Set<string>()

    bills.forEach((bill) => {
      if (bill.status === "paid") {
        paidCustomerIds.add(bill.business_id)
      } else if (bill.status === "pending" || bill.status === "overdue") {
        unpaidCustomerIds.add(bill.business_id)
      }
    })

    return {
      total,
      paid: paidCustomerIds.size,
      unpaid: unpaidCustomerIds.size,
    }
  })()

  // Helper function to abbreviate floor names for mobile
  const abbreviateFloorName = (floorName: string): string => {
    // Split the floor name into words
    const words = floorName.trim().split(/\s+/)
    
    if (words.length >= 2) {
      // Take first letter of first word + first letter of second word
      return (words[0][0] + words[1][0]).toUpperCase()
    } else if (words.length === 1 && words[0].length >= 2) {
      // If single word, take first two letters
      return words[0].substring(0, 2).toUpperCase()
    } else {
      // Fallback for very short single words
      return words[0].toUpperCase()
    }
  }

  const floorData = floors.map((floor) => {
    const floorBusinesses = businesses.filter((b) => b.floor_number === floor.floor_number)
    return {
      floor: floor.floor_name,
      floorAbbr: abbreviateFloorName(floor.floor_name),
      occupied: floorBusinesses.length,
      electricityUsers: floorBusinesses.length, // Assuming all businesses use electricity
      total: floor.total_shops,
    }
  })

  // Data for rent advance chart
  const rentAdvanceData = floors.map((floor) => {
    const floorBusinesses = businesses.filter((b) => b.floor_number === floor.floor_number)
    const businessesWithAdvances = floorBusinesses.filter((business) => 
      advances.some((advance) => 
        advance.business_id === business.id && 
        advance.type === "rent" && 
        advance.status === "active"
      )
    )
    
    return {
      floor: floor.floor_name,
      totalOccupants: floorBusinesses.length,
      withAdvance: businessesWithAdvances.length,
      withoutAdvance: floorBusinesses.length - businessesWithAdvances.length,
    }
  })

  const pieChartData = floorData.map((floor) => {
    const floorBusinesses = businesses.filter(
      (b) => floors.find((f) => f.floor_name === floor.floor)?.floor_number === b.floor_number,
    )
    const floorBills = bills.filter((bill) => floorBusinesses.some((business) => business.id === bill.business_id))

    return {
      name: floor.floor,
      paid: floorBills.filter((bill) => bill.status === "paid").length,
      unpaid: floorBills.filter((bill) => bill.status === "pending" || bill.status === "overdue").length,
    }
  })

  const COLORS = ["#000000", "#666666", "#999999", "#cccccc"]


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <Button onClick={loadDashboardData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'p-4' : 'py-4'}`}>
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`font-medium tracking-tight ${
              isMobile ? 'text-xl' : isTablet ? 'text-xl' : 'text-xl'
            }`}>Dashboard</h1>
            {/* <p className={`text-muted-foreground mt-2 ${
              isMobile ? 'text-sm' : 'text-sm'
            }`}>Plaza Management Overview</p> */}
          </div>
        </div>

      {/* Revenue Insights Section - Main Feature */}
      <RevenueInsights />

        {/* Floor Details Section */}
        <Card className={`bg-card border-0 rounded-4xl overflow-hidden transition-all duration-300 ease-out ${
          isMobile ? 'hover:shadow-xl' : 'hover:scale-[1.02] hover:shadow-2xl'
        }`}>
          <CardHeader className={`border-b border-border ${
            isMobile ? 'px-4 py-4' : 'px-6 py-6'
          }`}>
            <CardTitle className={`font-bold flex items-center gap-3 ${
              isMobile ? 'text-lg' : 'text-xl'
            }`}>
              {/* <Building className={`text-blue-600 ${
                isMobile ? 'h-5 w-5' : 'h-6 w-6'
              }`} /> */}
              Floor wise Occupancy Analysis
            </CardTitle>
            <p className={`text-muted-foreground mt-1 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>Overview of all floors and occupancy</p>
          </CardHeader>
          <CardContent className="p-0">
            {isMobile ? (
              // Mobile card layout
              <div className="space-y-4 p-4">
                {floorData.map((floor, index) => (
                  <div key={floor.floor} className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-base">{floor.floor}</h3>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {floor.occupied}/{floor.total}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Total Shops</span>
                        <p className="font-semibold text-gray-900">{floor.total}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Electricity</span>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          <span className="font-semibold text-gray-900">{floor.electricityUsers}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Occupancy Rate</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0}%` , background:'#22c55e'}}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
                {floors.length === 0 && (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-base font-medium text-gray-600">No floors configured yet</p>
                    <p className="text-xs text-gray-500 mt-1">Floors will appear here once they are added</p>
                  </div>
                )}
              </div>
            ) : (
              // Desktop table layout
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left py-4 px-6 font-semibold text-sm uppercase tracking-wider">Floor</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm uppercase tracking-wider">Total Shops</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm uppercase tracking-wider">Occupied</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm uppercase tracking-wider">Electricity Users</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm uppercase tracking-wider">Occupancy Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {floorData.map((floor, index) => (
                      <tr key={floor.floor} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                        <td className="py-4 px-6 font-semibold">{floor.floor}</td>
                        <td className="py-4 px-6">{floor.total}</td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 font-medium">
                            {floor.occupied}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span>{floor.electricityUsers}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-[60px]">
                              <div 
                                className=" h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0}%` , background:'#22c55e'}}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold min-w-[3rem]">
                              {floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {floors.length === 0 && (
                  <div className="text-center py-12">
                    <Building className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-600">No floors configured yet</p>
                    <p className="text-sm text-gray-500 mt-1">Floors will appear here once they are added to your system</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="mobile-grid gap-4 md:gap-6 rounded-4xl">
          <Card className={`bg-card border-0 rounded-4xl overflow-hidden cursor-pointer transition-all duration-300 ease-out ${
            isMobile ? 'hover:shadow-xl' : 'hover:shadow-2xl hover:scale-105'
          }`}>
            <CardContent className={isMobile ? "p-4" : "p-6"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg transition-transform duration-300 ${
                    isMobile ? 'p-2' : 'p-3 group-hover:scale-110'
                  }`}>
                    <Users className={`text-white ${
                      isMobile ? 'h-5 w-5' : 'h-6 w-6'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-medium text-gray-600 uppercase tracking-wide ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>Total Customers</p>
                    <p className={`font-bold text-gray-900 mt-1 ${
                      isMobile ? 'text-2xl' : 'text-3xl'
                    }`}>{customerStats.total}</p>
                  </div>
                </div>
                {!isMobile && (
                  <div className="h-12 w-1 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full"></div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-card border-0 rounded-4xl overflow-hidden cursor-pointer transition-all duration-300 ease-out ${
            isMobile ? 'hover:shadow-xl' : 'hover:shadow-2xl hover:scale-105'
          }`}>
            <CardContent className={isMobile ? "p-4" : "p-6"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg transition-transform duration-300 ${
                    isMobile ? 'p-2' : 'p-3 group-hover:scale-110'
                  }`}>
                    <UserCheck className={`text-white ${
                      isMobile ? 'h-5 w-5' : 'h-6 w-6'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-medium text-gray-600 uppercase tracking-wide ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>Paid Customers</p>
                    <p className={`font-bold text-green-600 mt-1 ${
                      isMobile ? 'text-2xl' : 'text-3xl'
                    }`}>{customerStats.paid}</p>
                  </div>
                </div>
                {!isMobile && (
                  <div className="h-12 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-card border-0 rounded-4xl overflow-hidden cursor-pointer transition-all duration-300 ease-out ${
            isMobile ? 'hover:shadow-xl' : 'hover:shadow-2xl hover:scale-105'
          }`}>
            <CardContent className={isMobile ? "p-4" : "p-6"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg transition-transform duration-300 ${
                    isMobile ? 'p-2' : 'p-3 group-hover:scale-110'
                  }`}>
                    <UserX className={`text-white ${
                      isMobile ? 'h-5 w-5' : 'h-6 w-6'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-medium text-gray-600 uppercase tracking-wide ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>Unpaid Customers</p>
                    <p className={`font-bold text-red-600 mt-1 ${
                      isMobile ? 'text-2xl' : 'text-3xl'
                    }`}>{customerStats.unpaid}</p>
                  </div>
                </div>
                {!isMobile && (
                  <div className="h-12 w-1 bg-gradient-to-b from-red-400 to-red-600 rounded-full"></div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floor-wise Occupancy Chart */}
        <Card className="bg-card border-0 rounded-4xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <CardHeader className=" py-6">
            <CardTitle className="text-xl font-bold text-card-foreground">Floor Details</CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "py-4" : "p-6"}>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
              <BarChart 
                data={floorData} 
                margin={isMobile 
                  ? { top: 10, right: 20, left: -20, bottom: 40 }
                  : { top: 20, right: 30, left: 20, bottom: 60 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey={isMobile ? "floorAbbr" : "floor"}
                  height={isMobile ? 60 : 80}
                  tick={{ fontSize: isMobile ? 11 : 13, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  angle={0}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 11 : 13, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: isMobile ? '12px' : '14px',
                    padding: '8px 12px'
                  }}
                  cursor={{ fill: 'transparent' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'occupied') return [`Occupied: ${value}`, '']
                    return [value, name]
                  }}
                  labelStyle={{ display: 'none' }}
                />
                <Bar dataKey="occupied" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={isMobile ? 40 : 72} />
                <Bar dataKey="total" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={isMobile ? 40 : 72} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bills Information */}
        <div className={`grid grid-cols-1 gap-4 md:gap-6 ${
          isMobile ? '' : 'lg:grid-cols-2'
        }`}>
          <Card className={`bg-card border-0 rounded-4xl overflow-hidden transition-all duration-300 ease-out ${
            isMobile ? 'hover:shadow-xl' : 'hover:scale-[1.02] hover:shadow-2xl'
          }`}>
            <CardHeader className={`border-b border-border ${
              isMobile ? 'px-4 py-4' : 'px-6 py-6'
            }`}>
              <CardTitle className={`font-bold flex items-center gap-3 ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                {/* <FileText className={`text-green-600 ${
                  isMobile ? 'h-5 w-5' : 'h-6 w-6'
                }`} /> */}
                Rent Management Bills
              </CardTitle>
              <p className={`text-muted-foreground mt-1 ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>Payment status distribution</p>
            </CardHeader>
            <CardContent className={isMobile ? "p-4" : "p-6"}>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 320}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Paid",
                        value: bills.filter((bill) => bill.status === "paid").length,
                        fill: "url(#paidGradient)"
                      },
                      {
                        name: "Unpaid",
                        value: bills.filter((bill) => bill.status !== "paid").length,
                        fill: "url(#unpaidGradient)"
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 60 : 90}
                    dataKey="value"
                    label={isMobile ? false : ({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    <Cell fill="url(#paidGradient)" />
                    <Cell fill="url(#unpaidGradient)" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: isMobile ? '12px' : '14px'
                    }}
                  />
                  {!isMobile && <Legend />}
                  <defs>
                    <linearGradient id="paidGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="unpaidGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                </PieChart>
              </ResponsiveContainer>
              {isMobile && (
                <div className="flex justify-center mt-3 space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-muted-foreground">Paid: {bills.filter((bill) => bill.status === "paid").length}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-xs text-muted-foreground">Unpaid: {bills.filter((bill) => bill.status !== "paid").length}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className={`bg-card border-0 rounded-4xl overflow-hidden transition-all duration-300 ease-out ${
            isMobile ? 'hover:shadow-xl' : 'hover:scale-[1.02] hover:shadow-2xl'
          }`}>
            <CardHeader className={`border-b border-border ${
              isMobile ? 'px-4 py-4' : 'px-6 py-6'
            }`}>
              <CardTitle className={`font-bold flex items-center gap-3 ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                {/* <CreditCard className={`text-purple-600 ${
                  isMobile ? 'h-5 w-5' : 'h-6 w-6'
                }`} /> */}
                Maintenance Management Bills
              </CardTitle>
              <p className={`text-muted-foreground mt-1 ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>Payment status distribution</p>
            </CardHeader>
            <CardContent className={isMobile ? "p-4" : "p-6"}>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 320}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Paid",
                        value: maintenanceBills.filter((bill) => bill.status === "paid").length,
                        fill: "url(#maintenancePaidGradient)"
                      },
                      {
                        name: "Unpaid",
                        value: maintenanceBills.filter((bill) => bill.status !== "paid").length,
                        fill: "url(#maintenanceUnpaidGradient)"
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 60 : 90}
                    dataKey="value"
                    label={isMobile ? false : ({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    <Cell fill="url(#maintenancePaidGradient)" />
                    <Cell fill="url(#maintenanceUnpaidGradient)" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: isMobile ? '12px' : '14px'
                    }}
                  />
                  {!isMobile && <Legend />}
                  <defs>
                    <linearGradient id="maintenancePaidGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="maintenanceUnpaidGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                </PieChart>
              </ResponsiveContainer>
              {isMobile && (
                <div className="flex justify-center mt-3 space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-xs text-muted-foreground">Paid: {maintenanceBills.filter((bill) => bill.status === "paid").length}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-xs text-muted-foreground">Unpaid: {maintenanceBills.filter((bill) => bill.status !== "paid").length}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
