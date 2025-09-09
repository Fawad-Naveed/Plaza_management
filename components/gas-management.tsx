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
import { Flame, Calculator, Save, FileText, TrendingUp, Loader2, Eye, Calendar, Plus, Trash2 } from "lucide-react"
import { clientDb, type Business, type MeterReading as DBMeterReading } from "@/lib/database"

interface GasManagementProps {
  activeSubSection: string
}

export function GasManagement({ activeSubSection }: GasManagementProps) {
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
    rate: "150.0",
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

      setBusinesses(businessesData)
      setMeterReadings(readingsData)

      // Filter businesses for gas management only
      const gasBusinesses = businessesData.filter(business => business.gas_management)
      setBusinesses(gasBusinesses)

      // Initialize reading sheet with businesses that don't have current month readings
      const currentMonth = new Date().toLocaleString("default", { month: "long" })
      const currentYear = new Date().getFullYear().toString()

      const readingSheetData = gasBusinesses.map((business) => {
        // Get all readings for this business
        const businessReadings = readingsData.filter(
          (r) => r.business_id === business.id && r.meter_type === "gas"
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
      console.error("[v0] Error loading gas meter data:", err)
      setError(err instanceof Error ? err.message : "Failed to load gas meter data")
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
        const rate = 150.0
        const amount = calculateAmount(consumption, rate)

        await clientDb.createMeterReading({
          business_id: reading.businessId,
          meter_type: "gas",
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
      console.error("[v0] Error saving gas reading sheet:", err)
      setError(err instanceof Error ? err.message : "Failed to save gas reading sheet")
    }
  }

  const addIndividualReading = async () => {
    // Clear any previous errors
    setError(null)
    
    // Validate required fields
    if (!newReading.businessId) {
      setError("Please select a business")
      return
    }
    
    if (!newReading.currentReading) {
      setError("Please enter the current reading")
      return
    }
    
    if (!newReading.readingDate) {
      setError("Please select a reading date")
      return
    }
    
    // Validate numeric values
    const currentReading = Number.parseFloat(newReading.currentReading)
    if (isNaN(currentReading) || currentReading < 0) {
      setError("Current reading must be a valid positive number")
      return
    }
    
    const rate = Number.parseFloat(newReading.rate)
    if (isNaN(rate) || rate < 0) {
      setError("Rate must be a valid positive number")
      return
    }
    
    // Validate business exists
    const business = businesses.find(b => b.id === newReading.businessId)
    if (!business) {
      setError("Selected business not found")
      return
    }

    try {
      // Get the latest reading for this business to calculate previous reading
      const businessReadings = meterReadings
        .filter(r => r.business_id === newReading.businessId && r.meter_type === "gas")
        .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())
      
      // Use the latest current reading as previous, or 0 if no previous readings
      const previousReading = businessReadings.length > 0 ? businessReadings[0].current_reading : 0
      
      const consumption = calculateConsumption(previousReading, currentReading)
      const amount = calculateAmount(consumption, rate)

      const meterReadingData = {
        business_id: newReading.businessId,
        meter_type: "gas" as const,
        reading_date: newReading.readingDate,
        previous_reading: previousReading,
        current_reading: currentReading,
        units_consumed: consumption,
        rate_per_unit: rate,
        amount: amount,
      }

      console.log("Creating gas meter reading with data:", meterReadingData)

      const result = await clientDb.createMeterReading(meterReadingData)

      console.log("Database result:", result)

      if (result.error) {
        console.error("Database error:", result.error)
        throw new Error(`Database error: ${result.error.message || result.error}`)
      }

      if (!result.data) {
        throw new Error("No data returned from database operation")
      }

      console.log("Successfully created gas meter reading:", result.data)

      await loadMeterData() // Reload data

      setNewReading({
        businessId: "",
        currentReading: "",
        readingDate: new Date().toISOString().split("T")[0],
        rate: "150.0",
      })
      
      // Show success message (you can add a toast notification here)
      console.log("Gas meter reading added successfully!")
      
    } catch (err) {
      console.error("[v0] Error adding gas reading:", err)
      console.error("Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      })
      setError(err instanceof Error ? err.message : "Failed to add gas reading")
    }
  }

  const getSectionTitle = () => {
    switch (activeSubSection) {
      case "gas-reading-sheet":
        return "Gas Reading Sheet"
      case "gas-add-reading":
        return "Gas Reading Sheet"
      default:
        return "Gas Reading Sheet"
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

    // Get all gas readings for this business
    const businessReadings = meterReadings
      .filter(r => r.business_id === businessId && r.meter_type === "gas")
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
      console.error("[v0] Error deleting gas reading:", err)
      setError(err instanceof Error ? err.message : "Failed to delete gas reading")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading gas meter data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error: {error}</div>
          <Button onClick={loadMeterData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getSectionTitle()}</h1>
          <p className="text-muted-foreground">
            Manage gas meter readings and consumption tracking
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Reading Sheet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Gas Reading Sheet - {readingSheet.month} {readingSheet.year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Select
                    value={readingSheet.month}
                    onValueChange={(value) =>
                      setReadingSheet({ ...readingSheet, month: value })
                    }
                  >
                    <SelectTrigger className="w-32">
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
                  <Select
                    value={readingSheet.year}
                    onValueChange={(value) =>
                      setReadingSheet({ ...readingSheet, year: value })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={saveReadingSheet} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save All Readings
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Previous Reading</TableHead>
                      <TableHead>Current Reading</TableHead>
                      <TableHead>Consumption</TableHead>
                      <TableHead>Total Consumption</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readingSheet.readings.map((reading, index) => (
                      <TableRow key={reading.businessId}>
                        <TableCell className="font-medium">
                          {reading.shopNumber}
                        </TableCell>
                        <TableCell>{reading.customerName}</TableCell>
                        <TableCell>{reading.previousReading}</TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={reading.currentReading}
                            onChange={(e) => updateReadingSheet(index, e.target.value)}
                            placeholder="Enter reading"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {reading.consumption} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {reading.totalConsumption} units
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Reading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Individual Gas Reading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business">Business</Label>
                <Select
                  value={newReading.businessId}
                  onValueChange={(value) =>
                    setNewReading({ ...newReading, businessId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.shop_number} - {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentReading">Current Reading</Label>
                <Input
                  id="currentReading"
                  type="text"
                  value={newReading.currentReading}
                  onChange={(e) =>
                    setNewReading({ ...newReading, currentReading: e.target.value })
                  }
                  placeholder="Enter reading"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="readingDate">Reading Date</Label>
                <Input
                  id="readingDate"
                  type="date"
                  value={newReading.readingDate}
                  onChange={(e) =>
                    setNewReading({ ...newReading, readingDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Rate per Unit (PKR)</Label>
                <Input
                  id="rate"
                  type="text"
                  step="0.1"
                  value={newReading.rate}
                  onChange={(e) =>
                    setNewReading({ ...newReading, rate: e.target.value })
                  }
                  placeholder="150.0"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={addIndividualReading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Add Reading
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* All Readings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Gas Readings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Consumption</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meterReadings
                    .filter((reading) => reading.meter_type === "gas")
                    .map((reading) => (
                      <TableRow key={reading.id}>
                        <TableCell>
                          {new Date(reading.reading_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getBusinessName(reading.business_id)}</TableCell>
                        <TableCell>{getBusinessShop(reading.business_id)}</TableCell>
                        <TableCell>{reading.previous_reading}</TableCell>
                        <TableCell>{reading.current_reading}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {reading.units_consumed} units
                          </Badge>
                        </TableCell>
                        <TableCell>PKR {reading.rate_per_unit}</TableCell>
                        <TableCell>PKR {reading.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => showMonthlyDetails(reading.business_id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMeterReading(reading.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Details Dialog */}
      <Dialog
        open={monthlyDetailsDialog.show}
        onOpenChange={(open) =>
          setMonthlyDetailsDialog({ ...monthlyDetailsDialog, show: open })
        }
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Gas Consumption History - {monthlyDetailsDialog.businessName}
            </DialogTitle>
            <DialogDescription>
              Monthly gas consumption breakdown for this business
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month/Year</TableHead>
                  <TableHead>Reading Date</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Consumption</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyDetailsDialog.monthlyData.map((data, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {data.month} {data.year}
                    </TableCell>
                    <TableCell>
                      {new Date(data.reading_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{data.previous_reading}</TableCell>
                    <TableCell>{data.current_reading}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {data.consumption} units
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
