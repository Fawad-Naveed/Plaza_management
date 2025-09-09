"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Zap, Calculator, Save, FileText, TrendingUp, Loader2, Eye, Calendar, Plus, Trash2 } from "lucide-react"
import { clientDb, type Business, type MeterReading as DBMeterReading } from "@/lib/database"

interface MeterReadingProps {
  activeSubSection: string
}

export function MeterReading({ activeSubSection }: MeterReadingProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [meterReadings, setMeterReadings] = useState<DBMeterReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [readingSheet, setReadingSheet] = useState({
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().getFullYear().toString(),
    readings: [] as Array<{
      businessId: string
      shopNumber: string
      customerName: string
      previousReading: number
      currentReading: string
      consumption: number
      totalConsumption: number
    }>,
  })

  const [newReading, setNewReading] = useState({
    businessId: "",
    currentReading: "",
    readingDate: new Date().toISOString().split("T")[0],
    rate: "8.5",
  })

  const [monthlyDetailsDialog, setMonthlyDetailsDialog] = useState<{
    show: boolean;
    businessId: string;
    businessName: string;
    monthlyData: Array<{
      month: string;
      year: number;
      consumption: number;
      reading_date: string;
      previous_reading: number;
      current_reading: number;
    }>;
  }>({ show: false, businessId: "", businessName: "", monthlyData: [] })

  useEffect(() => {
    loadMeterData()
  }, [])

  const loadMeterData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [businessesResult, meterReadingsResult] = await Promise.all([
        clientDb.getBusinesses(),
        clientDb.getMeterReadings(),
      ])

      if (businessesResult.error) throw businessesResult.error
      if (meterReadingsResult.error) throw meterReadingsResult.error

      const businessesData = businessesResult.data || []
      const readingsData = meterReadingsResult.data || []

      // Filter businesses for electricity management only
      const electricityBusinesses = businessesData.filter(business => business.electricity_management)
      setBusinesses(electricityBusinesses)
      setMeterReadings(readingsData)

      // Initialize reading sheet with businesses that don't have current month readings
      const currentMonth = new Date().toLocaleString("default", { month: "long" })
      const currentYear = new Date().getFullYear().toString()

      const readingSheetData = electricityBusinesses.map((business) => {
        // Get all readings for this business
        const businessReadings = readingsData.filter(
          (r) => r.business_id === business.id && r.meter_type === "electricity"
        )
        
        // Calculate total cumulative consumption from all readings
        const totalConsumption = businessReadings.reduce((sum, reading) => sum + reading.units_consumed, 0)
        
        // Get the latest reading to show the current meter value as starting point for next reading
        const latestReading = businessReadings
          .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())[0]
        
        // The latest current_reading is what should be used as previous reading for calculations
        const previousMeterReading = latestReading ? latestReading.current_reading : 0

        return {
          businessId: business.id,
          shopNumber: business.shop_number,
          customerName: business.name,
          previousReading: previousMeterReading, // Use latest meter reading as previous
          currentReading: "",
          consumption: 0,
          totalConsumption: totalConsumption, // Store total consumption separately
        }
      })

      setReadingSheet({
        month: currentMonth,
        year: currentYear,
        readings: readingSheetData,
      })
    } catch (err) {
      console.error("[v0] Error loading meter data:", err)
      setError(err instanceof Error ? err.message : "Failed to load meter data")
    } finally {
      setLoading(false)
    }
  }

  const calculateConsumption = (previous: number, current: number) => {
    return current > previous ? current - previous : 0
  }

  const calculateAmount = (consumption: number, rate: number) => {
    return consumption * rate
  }

  const updateReadingSheet = (index: number, currentReading: string) => {
    const updatedReadings = [...readingSheet.readings]
    const current = Number.parseFloat(currentReading) || 0
    const previous = updatedReadings[index].previousReading
    updatedReadings[index] = {
      ...updatedReadings[index],
      currentReading,
      consumption: calculateConsumption(previous, current),
    }
    setReadingSheet({ ...readingSheet, readings: updatedReadings })
  }

  const saveReadingSheet = async () => {
    try {
      const validReadings = readingSheet.readings.filter((reading) => reading.currentReading !== "")

      for (const reading of validReadings) {
        const current = Number.parseFloat(reading.currentReading)
        const consumption = calculateConsumption(reading.previousReading, current)
        const rate = 8.5
        const amount = calculateAmount(consumption, rate)

        await clientDb.createMeterReading({
          business_id: reading.businessId,
          meter_type: "electricity",
          reading_date: new Date().toISOString().split("T")[0],
          previous_reading: reading.previousReading,
          current_reading: current,
          units_consumed: consumption,
          rate_per_unit: rate,
          amount: amount,
        })
      }

      await loadMeterData() // Reload data

      // Reset reading sheet for next month
      setReadingSheet({
        ...readingSheet,
        readings: readingSheet.readings.map((reading) => ({
          ...reading,
          previousReading: Number.parseFloat(reading.currentReading) || reading.previousReading,
          currentReading: "",
          consumption: 0,
        })),
      })
    } catch (err) {
      console.error("[v0] Error saving reading sheet:", err)
      setError(err instanceof Error ? err.message : "Failed to save reading sheet")
    }
  }

  const addIndividualReading = async () => {
    if (newReading.businessId && newReading.currentReading && newReading.readingDate) {
      try {
        // Get the latest reading for this business to calculate previous reading
        const businessReadings = meterReadings
          .filter(r => r.business_id === newReading.businessId && r.meter_type === "electricity")
          .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())
        
        // Use the latest current reading as previous, or 0 if no previous readings
        const previousReading = businessReadings.length > 0 ? businessReadings[0].current_reading : 0
        
        const current = Number.parseFloat(newReading.currentReading)
        const consumption = calculateConsumption(previousReading, current)
        const rate = Number.parseFloat(newReading.rate)
        const amount = calculateAmount(consumption, rate)

        const { error } = await clientDb.createMeterReading({
          business_id: newReading.businessId,
          meter_type: "electricity",
          reading_date: newReading.readingDate,
          previous_reading: previousReading,
          current_reading: current,
          units_consumed: consumption,
          rate_per_unit: rate,
          amount: amount,
        })

        if (error) throw error

        await loadMeterData() // Reload data

        setNewReading({
          businessId: "",
          currentReading: "",
          readingDate: new Date().toISOString().split("T")[0],
          rate: "8.5",
        })
      } catch (err) {
        console.error("[v0] Error adding reading:", err)
        setError(err instanceof Error ? err.message : "Failed to add reading")
      }
    }
  }

  const getSectionTitle = () => {
    switch (activeSubSection) {
      case "meter-reading-sheet":
        return "Reading Sheet"
      case "meter-add-reading":
        return "Reading Sheet"
      default:
        return "Reading Sheet"
    }
  }

  const getBusinessName = (businessId: string) => {
    const business = businesses.find((b) => b.id === businessId)
    return business ? business.name : "Unknown Business"
  }

  const getBusinessShop = (businessId: string) => {
    const business = businesses.find((b) => b.id === businessId)
    return business ? business.shop_number : "Unknown Shop"
  }

  const showMonthlyDetails = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId)
    if (!business) return

    // Get all electricity readings for this business
    const businessReadings = meterReadings
      .filter(r => r.business_id === businessId && r.meter_type === "electricity")
      .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())

    // Group readings by month/year and calculate consumption per month
    const monthlyData = businessReadings.map(reading => {
      const date = new Date(reading.reading_date)
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
      
      return {
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        consumption: reading.units_consumed,
        reading_date: reading.reading_date,
        previous_reading: reading.previous_reading,
        current_reading: reading.current_reading,
      }
    })

    setMonthlyDetailsDialog({
      show: true,
      businessId,
      businessName: business.name,
      monthlyData,
    })
  }

  const deleteMeterReading = async (readingId: string) => {
    try {
      const { error } = await clientDb.deleteMeterReading(readingId)
      if (error) throw error
      
      await loadMeterData() // Reload data after deletion
    } catch (err) {
      console.error("[v0] Error deleting reading:", err)
      setError(err instanceof Error ? err.message : "Failed to delete reading")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading meter reading data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading meter readings: {error}</p>
          <Button onClick={loadMeterData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const renderReadingSheet = () => (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <CardTitle className="text-xl font-bold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Monthly Reading Sheet</h2>
                <p className="text-sm text-gray-600 font-normal">{readingSheet.month} {readingSheet.year}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">
              {readingSheet.readings.length} Businesses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-6 mb-8 p-4 bg-gray-50 rounded-xl border">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Month</Label>
              <Select
                value={readingSheet.month}
                onValueChange={(value) => setReadingSheet({ ...readingSheet, month: value })}
              >
                <SelectTrigger className="w-40 h-11 bg-white border-gray-200 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Year</Label>
              <Select
                value={readingSheet.year}
                onValueChange={(value) => setReadingSheet({ ...readingSheet, year: value })}
              >
                <SelectTrigger className="w-32 h-11 bg-white border-gray-200 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => (
                    <SelectItem key={2020 + i} value={(2020 + i).toString()}>
                      {2020 + i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-900 py-4">Shop No.</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">Customer Name</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">Total Consumption</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">Current Reading</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">Monthly Consumption</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readingSheet.readings.map((reading, index) => (
                  <TableRow key={reading.businessId} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-semibold text-gray-900 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">{reading.shopNumber.replace(/[^0-9]/g, '')}</span>
                        </div>
                        {reading.shopNumber}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <button 
                        onClick={() => showMonthlyDetails(reading.businessId)}
                        className="text-left hover:text-blue-600 hover:underline transition-colors font-medium text-gray-900 flex items-center gap-2"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {reading.customerName}
                      </button>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg w-fit">
                        <div className="p-1 bg-blue-500 rounded">
                          <Zap className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-700">{reading.totalConsumption}</div>
                          <div className="text-xs text-blue-600">units total</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Input
                        type="number"
                        value={reading.currentReading}
                        onChange={(e) => updateReadingSheet(index, e.target.value)}
                        placeholder="Enter reading"
                        className="w-36 h-11 text-center font-medium border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg w-fit">
                        <div className="p-1 bg-yellow-500 rounded">
                          <Zap className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-700">{reading.consumption}</div>
                          <div className="text-xs text-yellow-600">units this month</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg w-fit">
                        <div className="p-1 bg-green-500 rounded">
                          <Calculator className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-700">PKR {calculateAmount(reading.consumption, 8.5).toFixed(2)}</div>
                          <div className="text-xs text-green-600">@ PKR 8.5/unit</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => showMonthlyDetails(reading.businessId)}
                        className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                        title="View Monthly Details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {readingSheet.readings.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No businesses found</h3>
              <p className="text-gray-600 mb-4">Add businesses first to create meter readings.</p>
              <Button variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                <Plus className="h-4 w-4 mr-2" />
                Add Business
              </Button>
            </div>
          )}

          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {readingSheet.readings.reduce((sum, reading) => sum + reading.consumption, 0)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Total Consumption (Units)</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    PKR {readingSheet.readings
                      .reduce((sum, reading) => sum + calculateAmount(reading.consumption, 8.5), 0)
                      .toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Total Amount</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {readingSheet.readings.filter(r => r.currentReading !== "").length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Readings Completed</div>
                </div>
              </div>
              <Button 
                onClick={saveReadingSheet} 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Reading Sheet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAddReading = () => {
    // Get previous reading for selected business
    const getPreviousReading = () => {
      if (!newReading.businessId) return 0
      
      const businessReadings = meterReadings
        .filter(r => r.business_id === newReading.businessId && r.meter_type === "electricity")
        .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())
      
      return businessReadings.length > 0 ? businessReadings[0].current_reading : 0
    }
    
    const previousReading = getPreviousReading()
    const currentReading = Number.parseFloat(newReading.currentReading) || 0
    const consumption = calculateConsumption(previousReading, currentReading)
    
    return (
      <div className="space-y-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Reading</h2>
                <p className="text-sm text-gray-600 font-normal">Record electricity meter reading for a business</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="business" className="text-sm font-semibold text-gray-700">Business *</Label>
                <Select
                  value={newReading.businessId}
                  onValueChange={(value) => setNewReading({ ...newReading, businessId: value })}
                >
                  <SelectTrigger className="h-11 bg-white border-gray-200 shadow-sm">
                    <SelectValue placeholder="Select a business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-700">{business.shop_number.replace(/[^0-9]/g, '')}</span>
                          </div>
                          {business.name} - {business.shop_number}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentReading" className="text-sm font-semibold text-gray-700">Current Reading *</Label>
                <Input
                  id="currentReading"
                  type="number"
                  value={newReading.currentReading}
                  onChange={(e) => setNewReading({ ...newReading, currentReading: e.target.value })}
                  placeholder="Enter current meter reading"
                  className="h-11 text-center font-medium border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="readingDate" className="text-sm font-semibold text-gray-700">Reading Date *</Label>
                <Input
                  id="readingDate"
                  type="date"
                  value={newReading.readingDate}
                  onChange={(e) => setNewReading({ ...newReading, readingDate: e.target.value })}
                  className="h-11 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate" className="text-sm font-semibold text-gray-700">Rate per Unit (PKR) *</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
                  value={newReading.rate}
                  onChange={(e) => setNewReading({ ...newReading, rate: e.target.value })}
                  placeholder="8.5"
                  className="h-11 text-center font-medium border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>
            </div>

            {newReading.businessId && (
              <div className="p-6 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  Reading Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="p-3 bg-blue-100 rounded-lg mb-2">
                      <div className="text-2xl font-bold text-blue-700">{previousReading}</div>
                      <div className="text-xs text-blue-600">Previous Reading</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="p-3 bg-purple-100 rounded-lg mb-2">
                      <div className="text-2xl font-bold text-purple-700">{currentReading}</div>
                      <div className="text-xs text-purple-600">Current Reading</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="p-3 bg-yellow-100 rounded-lg mb-2">
                      <div className="text-2xl font-bold text-yellow-700">{consumption}</div>
                      <div className="text-xs text-yellow-600">Units Consumed</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="p-3 bg-green-100 rounded-lg mb-2">
                      <div className="text-2xl font-bold text-green-700">
                        PKR {calculateAmount(consumption, Number.parseFloat(newReading.rate)).toFixed(2)}
                      </div>
                      <div className="text-xs text-green-600">Total Amount</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={addIndividualReading} 
                disabled={!newReading.businessId || !newReading.currentReading || !newReading.readingDate}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Add Reading
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setNewReading({
                  businessId: "",
                  currentReading: "",
                  readingDate: new Date().toISOString().split("T")[0],
                  rate: "8.5",
                })}
                className="px-6"
              >
                Clear Form
              </Button>
            </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Previous</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Consumption</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meterReadings.slice(-10).map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell className="font-medium">{getBusinessShop(reading.business_id)}</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => showMonthlyDetails(reading.business_id)}
                      className="text-left hover:text-blue-600 hover:underline transition-colors font-medium text-gray-900"
                    >
                      {getBusinessName(reading.business_id)}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {reading.meter_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{reading.reading_date}</TableCell>
                  <TableCell>{reading.previous_reading}</TableCell>
                  <TableCell>{reading.current_reading}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {reading.units_consumed}
                    </div>
                  </TableCell>
                  <TableCell>PKR {reading.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="default">Recorded</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => showMonthlyDetails(reading.business_id)}
                        className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                        title="View Monthly Details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteMeterReading(reading.id)}
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                        title="Delete Reading"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {meterReadings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No meter readings found.</p>
              <p className="text-sm">Add your first meter reading above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
  }

  const renderContent = () => {
    // Always show the simplified reading sheet (formerly add reading)
    return renderAddReading()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black">{getSectionTitle()}</h1>
      {renderContent()}

      {/* Monthly Details Dialog */}
      <Dialog open={monthlyDetailsDialog.show} onOpenChange={(open) => !open && setMonthlyDetailsDialog({ show: false, businessId: "", businessName: "", monthlyData: [] })}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Monthly Consumption Details</h3>
                <p className="text-sm text-gray-600 font-normal">{monthlyDetailsDialog.businessName}</p>
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              View detailed monthly electricity consumption history and trends
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {monthlyDetailsDialog.monthlyData.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500 rounded-xl">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-700">
                          {monthlyDetailsDialog.monthlyData.reduce((sum, data) => sum + data.consumption, 0)}
                        </div>
                        <div className="text-sm text-blue-600 font-medium">Total Consumption (Units)</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-700">
                          {(monthlyDetailsDialog.monthlyData.reduce((sum, data) => sum + data.consumption, 0) / monthlyDetailsDialog.monthlyData.length).toFixed(1)}
                        </div>
                        <div className="text-sm text-green-600 font-medium">Average Monthly (Units)</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500 rounded-xl">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-700">
                          {monthlyDetailsDialog.monthlyData.length}
                        </div>
                        <div className="text-sm text-purple-600 font-medium">Records Count (Months)</div>
                      </div>
                    </div>
                  </Card>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month/Year</TableHead>
                      <TableHead>Reading Date</TableHead>
                      <TableHead>Previous Reading</TableHead>
                      <TableHead>Current Reading</TableHead>
                      <TableHead>Consumption</TableHead>
                      <TableHead>Amount (PKR 8.5/unit)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyDetailsDialog.monthlyData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {data.month} {data.year}
                        </TableCell>
                        <TableCell>{data.reading_date}</TableCell>
                        <TableCell>{data.previous_reading}</TableCell>
                        <TableCell>{data.current_reading}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">{data.consumption}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            PKR {(data.consumption * 8.5).toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No consumption history found for this business.</p>
                <p className="text-sm">Consumption data will appear after meter readings are recorded.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
