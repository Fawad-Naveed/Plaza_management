"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UtilityBillForm } from "@/components/expenses/utility-bill-form"
import { RecurringExpenseForm } from "@/components/expenses/recurring-expense-form"
import {
  getPlazaUtilityBills,
  deletePlazaUtilityBill,
  updatePlazaUtilityBill,
  getStaffSalaryRecords,
  updateStaffSalaryRecord,
  getFixedExpenseConfigs,
  deleteFixedExpenseConfig,
  generateRecurringBills,
} from "@/lib/expense-actions"
import { toast } from "sonner"
import { Plus, Loader2, Edit, Trash2, DollarSign, Users, CheckCircle, Clock } from "lucide-react"
import type { PlazaUtilityBill, StaffSalaryRecord, FixedExpenseConfig } from "@/lib/database"
import Link from "next/link"

export default function FixedExpensesPage() {
  const [utilityBills, setUtilityBills] = useState<PlazaUtilityBill[]>([])
  const [salaryRecords, setSalaryRecords] = useState<any[]>([])
  const [recurringConfigs, setRecurringConfigs] = useState<FixedExpenseConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showRecurringDialog, setShowRecurringDialog] = useState(false)
  const [editingBill, setEditingBill] = useState<PlazaUtilityBill | null>(null)
  const [editingConfig, setEditingConfig] = useState<FixedExpenseConfig | null>(null)
  const [deletingBill, setDeletingBill] = useState<PlazaUtilityBill | null>(null)
  const [deletingConfig, setDeletingConfig] = useState<FixedExpenseConfig | null>(null)
  const [generatingBills, setGeneratingBills] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    // Load utility bills
    const billsResult = await getPlazaUtilityBills()
    if (billsResult.success && billsResult.data) {
      setUtilityBills(billsResult.data)
    }

    // Load current month salary records
    const now = new Date()
    const salaryResult = await getStaffSalaryRecords(undefined, {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    })
    if (salaryResult.success && salaryResult.data) {
      setSalaryRecords(salaryResult.data)
    }

    // Load recurring expense configs
    const configsResult = await getFixedExpenseConfigs({ status: "active" })
    if (configsResult.success && configsResult.data) {
      setRecurringConfigs(configsResult.data)
    }

    setLoading(false)
  }

  const handleDeleteBill = async () => {
    if (!deletingBill) return

    const result = await deletePlazaUtilityBill(deletingBill.id)

    if (result.success) {
      toast.success("Bill deleted successfully")
      loadData()
    } else {
      toast.error(result.error || "Failed to delete bill")
    }

    setDeletingBill(null)
  }

  const handleDeleteConfig = async () => {
    if (!deletingConfig) return

    const result = await deleteFixedExpenseConfig(deletingConfig.id)

    if (result.success) {
      toast.success("Recurring template deleted successfully")
      loadData()
    } else {
      toast.error(result.error || "Failed to delete template")
    }

    setDeletingConfig(null)
  }

  const handleGenerateRecurringBills = async () => {
    setGeneratingBills(true)
    const result = await generateRecurringBills()

    if (result.success) {
      toast.success(result.message || "Bills generated successfully")
      loadData()
    } else {
      toast.error(result.error || "Failed to generate bills")
    }

    setGeneratingBills(false)
  }

  const handleMarkAsPaid = async (bill: PlazaUtilityBill) => {
    const result = await updatePlazaUtilityBill(bill.id, {
      status: "paid",
      payment_date: new Date().toISOString().split("T")[0],
    })

    if (result.success) {
      toast.success("Bill marked as paid")
      loadData()
    } else {
      toast.error(result.error || "Failed to update bill")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "electricity":
        return <Badge className="bg-yellow-100 text-yellow-800">⚡ Electricity</Badge>
      case "water":
        return <Badge className="bg-blue-100 text-blue-800">💧 Water</Badge>
      case "gas":
        return <Badge className="bg-orange-100 text-orange-800">🔥 Gas</Badge>
      case "property_tax":
        return <Badge className="bg-purple-100 text-purple-800">🏛️ Property Tax</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const totalUtilityBills = utilityBills.reduce((sum, b) => sum + b.amount, 0)
  const pendingUtilityBills = utilityBills.filter((b) => b.status === "pending").reduce((sum, b) => sum + b.amount, 0)
  const totalSalaries = salaryRecords.reduce((sum, r) => sum + r.amount, 0)
  const paidSalaries = salaryRecords.filter((r) => r.status === "paid").length

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-medium">Fixed Expenses</h1>
          <p className="text-md text-muted-foreground mt-1">Manage recurring plaza expenses</p>
        </div>
      </div>

      {/* Stats Card s */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilities</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {totalUtilityBills.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {pendingUtilityBills.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unpaid utilities</p>
          </CardContent>
        </Card>

        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Salaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {totalSalaries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Salaries</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paidSalaries}/{salaryRecords.length}
            </div>
            <p className="text-xs text-muted-foreground">Staff members paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="utilities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="utilities">Utility Bills</TabsTrigger>
          <TabsTrigger value="salaries">Staff Salaries</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Templates</TabsTrigger>
        </TabsList>

        {/* Utility Bills Tab */}
        <TabsContent value="utilities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Utility Bills</h2>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-4xl">
                <DialogHeader>
                  <DialogTitle>Add Utility Bill</DialogTitle>
                </DialogHeader>
                <UtilityBillForm
                  onSuccess={() => {
                    setShowAddDialog(false)
                    loadData()
                  }}
                  onCancel={() => setShowAddDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card className="rounded-4xl">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : utilityBills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No utility bills yet. Add your first bill to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {utilityBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{bill.title}</h3>
                          {getTypeBadge(bill.utility_type)}
                          {getStatusBadge(bill.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div>💰 PKR {bill.amount.toLocaleString()}</div>
                          <div>📅 Due: {new Date(bill.due_date).toLocaleDateString()}</div>
                          {bill.month && <div>📆 {new Date(bill.year, bill.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {bill.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(bill)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Paid
                          </Button>
                        )}
                        <Dialog
                          open={editingBill?.id === bill.id}
                          onOpenChange={(open) => !open && setEditingBill(null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingBill(bill)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Utility Bill</DialogTitle>
                            </DialogHeader>
                            <UtilityBillForm
                              bill={bill}
                              onSuccess={() => {
                                setEditingBill(null)
                                loadData()
                              }}
                              onCancel={() => setEditingBill(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" onClick={() => setDeletingBill(bill)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Salaries Tab */}
        <TabsContent value="salaries" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Current Month Salaries</h2>
            <Link href="/expenses/staff">
              <Button variant="outline">View All Staff</Button>
            </Link>
          </div>

          <Card className="rounded-4xl">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : salaryRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No salary records for this month. Generate salaries from Staff Management.
                </div>
              ) : (
                <div className="space-y-4">
                  {salaryRecords.map((record: any) => (
                    <div
                      key={record.id}
                      className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{record.staff?.name}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          PKR {record.amount.toLocaleString()} • {getStatusBadge(record.status)}
                        </div>
                      </div>
                      {record.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const result = await updateStaffSalaryRecord(record.id, {
                              status: "paid",
                              payment_date: new Date().toISOString().split("T")[0],
                            })
                            if (result.success) {
                              toast.success("Salary marked as paid")
                              loadData()
                            }
                          }}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recurring Templates Tab */}
        <TabsContent value="recurring" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Recurring Expense Templates</h2>
              <p className="text-sm text-muted-foreground">Set up automatic bill generation</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerateRecurringBills} variant="outline" disabled={generatingBills}>
                {generatingBills && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Due Bills
              </Button>
              <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Recurring Expense Template</DialogTitle>
                  </DialogHeader>
                  <RecurringExpenseForm
                    onSuccess={() => {
                      setShowRecurringDialog(false)
                      loadData()
                    }}
                    onCancel={() => setShowRecurringDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="rounded-4xl">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recurringConfigs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recurring templates yet. Create a template to automatically generate bills.
                </div>
              ) : (
                <div className="space-y-4">
                  {recurringConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{config.title}</h3>
                          <Badge variant="outline">{config.frequency.replace("_", " ").toUpperCase()}</Badge>
                          {config.auto_generate && <Badge className="bg-green-100 text-green-800">Auto-Generate</Badge>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div>💰 PKR {config.amount.toLocaleString()}</div>
                          <div>📅 Next: {new Date(config.next_due_date).toLocaleDateString()}</div>
                          {config.reminder_date && (
                            <div>🔔 Reminder: {new Date(config.reminder_date).toLocaleDateString()}</div>
                          )}
                        </div>
                        {config.description && (
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog
                          open={editingConfig?.id === config.id}
                          onOpenChange={(open) => !open && setEditingConfig(null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingConfig(config)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Recurring Template</DialogTitle>
                            </DialogHeader>
                            <RecurringExpenseForm
                              config={config}
                              onSuccess={() => {
                                setEditingConfig(null)
                                loadData()
                              }}
                              onCancel={() => setEditingConfig(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" onClick={() => setDeletingConfig(config)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Bill Confirmation Dialog */}
      <AlertDialog open={!!deletingBill} onOpenChange={() => setDeletingBill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the bill <strong>{deletingBill?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBill} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Config Confirmation Dialog */}
      <AlertDialog open={!!deletingConfig} onOpenChange={() => setDeletingConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the recurring template <strong>{deletingConfig?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfig} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
