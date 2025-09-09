"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, UserCheck, UserX, Building, Plus, Loader2, Trash2 } from "lucide-react"
import { getOptimizedSupabaseClient } from "@/lib/supabase-optimized"
import { useRenderPerformance, useQueryPerformance } from "@/hooks/use-performance"
import dynamic from "next/dynamic"

// Lazy load chart components
const ChartsSection = dynamic(() => import("./dashboard-charts"), {
  loading: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map(i => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-100 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
  ssr: false
})

// Types
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

interface DashboardStats {
  businesses: Business[]
  floors: Floor[]
  customerStats: {
    total: number
    active: number
    inactive: number
  }
  floorData: Array<{
    floor: string
    occupied: number
    total: number
  }>
}

export function DashboardOptimized() {
  // Performance monitoring
  useRenderPerformance('DashboardOptimized')
  const { measureQuery } = useQueryPerformance()

  // State
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddFloorDialog, setShowAddFloorDialog] = useState(false)
  const [newFloor, setNewFloor] = useState({ name: "", shops: "" })
  const [chartsLoaded, setChartsLoaded] = useState(false)

  // Optimized client
  const client = getOptimizedSupabaseClient()

  // Load essential data only
  const loadEssentialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [businessesResult, floorsResult] = await Promise.all([
        measureQuery('load-businesses', () => 
          client.select<Business>('businesses', {
            columns: 'id, name, floor_number, shop_number, status',
            cacheTTL: 2 * 60 * 1000 // 2 minutes cache
          })
        ),
        measureQuery('load-floors', () =>
          client.select<Floor>('floors', {
            columns: 'id, floor_name, floor_number, total_shops, occupied_shops',
            cacheTTL: 5 * 60 * 1000 // 5 minutes cache
          })
        )
      ])

      if (businessesResult.error) throw businessesResult.error
      if (floorsResult.error) throw floorsResult.error

      const businesses = businessesResult.data || []
      const floors = floorsResult.data || []

      // Calculate stats efficiently
      const customerStats = {
        total: businesses.length,
        active: businesses.filter(b => b.status === 'active').length,
        inactive: businesses.filter(b => b.status !== 'active').length
      }

      const floorData = floors.map(floor => {
        const floorBusinesses = businesses.filter(b => b.floor_number === floor.floor_number)
        return {
          floor: floor.floor_name,
          occupied: floorBusinesses.length,
          total: floor.total_shops
        }
      })

      setDashboardData({
        businesses,
        floors,
        customerStats,
        floorData
      })

    } catch (err) {
      console.error("Error loading dashboard data:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [client, measureQuery])

  // Load charts data lazily after main content
  useEffect(() => {
    if (dashboardData && !chartsLoaded) {
      // Load charts after a short delay to prioritize main content
      const timer = setTimeout(() => {
        setChartsLoaded(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [dashboardData, chartsLoaded])

  // Initial data load
  useEffect(() => {
    loadEssentialData()
  }, [loadEssentialData])

  // Memoized calculations
  const summaryStats = useMemo(() => {
    if (!dashboardData) return null

    const { customerStats, floorData } = dashboardData
    const totalOccupied = floorData.reduce((sum, floor) => sum + floor.occupied, 0)
    const totalAvailable = floorData.reduce((sum, floor) => sum + floor.total, 0)

    return [
      {
        title: "Total Businesses",
        value: customerStats.total,
        icon: Users,
        color: "text-blue-600"
      },
      {
        title: "Active Businesses", 
        value: customerStats.active,
        icon: UserCheck,
        color: "text-green-600"
      },
      {
        title: "Inactive Businesses",
        value: customerStats.inactive,
        icon: UserX,
        color: "text-red-600"
      },
      {
        title: "Occupied Shops",
        value: totalOccupied,
        icon: Building,
        color: "text-purple-600"
      }
    ]
  }, [dashboardData])

  // Add floor handler
  const addFloor = useCallback(async () => {
    if (!newFloor.name || !newFloor.shops) return

    try {
      const { data, error } = await measureQuery('add-floor', () =>
        client.raw.from('floors').insert({
          floor_number: (dashboardData?.floors.length || 0) + 1,
          floor_name: newFloor.name,
          total_shops: parseInt(newFloor.shops) || 0,
          occupied_shops: 0,
        }).select().single()
      )

      if (error) throw error

      if (data && dashboardData) {
        setDashboardData(prev => ({
          ...prev!,
          floors: [...prev!.floors, data as Floor]
        }))
      }

      setNewFloor({ name: "", shops: "" })
      setShowAddFloorDialog(false)
      
      // Clear cache to ensure fresh data on next load
      client.clearCache()
      
    } catch (err) {
      console.error("Error adding floor:", err)
      setError(err instanceof Error ? err.message : "Failed to add floor")
    }
  }, [newFloor, dashboardData, client, measureQuery])

  // Delete floor handler
  const handleDeleteFloor = useCallback(async (floorId: string, floorName: string) => {
    if (!confirm(`Are you sure you want to delete "${floorName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await measureQuery('delete-floor', () =>
        client.raw.from('floors').delete().eq('id', floorId)
      )

      if (error) throw error

      setDashboardData(prev => ({
        ...prev!,
        floors: prev!.floors.filter(floor => floor.id !== floorId)
      }))

      // Clear cache
      client.clearCache()

    } catch (err) {
      console.error("Error deleting floor:", err)
      setError(err instanceof Error ? err.message : "Failed to delete floor")
    }
  }, [client, measureQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={loadEssentialData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  return (
    <div className="space-y-6">
      {/* Quick Stats - Load First */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats?.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Floor Management - Essential UI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Floor Management</CardTitle>
          <Dialog open={showAddFloorDialog} onOpenChange={setShowAddFloorDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Floor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Floor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="floor-name">Floor Name</Label>
                  <Input
                    id="floor-name"
                    value={newFloor.name}
                    onChange={(e) => setNewFloor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter floor name"
                  />
                </div>
                <div>
                  <Label htmlFor="total-shops">Total Shops</Label>
                  <Input
                    id="total-shops"
                    type="number"
                    value={newFloor.shops}
                    onChange={(e) => setNewFloor(prev => ({ ...prev, shops: e.target.value }))}
                    placeholder="Enter number of shops"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addFloor} className="flex-1">
                    Add Floor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddFloorDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {dashboardData.floors.map((floor) => {
              const occupied = dashboardData.floorData.find(f => f.floor === floor.floor_name)?.occupied || 0
              const occupancyRate = floor.total_shops > 0 ? (occupied / floor.total_shops * 100).toFixed(1) : 0

              return (
                <div
                  key={floor.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{floor.floor_name}</h3>
                    <p className="text-sm text-gray-600">
                      {occupied} / {floor.total_shops} occupied ({occupancyRate}%)
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFloor(floor.id, floor.floor_name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts - Load After Essential Content */}
      {chartsLoaded && dashboardData && (
        <ChartsSection 
          floorData={dashboardData.floorData}
          businesses={dashboardData.businesses}
          floors={dashboardData.floors}
        />
      )}
    </div>
  )
}
