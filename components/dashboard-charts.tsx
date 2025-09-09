"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"

// Dynamically import chart components
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false })
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false })
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false })

interface Business {
  id: string
  name: string
  floor_number: number
  shop_number: string
  status: string
}

interface Floor {
  id: string
  floor_name: string
  floor_number: number
  total_shops: number
  occupied_shops: number
}

interface FloorData {
  floor: string
  occupied: number
  total: number
}

interface ChartsSectionProps {
  floorData: FloorData[]
  businesses: Business[]
  floors: Floor[]
}

const COLORS = ["#000000", "#666666", "#999999", "#cccccc"]

export default function ChartsSection({ floorData, businesses, floors }: ChartsSectionProps) {
  // Calculate occupancy data for charts
  const occupancyData = floorData.map(floor => ({
    floor: floor.floor,
    occupied: floor.occupied,
    available: floor.total - floor.occupied,
    occupancyRate: floor.total > 0 ? ((floor.occupied / floor.total) * 100).toFixed(1) : 0
  }))

  // Calculate status distribution for pie chart
  const statusData = [
    {
      name: "Active",
      value: businesses.filter(b => b.status === 'active').length,
      fill: "#000000"
    },
    {
      name: "Inactive", 
      value: businesses.filter(b => b.status !== 'active').length,
      fill: "#666666"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Floor Occupancy Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Floor Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="floor" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  value, 
                  name === 'occupied' ? 'Occupied' : 'Available'
                ]}
              />
              <Bar dataKey="occupied" stackId="a" fill="#000000" />
              <Bar dataKey="available" stackId="a" fill="#cccccc" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Business Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Business Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  `${name}: ${value} (${(percent || 0).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Occupancy Rate Summary */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Occupancy Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {occupancyData.map((floor, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm">{floor.floor}</h4>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{floor.occupancyRate}%</div>
                  <div className="text-sm text-gray-600">
                    {floor.occupied} of {floor.occupied + floor.available} occupied
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-black h-2 rounded-full" 
                    style={{ width: `${floor.occupancyRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
