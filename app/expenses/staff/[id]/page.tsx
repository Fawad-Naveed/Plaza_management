"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react"
import type { Staff, StaffSalaryRecord } from "@/lib/database"

export default function StaffDetailPage() {
  const params = useParams()
  const router = useRouter()
  const staffId = params.id as string

  const [staff, setStaff] = useState<Staff | null>(null)
  const [salaryRecords, setSalaryRecords] = useState<(StaffSalaryRecord & { staff: Staff })[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingRecord, setUpdatingRecord] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<StaffSalaryRecord | null>(null)
  const [paymentDetails, setPaymentDetails] = useState({
    payment_date: "",
    payment_method: "cash",
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [staffId])

  const loadData = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      // Get staff details
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .eq("id", staffId)
        .single()

      if (staffError) {
        toast.error(staffError.message)
        setLoading(false)
        return
      }

      if (staffData) {
        setStaff(staffData)
      } else {
        toast.error("Staff member not found")
        setLoading(false)
        return
      }

      // Get salary records
      const { data: records, error: recordsError } = await supabase
        .from("staff_salary_records")
        .select("*")
        .eq("staff_id", staffId)
        .order("year", { ascending: false })
        .order("month", { ascending: false })

      if (recordsError) {
        toast.error(recordsError.message)
      } else {
        // Attach staff data to each record
        const recordsWithStaff = (records || []).map((record) => ({
          ...record,
          staff: staffData,
        }))
        setSalaryRecords(recordsWithStaff)
      }
    } catch (error) {
      toast.error("Failed to load data")
      console.error(error)
    }

    setLoading(false)
  }

  const handleMarkAsPaid = async () => {
    if (!selectedRecord) return

    setUpdatingRecord(selectedRecord.id)

    try {
      const supabase = createClient()
      const updates = {
        status: "paid" as const,
        payment_date: paymentDetails.payment_date || new Date().toISOString().split("T")[0],
        payment_method: paymentDetails.payment_method,
        notes: paymentDetails.notes || undefined,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("staff_salary_records")
        .update(updates)
        .eq("id", selectedRecord.id)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Salary record updated successfully")
        setSelectedRecord(null)
        setPaymentDetails({ payment_date: "", payment_method: "cash", notes: "" })
        loadData()
      }
    } catch (error) {
      toast.error("Failed to update salary record")
      console.error(error)
    }

    setUpdatingRecord(null)
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "security":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "admin":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "terminated":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getSalaryStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getMonthName = (month: number) => {
    const months = [
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
    ]
    return months[month - 1]
  }

  const totalPaid = salaryRecords
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.amount, 0)
  const totalPending = salaryRecords
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0)

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">Staff member not found</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Staff Details</h1>
          <p className="text-muted-foreground mt-1">View and manage staff information</p>
        </div>
      </div>

      {/* Staff Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <div className="flex gap-2">
              <Badge className={getCategoryBadgeColor(staff.category)}>
                {staff.category.charAt(0).toUpperCase() + staff.category.slice(1)}
              </Badge>
              <Badge className={getStatusBadgeColor(staff.status)}>
                {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{staff.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{staff.phone}</p>
                </div>
              </div>
              {staff.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{staff.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">ID Card Number</p>
                  <p className="font-medium">{staff.id_card_number}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Salary</p>
                  <p className="font-medium text-lg">PKR {staff.salary_amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="font-medium">{new Date(staff.hire_date).toLocaleDateString()}</p>
                </div>
              </div>
              {staff.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{staff.address}</p>
                  </div>
                </div>
              )}
              {staff.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium text-sm">{staff.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salaryRecords.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">PKR {totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {salaryRecords.filter((r) => r.status === "paid").length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">PKR {totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {salaryRecords.filter((r) => r.status === "pending").length} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Salary Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {salaryRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No salary records found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {getMonthName(record.month)} {record.year}
                    </TableCell>
                    <TableCell>PKR {record.amount.toLocaleString()}</TableCell>
                    <TableCell>{getSalaryStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      {record.payment_date
                        ? new Date(record.payment_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="capitalize">{record.payment_method || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{record.notes || "-"}</TableCell>
                    <TableCell>
                      {record.status === "pending" && (
                        <Dialog
                          open={selectedRecord?.id === record.id}
                          onOpenChange={(open) => !open && setSelectedRecord(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRecord(record)
                                setPaymentDetails({
                                  payment_date: new Date().toISOString().split("T")[0],
                                  payment_method: "cash",
                                  notes: "",
                                })
                              }}
                            >
                              Mark as Paid
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Mark Salary as Paid</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Recording payment for {getMonthName(record.month)} {record.year}
                                </p>
                                <p className="text-lg font-semibold mt-1">
                                  PKR {record.amount.toLocaleString()}
                                </p>
                              </div>
                              <Separator />
                              <div className="space-y-2">
                                <Label htmlFor="payment_date">Payment Date</Label>
                                <Input
                                  id="payment_date"
                                  type="date"
                                  value={paymentDetails.payment_date}
                                  onChange={(e) =>
                                    setPaymentDetails({ ...paymentDetails, payment_date: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="payment_method">Payment Method</Label>
                                <Select
                                  value={paymentDetails.payment_method}
                                  onValueChange={(value) =>
                                    setPaymentDetails({ ...paymentDetails, payment_method: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Input
                                  id="notes"
                                  placeholder="Add any notes..."
                                  value={paymentDetails.notes}
                                  onChange={(e) =>
                                    setPaymentDetails({ ...paymentDetails, notes: e.target.value })
                                  }
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleMarkAsPaid} disabled={!!updatingRecord}>
                                  {updatingRecord === record.id && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Confirm Payment
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
