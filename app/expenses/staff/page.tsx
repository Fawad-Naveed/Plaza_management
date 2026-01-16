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
import { StaffForm } from "@/components/expenses/staff-form"
import { getStaff, deleteStaff, generateMonthlySalaries } from "@/lib/expense-actions"
import { toast } from "sonner"
import { Search, Plus, Loader2, Edit, Trash2, Users, DollarSign, Calendar } from "lucide-react"
import type { Staff } from "@/lib/database"
import Link from "next/link"

export default function StaffListPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null)
  const [generatingSalaries, setGeneratingSalaries] = useState(false)

  useEffect(() => {
    loadStaff()
  }, [])

  useEffect(() => {
    filterStaff()
  }, [staff, searchTerm, statusFilter, categoryFilter])

  const loadStaff = async () => {
    setLoading(true)
    const result = await getStaff()

    if (result.success && result.data) {
      setStaff(result.data)
    } else {
      toast.error(result.error || "Failed to load staff")
    }
    setLoading(false)
  }

  const filterStaff = () => {
    let filtered = staff

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((s) => s.category === categoryFilter)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.phone.includes(search) ||
          s.id_card_number.toLowerCase().includes(search),
      )
    }

    setFilteredStaff(filtered)
  }

  const handleDelete = async () => {
    if (!deletingStaff) return

    const result = await deleteStaff(deletingStaff.id)

    if (result.success) {
      toast.success("Staff member deleted successfully")
      loadStaff()
    } else {
      toast.error(result.error || "Failed to delete staff member")
    }

    setDeletingStaff(null)
  }

  const handleGenerateSalaries = async () => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    setGeneratingSalaries(true)

    const result = await generateMonthlySalaries(month, year)

    if (result.success) {
      toast.success(result.message || "Salary records generated successfully")
    } else {
      toast.error(result.error || "Failed to generate salary records")
    }

    setGeneratingSalaries(false)
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

  const activeStaffCount = staff.filter((s) => s.status === "active").length
  const totalSalaries = staff
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.salary_amount, 0)

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-medium">Staff Management</h1>
          <p className="text-md text-muted-foreground mt-1">Manage plaza staff members</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateSalaries} variant="outline" disabled={generatingSalaries}>
            {generatingSalaries && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Calendar className="mr-2 h-4 w-4" />
            Generate Monthly Salaries
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <StaffForm
                onSuccess={() => {
                  setShowAddDialog(false)
                  loadStaff()
                }}
                onCancel={() => setShowAddDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">{activeStaffCount} active</p>
          </CardContent>
        </Card>

        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Salaries</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {totalSalaries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active staff only</p>
          </CardContent>
        </Card>

        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Security:</span>
                <span className="font-medium">
                  {staff.filter((s) => s.category === "security" && s.status === "active").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="font-medium">
                  {staff.filter((s) => s.category === "admin" && s.status === "active").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Maintenance:</span>
                <span className="font-medium">
                  {staff.filter((s) => s.category === "maintenance" && s.status === "active").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 rounded-4xl">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, phone, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card className="rounded-4xl">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "No staff members found matching your filters"
                : "No staff members yet. Add your first staff member to get started."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStaff.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <Badge className={getCategoryBadgeColor(member.category)}>
                        {member.category.charAt(0).toUpperCase() + member.category.slice(1)}
                      </Badge>
                      <Badge className={getStatusBadgeColor(member.status)}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>📞 {member.phone}</div>
                      <div>🆔 {member.id_card_number}</div>
                      <div>💰 PKR {member.salary_amount.toLocaleString()}/month</div>
                    </div>
                    {member.email && <div className="text-sm text-muted-foreground">✉️ {member.email}</div>}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/expenses/staff/${member.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Dialog
                      open={editingStaff?.id === member.id}
                      onOpenChange={(open) => !open && setEditingStaff(null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingStaff(member)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Staff Member</DialogTitle>
                        </DialogHeader>
                        <StaffForm
                          staff={member}
                          onSuccess={() => {
                            setEditingStaff(null)
                            loadStaff()
                          }}
                          onCancel={() => setEditingStaff(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => setDeletingStaff(member)}>
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
      <AlertDialog open={!!deletingStaff} onOpenChange={() => setDeletingStaff(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingStaff?.name}</strong> and all associated salary records.
              This action cannot be undone.
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
    </div>
  )
}
