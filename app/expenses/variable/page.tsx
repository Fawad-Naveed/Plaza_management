"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { VariableExpenseForm } from "@/components/expenses/variable-expense-form"
import { getVariableExpenses, deleteVariableExpense } from "@/lib/expense-actions"
import { toast } from "sonner"
import { Search, Plus, Loader2, Edit, Trash2, DollarSign, Receipt, Calendar, Image as ImageIcon } from "lucide-react"
import type { VariableExpense } from "@/lib/database"

export default function VariableExpensesPage() {
  const [expenses, setExpenses] = useState<VariableExpense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<VariableExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingExpense, setEditingExpense] = useState<VariableExpense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<VariableExpense | null>(null)
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)

  useEffect(() => {
    loadExpenses()
  }, [])

  useEffect(() => {
    filterExpenses()
  }, [expenses, searchTerm, categoryFilter, startDate, endDate])

  const loadExpenses = async () => {
    setLoading(true)
    const result = await getVariableExpenses()

    if (result.success && result.data) {
      setExpenses(result.data)
    } else {
      toast.error(result.error || "Failed to load expenses")
    }
    setLoading(false)
  }

  const filterExpenses = () => {
    let filtered = expenses

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((e) => e.category === categoryFilter)
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter((e) => e.expense_date >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter((e) => e.expense_date <= endDate)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          e.description?.toLowerCase().includes(search) ||
          e.reference_number?.toLowerCase().includes(search),
      )
    }

    setFilteredExpenses(filtered)
  }

  const handleDelete = async () => {
    if (!deletingExpense) return

    const result = await deleteVariableExpense(deletingExpense.id)

    if (result.success) {
      toast.success("Expense deleted successfully")
      loadExpenses()
    } else {
      toast.error(result.error || "Failed to delete expense")
    }

    setDeletingExpense(null)
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "repairs":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "supplies":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "emergency":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const thisMonthExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.expense_date)
    const now = new Date()
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
  }).reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="container mx-auto py-8 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-medium">Variable Expenses</h1>
          <p className="text-md text-muted-foreground mt-1">Track one-time and irregular expenses</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Variable Expense</DialogTitle>
            </DialogHeader>
            <VariableExpenseForm
              onSuccess={() => {
                setShowAddDialog(false)
                loadExpenses()
              }}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Filtered results</p>
          </CardContent>
        </Card>

        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {thisMonthExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month total</p>
          </CardContent>
        </Card>

        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expense Count</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredExpenses.length}</div>
            <p className="text-xs text-muted-foreground">{expenses.length} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 rounded-4xl">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="repairs">Repairs</SelectItem>
                <SelectItem value="supplies">Supplies</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="misc">Miscellaneous</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start date" />

            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End date" />
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card className="rounded-4xl">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || categoryFilter !== "all" || startDate || endDate
                ? "No expenses found matching your filters"
                : "No expenses yet. Add your first expense to get started."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{expense.title}</h3>
                      <Badge className={getCategoryBadgeColor(expense.category)}>
                        {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                      </Badge>
                      {expense.receipt_image_url && (
                        <Badge variant="outline" className="gap-1">
                          <Receipt className="h-3 w-3" />
                          Receipt
                        </Badge>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground">{expense.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>💰 PKR {expense.amount.toLocaleString()}</div>
                      <div>📅 {new Date(expense.expense_date).toLocaleDateString()}</div>
                      {expense.payment_method && (
                        <div>💳 {expense.payment_method.replace("_", " ").toUpperCase()}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {expense.receipt_image_url && (
                      <Button variant="outline" size="sm" onClick={() => setViewingReceipt(expense.receipt_image_url!)}>
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Dialog
                      open={editingExpense?.id === expense.id}
                      onOpenChange={(open) => !open && setEditingExpense(null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingExpense(expense)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Expense</DialogTitle>
                        </DialogHeader>
                        <VariableExpenseForm
                          expense={expense}
                          onSuccess={() => {
                            setEditingExpense(null)
                            loadExpenses()
                          }}
                          onCancel={() => setEditingExpense(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => setDeletingExpense(expense)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingExpense} onOpenChange={() => setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the expense <strong>{deletingExpense?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receipt Viewer Dialog */}
      <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Receipt Image</DialogTitle>
          </DialogHeader>
          {viewingReceipt && (
            <div className="flex justify-center">
              <img src={viewingReceipt} alt="Receipt" className="max-h-[70vh] rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
