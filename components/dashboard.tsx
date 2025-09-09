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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
      </div>

      {/* Settings Section */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            Floor Settings
            <Dialog open={showAddFloorDialog} onOpenChange={setShowAddFloorDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Add Floor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Floor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="floorName">Floor Name</Label>
                    <Input
                      id="floorName"
                      value={newFloor.name}
                      onChange={(e) => setNewFloor({ ...newFloor, name: e.target.value })}
                      placeholder="e.g., Fourth Floor, Basement"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfShops">Number of Shops</Label>
                    <Input
                      id="numberOfShops"
                      type="number"
                      value={newFloor.shops}
                      onChange={(e) => setNewFloor({ ...newFloor, shops: e.target.value })}
                      placeholder="Enter number of shops"
                      min="1"
                    />
                  </div>
                  <Button onClick={addFloor} className="w-full bg-black text-white hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Floor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {floors.map((floor) => {
            const floorBusinesses = businesses.filter((b) => b.floor_number === floor.floor_number)
            return (
              <div key={floor.id} className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <Label className="w-24 text-sm font-medium">{floor.floor_name}:</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{floor.total_shops || "0"}</span>
                    <span className="text-sm text-gray-600">total shops</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">{floorBusinesses.length}</span>
                  <span>occupied</span>
                </div>
              </div>
            )
          })}
          {floors.length === 0 && (
            <p className="text-sm text-gray-500">No floors configured yet. Add your first floor above.</p>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-black rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-black">{customerStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Customers</p>
                <p className="text-2xl font-bold text-green-600">{customerStats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600 rounded-lg">
                <UserX className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Unpaid Customers</p>
                <p className="text-2xl font-bold text-red-600">{customerStats.unpaid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floor-wise Occupancy Chart - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Floor-wise Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={floorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="floor" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="occupied" fill="#000000" name="Occupied" />
                <Bar dataKey="total" fill="#cccccc" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bills Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Rent Management Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Paid",
                      value: bills.filter((bill) => bill.status === "paid").length,
                      fill: "#16a34a"
                    },
                    {
                      name: "Unpaid",
                      value: bills.filter((bill) => bill.status !== "paid").length,
                      fill: "#dc2626"
                    }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#16a34a" />
                  <Cell fill="#dc2626" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Maintenance Management Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Paid",
                      value: maintenanceBills.filter((bill) => bill.status === "paid").length,
                      fill: "#16a34a"
                    },
                    {
                      name: "Unpaid",
                      value: maintenanceBills.filter((bill) => bill.status !== "paid").length,
                      fill: "#dc2626"
                    }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#16a34a" />
                  <Cell fill="#dc2626" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rent Advance Payments Chart */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Rent Advance Payments by Floor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rentAdvanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="floor" height={60} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    const labels = {
                      withAdvance: 'With Advance',
                      withoutAdvance: 'Without Advance',
                      totalOccupants: 'Total Occupants'
                    }
                    return [value, labels[name] || name]
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const labels = {
                      withAdvance: 'With Advance',
                      withoutAdvance: 'Without Advance'
                    }
                    return labels[value] || value
                  }}
                />
                <Bar dataKey="withAdvance" fill="#16a34a" name="withAdvance" />
                <Bar dataKey="withoutAdvance" fill="#dc2626" name="withoutAdvance" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Floor Details Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Floor Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold">Floor</th>
                  <th className="text-left p-3 font-semibold">Total Shops</th>
                  <th className="text-left p-3 font-semibold">Occupied</th>
                  <th className="text-left p-3 font-semibold">Electricity Users</th>
                  <th className="text-left p-3 font-semibold">Occupancy Rate</th>
                </tr>
              </thead>
              <tbody>
                {floorData.map((floor) => (
                  <tr key={floor.floor} className="border-b border-gray-100">
                    <td className="p-3 font-medium">{floor.floor}</td>
                    <td className="p-3">{floor.total}</td>
                    <td className="p-3">{floor.occupied}</td>
                    <td className="p-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {floor.electricityUsers}
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-medium">
                        {floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {floorData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No floors configured yet.</p>
                <p className="text-sm">Add floors using the Floor Settings above.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
