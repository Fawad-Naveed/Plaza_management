"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, TrendingUp, DollarSign, FileText, Zap, Home, Wrench, Flame, AlertTriangle, Filter, Calendar } from "lucide-react"
import dynamic from "next/dynamic"
import { getRevenueByMonth, getRevenueStats, getWavedOffDebt } from "@/lib/database"

// Dynamically import recharts components
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false })
const AreaChart = dynamic(() => import("recharts").then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import("recharts").then(m => m.Area), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false })

interface RevenueData {
  month: string
  shortMonth: string
  fullDate: Date
  revenue: number
  rent: number
  electricity: number
  maintenance: number
  gas: number
  billsGenerated: number
  billCounts: {
    rent: number
    electricity: number
    gas: number
    maintenance: number
  }
}

interface RevenueStats {
  totalRevenue: number
  revenueByComponent: {
    rent: number
    electricity: number
    maintenance: number
    gas: number
  }
  unpaidByComponent: {
    rent: number
    electricity: number
    maintenance: number
    gas: number
  }
  totalBillsGenerated: number
  billCountsByComponent: {
    rent: number
    electricity: number
    gas: number
    maintenance: number
  }
  unpaidBillCountsByComponent: {
    rent: number
    electricity: number
    gas: number
    maintenance: number
  }
}

export function RevenueInsights() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const [totalDebt, setTotalDebt] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year' | 'all' | 'custom'>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  
  // Store the original unfiltered data
  const [unfilteredRevenueData, setUnfilteredRevenueData] = useState<RevenueData[]>([])
  const [unfilteredRevenueStats, setUnfilteredRevenueStats] = useState<RevenueStats | null>(null)
  const [unfilteredTotalDebt, setUnfilteredTotalDebt] = useState<number>(0)
  
  // Get available months from revenue data
  const availableMonths = unfilteredRevenueData.map(data => ({
    value: `${data.fullDate.getFullYear()}-${String(data.fullDate.getMonth() + 1).padStart(2, '0')}`,
    label: data.month
  })).reverse() // Most recent first

  useEffect(() => {
    loadRevenueData()
  }, [])

  const loadRevenueData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [monthlyData, stats, debtData] = await Promise.all([
        getRevenueByMonth(),
        getRevenueStats(),
        getWavedOffDebt()
      ])

      // Store unfiltered data
      setUnfilteredRevenueData(monthlyData)
      setUnfilteredRevenueStats(stats)
      setUnfilteredTotalDebt(debtData)
      
      // Apply current filter
      applyFilter(monthlyData, stats, debtData, timePeriod)
    } catch (err) {
      console.error("Error loading revenue data:", err)
      setError(err instanceof Error ? err.message : "Failed to load revenue data")
    } finally {
      setLoading(false)
    }
  }
  
  const applyFilter = (monthlyData: RevenueData[], stats: RevenueStats, debt: number, period: 'month' | 'quarter' | 'year' | 'all' | 'custom', customMonth?: string) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date | undefined
    
    switch (period) {
      case 'custom':
        if (!customMonth) return
        const [year, month] = customMonth.split('-').map(Number)
        startDate = new Date(year, month - 1, 1)
        endDate = new Date(year, month, 0, 23, 59, 59) // Last day of the month
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterMonth, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'all':
      default:
        setRevenueData(monthlyData)
        setRevenueStats(stats)
        setTotalDebt(debt)
        return
    }
    
    // Filter monthly data
    const filteredMonthlyData = monthlyData.filter(data => {
      const dataDate = new Date(data.fullDate)
      if (endDate) {
        return dataDate >= startDate && dataDate <= endDate
      }
      return dataDate >= startDate
    })
    
    // Calculate filtered stats
    const filteredStats: RevenueStats = {
      totalRevenue: filteredMonthlyData.reduce((sum, data) => sum + data.revenue, 0),
      revenueByComponent: {
        rent: filteredMonthlyData.reduce((sum, data) => sum + data.rent, 0),
        electricity: filteredMonthlyData.reduce((sum, data) => sum + data.electricity, 0),
        maintenance: filteredMonthlyData.reduce((sum, data) => sum + data.maintenance, 0),
        gas: filteredMonthlyData.reduce((sum, data) => sum + data.gas, 0),
      },
      unpaidByComponent: stats.unpaidByComponent, // Always show current unpaid bills regardless of period
      totalBillsGenerated: filteredMonthlyData.reduce((sum, data) => sum + data.billsGenerated, 0),
      billCountsByComponent: {
        rent: filteredMonthlyData.reduce((sum, data) => sum + data.billCounts.rent, 0),
        electricity: filteredMonthlyData.reduce((sum, data) => sum + data.billCounts.electricity, 0),
        gas: filteredMonthlyData.reduce((sum, data) => sum + data.billCounts.gas, 0),
        maintenance: filteredMonthlyData.reduce((sum, data) => sum + data.billCounts.maintenance, 0),
      },
      unpaidBillCountsByComponent: stats.unpaidBillCountsByComponent // Always show current unpaid bill counts
    }
    
    setRevenueData(filteredMonthlyData)
    setRevenueStats(filteredStats)
    setTotalDebt(period === 'all' ? debt : 0) // Only show debt for 'all' period
  }
  
  const handlePeriodChange = (period: 'month' | 'quarter' | 'year' | 'all' | 'custom') => {
    setTimePeriod(period)
    if (period === 'custom') {
      // Don't apply filter yet, wait for month selection
      return
    }
    setSelectedMonth('') // Clear custom month selection
    applyFilter(unfilteredRevenueData, unfilteredRevenueStats!, unfilteredTotalDebt, period)
  }
  
  const handleMonthChange = (monthValue: string) => {
    setSelectedMonth(monthValue)
    setTimePeriod('custom')
    applyFilter(unfilteredRevenueData, unfilteredRevenueStats!, unfilteredTotalDebt, 'custom', monthValue)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-gray-600">
              Total Revenue: <span className="font-semibold text-black">{formatCurrency(data.revenue)}</span>
            </p>
            <p className="text-sm text-gray-600">
              Bills Generated: <span className="font-semibold text-black">{data.billsGenerated}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-gray-600">Loading revenue insights...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading revenue data: {error}</p>
          <button 
            onClick={loadRevenueData}
            className="text-sm text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={timePeriod} onValueChange={(value: any) => handlePeriodChange(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      This Month
                    </div>
                  </SelectItem>
                  <SelectItem value="quarter">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      This Quarter
                    </div>
                  </SelectItem>
                  <SelectItem value="year">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      This Year
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      All Time
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Custom Month
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {timePeriod === 'custom' && (
                <Select value={selectedMonth} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Revenue Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <Card className="border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-black">
                  {formatCurrency(revenueStats?.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rent Revenue Card */}
        <Card className="border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Rent Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(revenueStats?.revenueByComponent.rent || 0)}
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    {revenueStats?.billCountsByComponent?.rent || 0} paid bills
                  </p>
                  {(revenueStats?.unpaidByComponent?.rent || 0) > 0 && (
                    <p className="text-xs text-red-500">
                      {formatCurrency(revenueStats?.unpaidByComponent.rent || 0)} unpaid ({revenueStats?.unpaidBillCountsByComponent?.rent || 0} bills)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Electricity Revenue Card */}
        <Card className="border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Electricity</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(revenueStats?.revenueByComponent.electricity || 0)}
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    {revenueStats?.billCountsByComponent?.electricity || 0} paid bills
                  </p>
                  {(revenueStats?.unpaidByComponent?.electricity || 0) > 0 && (
                    <p className="text-xs text-red-500">
                      {formatCurrency(revenueStats?.unpaidByComponent.electricity || 0)} unpaid
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Revenue Card */}
        <Card className="border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(revenueStats?.revenueByComponent.maintenance || 0)}
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    {revenueStats?.billCountsByComponent?.maintenance || 0} paid bills
                  </p>
                  {(revenueStats?.unpaidByComponent?.maintenance || 0) > 0 && (
                    <p className="text-xs text-red-500">
                      {formatCurrency(revenueStats?.unpaidByComponent.maintenance || 0)} unpaid ({revenueStats?.unpaidBillCountsByComponent?.maintenance || 0} bills)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gas Revenue Card */}
        <Card className="border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-lg">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Gas Revenue</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(revenueStats?.revenueByComponent.gas || 0)}
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    {revenueStats?.billCountsByComponent?.gas || 0} paid bills
                  </p>
                  {(revenueStats?.unpaidByComponent?.gas || 0) > 0 && (
                    <p className="text-xs text-red-500">
                      {formatCurrency(revenueStats?.unpaidByComponent.gas || 0)} unpaid ({revenueStats?.unpaidBillCountsByComponent?.gas || 0} bills)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debt Card - Waved Off Bills */}
        <Card className="border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Debt</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDebt || 0)}
                </p>
                <p className="text-xs text-gray-500">Waved off bills total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Bills Generated */}
        <Card className="border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Bills Generated</p>
                <p className="text-2xl font-bold text-gray-800">
                  {revenueStats?.totalBillsGenerated || 0}
                </p>
                <p className="text-xs text-gray-500">Total bills created</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      <Card className="border-gray-200 hover:scale-[1.01] transition-all duration-300 ease-out hover:shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Insights
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              New Revenue
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `PKR ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
