"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, TrendingUp, DollarSign, FileText, Zap, Home, Wrench, Flame, AlertTriangle, Filter, Calendar } from "lucide-react"
import dynamic from "next/dynamic"
import { getRevenueByMonth, getRevenueStats, getWavedOffDebt } from "@/lib/database"
import { useBreakpoint } from "@/hooks/use-mobile"

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
  const { isMobile } = useBreakpoint()
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const [totalDebt, setTotalDebt] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year' | 'all' | 'custom'>('month')
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
        <div className="bg-white p-4 border border-0 rounded-lg shadow-lg">
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
      <div className="rounded-4xl p-6 bg-card border border-border shadow-[0_5px_1.5px_-4px_rgba(8,8,8,0.05)]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
                <span className="font-medium text-[20px]">Overview</span>
              </div>
          <div className="flex items-center gap-3 flex-wrap bg-card">
            <Select value={timePeriod} onValueChange={(value: any) => handlePeriodChange(value)}>
              <SelectTrigger className="w-50 py-6 px-5 rounded-full ">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">
                  <div className="flex items-center gap-2 text-[14px]">
                  {/* <Calendar className="h-4 w-4" /> */}
                    This Month
                  </div>
                </SelectItem>
                <SelectItem value="quarter">
                  <div className="flex items-center gap-2 text-[14px]">
                    {/* <Calendar className="h-4 w-4" /> */}
                    This Quarter
                  </div>
                </SelectItem>
                <SelectItem value="year">
                  <div className="flex items-center gap-2 text-[14px]">
                    {/* <Calendar className="h-4 w-4" /> */}
                    This Year
                  </div>
                </SelectItem>
                <SelectItem value="all">
                  <div className="flex items-center gap-2 text-[14px]">
                    {/* <TrendingUp className="h-4 w-4" /> */}
                    All Time
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2 text-[14px]">
                    {/* <Calendar className="h-4 w-4" /> */}
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
        {/* Revenue Statistics Cards */}
        <div className="flex flex-col gap-2 mt-4 bg-background p-1 rounded-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            {/* Total Revenue Card */}
            <Card className="rounded-[32px] border border-border shadow-[0_5px_1.5px_-4px_rgba(8,8,8,0.05)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-card">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-base font-medium leading-[150%] tracking-[0.024px] text-card-foreground">Total Revenue</p>
                    </div>
                    <p className="text-[14px] font-normal leading-[150%] tracking-[0.035px] text-muted-foreground mt-0.5">
                      {revenueStats?.billCountsByComponent?.rent || 0} paid bills
                    </p>
                    <p className={`font-medium leading-[125%] tracking-[-0.3px] text-card-foreground mt-2 ${
                      isMobile ? 'text-[40px]' : 'text-[60px]'
                    }`}>
                      {(revenueStats?.totalRevenue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rent Revenue Card */}
            <Card className="rounded-[32px] border border-border shadow-[0_5px_1.5px_-4px_rgba(8,8,8,0.05)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-card">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg">
                    <Home className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-base font-medium leading-[150%] tracking-[0.024px] text-card-foreground">Rent Revenue</p>
                      {(revenueStats?.unpaidBillCountsByComponent?.rent || 0) > 0 && (
                        <span className="text-[14px] font-normal text-[#FF6B6B] bg-destructive/10 px-2 py-0.5 rounded-full">
                          {revenueStats?.unpaidBillCountsByComponent?.rent.toString().padStart(2, '0')} unpaid bill
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-normal leading-[150%] tracking-[0.035px] text-muted-foreground mt-0.5">
                      {revenueStats?.billCountsByComponent?.rent || 0} paid bills
                    </p>
                    <p className={`font-medium leading-[125%] tracking-[-0.3px] text-card-foreground mt-2 ${
                      isMobile ? 'text-[40px]' : 'text-[60px]'
                    }`}>
                      {(revenueStats?.revenueByComponent.rent || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Revenue Card */}
            <Card className="rounded-[32px] border border-border shadow-[0_5px_1.5px_-4px_rgba(8,8,8,0.05)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-card">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-base font-medium leading-[150%] tracking-[0.024px] text-card-foreground">Maintenance</p>
                      {(revenueStats?.unpaidBillCountsByComponent?.maintenance || 0) > 0 && (
                        <span className="text-[14px] font-normal text-[#FF6B6B] bg-destructive/10 px-2 py-0.5 rounded-full">
                          {revenueStats?.unpaidBillCountsByComponent?.maintenance.toString().padStart(2, '0')} unpaid bill
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-normal leading-[150%] tracking-[0.035px] text-muted-foreground mt-0.5">
                      0 paid bills
                    </p>
                    <p className={`font-medium leading-[125%] tracking-[-0.3px] text-card-foreground mt-2 ${
                      isMobile ? 'text-[40px]' : 'text-[60px]'
                    }`}>
                      {(revenueStats?.revenueByComponent.maintenance || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
            {/* Electricity Card */}
            <Card className="rounded-[32px] border border-border shadow-[0_5px_1.5px_-4px_rgba(8,8,8,0.05)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-card">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-base font-medium leading-[150%] tracking-[0.024px] text-card-foreground">Electricity</p>
                    </div>
                    <p className="text-[14px] font-normal leading-[150%] tracking-[0.035px] text-muted-foreground mt-0.5">
                      {revenueStats?.billCountsByComponent?.electricity || 0} paid bills
                    </p>
                    <p className={`font-medium leading-[125%] tracking-[-0.3px] text-card-foreground mt-2 ${
                      isMobile ? 'text-[40px]' : 'text-[60px]'
                    }`}>
                      {(revenueStats?.revenueByComponent.electricity || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gas Revenue Card */}
            <Card className="rounded-[32px] border border-border shadow-[0_5px_1.5px_-4px_rgba(8,8,8,0.05)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-card">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg">
                    <Flame className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-base font-medium leading-[150%] tracking-[0.024px] text-card-foreground">Gas Revenue</p>
                      {(revenueStats?.unpaidBillCountsByComponent?.gas || 0) > 0 && (
                        <span className="text-[14px] font-normal text-[#FF6B6B] bg-destructive/10 px-2 py-0.5 rounded-full">
                          {revenueStats?.unpaidBillCountsByComponent?.gas.toString().padStart(2, '0')} unpaid bill
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-normal leading-[150%] tracking-[0.035px] text-muted-foreground mt-0.5">
                      {revenueStats?.billCountsByComponent?.gas || 0} paid bills
                    </p>
                    <p className={`font-medium leading-[125%] tracking-[-0.3px] text-card-foreground mt-2 ${
                      isMobile ? 'text-[40px]' : 'text-[60px]'
                    }`}>
                      {(revenueStats?.revenueByComponent.gas || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Debt Card */}
            <Card className="rounded-[32px] border border-border shadow-[0_5px_1.5px_-4px_rgba(8,8,8,0.05)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-card">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-base font-medium leading-[150%] tracking-[0.024px] text-card-foreground">Debt</p>
                    </div>
                    <p className="text-[14px] font-normal leading-[150%] tracking-[0.035px] text-muted-foreground mt-0.5">
                      Total waved off bills
                    </p>
                    <p className={`font-medium leading-[125%] tracking-[-0.3px] text-card-foreground mt-2 ${
                      isMobile ? 'text-[40px]' : 'text-[60px]'
                    }`}>
                      {(totalDebt || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[32px] border border-border shadow-[0_5px_1.5px_-4px_rgba(8,8,8,0.05)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-card">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-base font-medium leading-[150%] tracking-[0.024px] text-card-foreground">Bills Generated</p>
                    </div>
                    <p className="text-[14px] font-normal leading-[150%] tracking-[0.035px] text-muted-foreground mt-0.5">
                      Total bills created
                    </p>
                    <p className={`font-medium leading-[125%] tracking-[-0.3px] text-card-foreground mt-2 ${
                      isMobile ? 'text-[40px]' : 'text-[60px]'
                    }`}>
                      {(revenueStats?.totalBillsGenerated || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Revenue Trends Chart */}
      <Card className="border-0 hover:scale-[1.01] transition-all duration-300 ease-out hover:shadow-xl rounded-4xl">
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
