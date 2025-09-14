"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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


  const customerStats = {
    total: businesses.length,
    paid: bills.filter((bill) => bill.status === "paid").length,
    unpaid: bills.filter((bill) => bill.status === "pending" || bill.status === "overdue").length,
  }

  const floorData = floors.map((floor) => {
    const floorBusinesses = businesses.filter((b) => b.floor_number === floor.floor_number)
    return {
      floor: floor.floor_name,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-lg text-gray-600 mt-2">Plaza Management Overview</p>
          </div>
        </div>

      {/* Revenue Insights Section - Main Feature */}
      <RevenueInsights />

        {/* Floor Details Section */}
        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 ease-out hover:shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 border-b border-gray-200 px-6 py-6">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Building className="h-6 w-6 text-blue-600" />
              Floor Details
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Overview of all floors and occupancy</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Floor</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Total Shops</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Occupied</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Electricity Users</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Occupancy Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {floorData.map((floor, index) => (
                    <tr key={floor.floor} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="py-4 px-6 font-semibold text-gray-900">{floor.floor}</td>
                      <td className="py-4 px-6 text-gray-700">{floor.total}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {floor.occupied}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="text-gray-700">{floor.electricityUsers}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 min-w-[3rem]">
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
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-out overflow-hidden cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Customers</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{customerStats.total}</p>
                  </div>
                </div>
                <div className="h-12 w-1 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-out overflow-hidden cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Paid Customers</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{customerStats.paid}</p>
                  </div>
                </div>
                <div className="h-12 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-out overflow-hidden cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <UserX className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Unpaid Customers</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{customerStats.unpaid}</p>
                  </div>
                </div>
                <div className="h-12 w-1 bg-gradient-to-b from-red-400 to-red-600 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floor-wise Occupancy Chart */}
        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden hover:scale-[1.01] transition-all duration-300 ease-out hover:shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-gray-200 px-6 py-6">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Building className="h-6 w-6 text-blue-600" />
              Floor-wise Occupancy Analysis
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Visual representation of shop occupancy across floors</p>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={floorData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="floor" 
                  height={60} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="occupied" fill="url(#occupiedGradient)" name="Occupied" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="#e5e7eb" name="Total" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="occupiedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bills Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 ease-out hover:shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-gray-200 px-6 py-6">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-6 w-6 text-green-600" />
                Rent Management Bills
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Payment status distribution</p>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={320}>
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
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
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
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
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
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 ease-out hover:shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-gray-200 px-6 py-6">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-purple-600" />
                Maintenance Management Bills
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Payment status distribution</p>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={320}>
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
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
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
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
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
            </CardContent>
          </Card>
        </div>



      </div>
    </div>
  )
}
