"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Loader2, 
  CheckCircle,
  XCircle,
  Shield
} from "lucide-react"
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  updateAdminPermissions,
  deleteAdmin,
  isAdminUsernameAvailable,
  isAdminEmailAvailable,
  type AdminWithPermissions,
  type CreateAdminData,
  type UpdateAdminData
} from "@/lib/database"
import { hashPassword } from "@/lib/auth"
import { getAuthState } from "@/lib/auth"

// Permission definitions with categories
const PERMISSION_GROUPS = [
  {
    category: "Overview",
    permissions: [
      { key: "dashboard", label: "Dashboard" }
    ]
  },
  {
    category: "Business Operations",
    permissions: [
      { key: "customer", label: "Business Management" }
    ]
  },
  {
    category: "Billing & Payments",
    permissions: [
      { key: "rent-billing", label: "Rent Management" },
      { key: "payments", label: "Payment Management" },
      { key: "electricity", label: "Electricity Management" },
      { key: "gas", label: "Gas Management" },
      { key: "maintenance", label: "Maintenance Management" }
    ]
  },
  {
    category: "Reports & Analytics",
    permissions: [
      { key: "reports", label: "Reports" }
    ]
  },
  {
    category: "Additional Features",
    permissions: [
      { key: "expenses", label: "Expense Tracking" },
      { key: "queries", label: "Query Management" },
      { key: "waveoff", label: "Wave off Management" },
      { key: "tc", label: "Terms & Conditions" },
      { key: "settings", label: "Settings" }
    ]
  }
]

interface AdminFormData {
  username: string
  email: string
  full_name: string
  password: string
  confirm_password: string
  permissions: string[]
}

export function AdminManagement() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [admins, setAdmins] = useState<AdminWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminWithPermissions | null>(null)
  const [formData, setFormData] = useState<AdminFormData>({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirm_password: "",
    permissions: []
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadAdmins()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const data = await getAllAdmins()
      setAdmins(data)
    } catch (err) {
      console.error("Failed to load admins:", err)
      setError("Failed to load admins")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
      permissions: []
    })
    setFieldErrors({})
    setError("")
    setSuccess("")
  }

  const validateField = (name: string, value: string | string[]) => {
    switch (name) {
      case "username":
        if (!value || (typeof value === "string" && !value.trim())) 
          return "Username is required"
        if (typeof value === "string" && value.trim().length < 3) 
          return "Username must be at least 3 characters"
        return ""
      case "email":
        if (!value || (typeof value === "string" && !value.trim())) 
          return "Email is required"
        if (typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) 
          return "Invalid email format"
        return ""
      case "full_name":
        if (!value || (typeof value === "string" && !value.trim())) 
          return "Full name is required"
        return ""
      case "password":
        if (!value || (typeof value === "string" && !value.trim())) 
          return "Password is required"
        if (typeof value === "string" && value.length < 6) 
          return "Password must be at least 6 characters"
        return ""
      case "confirm_password":
        if (typeof value === "string" && value !== formData.password) 
          return "Passwords do not match"
        return ""
      case "permissions":
        if (Array.isArray(value) && value.length === 0) 
          return "At least one permission is required"
        return ""
      default:
        return ""
    }
  }

  const handleFieldChange = (name: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }))
    }
    if (error) setError("")
    if (success) setSuccess("")
  }

  const togglePermission = (permissionKey: string) => {
    const currentPermissions = formData.permissions
    if (currentPermissions.includes(permissionKey)) {
      handleFieldChange("permissions", currentPermissions.filter(p => p !== permissionKey))
    } else {
      handleFieldChange("permissions", [...currentPermissions, permissionKey])
    }
  }

  const toggleAllPermissions = () => {
    const allPermissionKeys = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key))
    if (formData.permissions.length === allPermissionKeys.length) {
      handleFieldChange("permissions", [])
    } else {
      handleFieldChange("permissions", allPermissionKeys)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    Object.keys(formData).forEach(key => {
      // Skip password validation in edit mode
      if (showEditDialog && (key === "password" || key === "confirm_password")) {
        if (formData.password && !formData.confirm_password) {
          errors.confirm_password = "Please confirm password"
        } else if (formData.password) {
          const error = validateField(key, formData[key as keyof AdminFormData])
          if (error) errors[key] = error
        }
      } else {
        const error = validateField(key, formData[key as keyof AdminFormData])
        if (error) errors[key] = error
      }
    })
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddAdmin = async () => {
    if (!validateForm()) {
      setError("Please fix the errors below")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      // Check username availability
      const usernameAvailable = await isAdminUsernameAvailable(formData.username)
      if (!usernameAvailable) {
        setFieldErrors(prev => ({ ...prev, username: "Username already exists" }))
        setError("Username already exists")
        setSubmitting(false)
        return
      }

      // Check email availability
      const emailAvailable = await isAdminEmailAvailable(formData.email)
      if (!emailAvailable) {
        setFieldErrors(prev => ({ ...prev, email: "Email already exists" }))
        setError("Email already exists")
        setSubmitting(false)
        return
      }

      // Hash password
      const password_hash = await hashPassword(formData.password)

      // Get current owner ID
      const authState = getAuthState()
      if (!authState?.userId) {
        setError("Owner ID not found. Please log in again.")
        setSubmitting(false)
        return
      }

      // Create admin
      const adminData: CreateAdminData = {
        username: formData.username,
        password_hash,
        email: formData.email,
        full_name: formData.full_name,
        created_by: authState.userId,
        permissions: formData.permissions
      }

      await createAdmin(adminData)
      
      setSuccess("Admin created successfully!")
      resetForm()
      setShowAddDialog(false)
      await loadAdmins()
    } catch (err: any) {
      console.error("Failed to create admin:", err)
      setError(err.message || "Failed to create admin")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return
    
    // Validate only changed fields
    const errors: Record<string, string> = {}
    if (formData.email !== selectedAdmin.email) {
      const emailError = validateField("email", formData.email)
      if (emailError) errors.email = emailError
    }
    if (formData.full_name !== selectedAdmin.full_name) {
      const nameError = validateField("full_name", formData.full_name)
      if (nameError) errors.full_name = nameError
    }
    if (formData.password) {
      const passError = validateField("password", formData.password)
      if (passError) errors.password = passError
      const confirmError = validateField("confirm_password", formData.confirm_password)
      if (confirmError) errors.confirm_password = confirmError
    }
    const permError = validateField("permissions", formData.permissions)
    if (permError) errors.permissions = permError

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError("Please fix the errors below")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      // Check email availability if changed
      if (formData.email !== selectedAdmin.email) {
        const emailAvailable = await isAdminEmailAvailable(formData.email)
        if (!emailAvailable) {
          setFieldErrors(prev => ({ ...prev, email: "Email already exists" }))
          setError("Email already exists")
          setSubmitting(false)
          return
        }
      }

      // Update admin details
      const updateData: UpdateAdminData = {
        email: formData.email,
        full_name: formData.full_name,
      }

      // Add password if changed
      if (formData.password) {
        updateData.password_hash = await hashPassword(formData.password)
      }

      await updateAdmin(selectedAdmin.id, updateData)
      
      // Update permissions
      await updateAdminPermissions(selectedAdmin.id, formData.permissions)
      
      setSuccess("Admin updated successfully!")
      resetForm()
      setShowEditDialog(false)
      setSelectedAdmin(null)
      await loadAdmins()
    } catch (err: any) {
      console.error("Failed to update admin:", err)
      setError(err.message || "Failed to update admin")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (admin: AdminWithPermissions) => {
    try {
      await updateAdmin(admin.id, { is_active: !admin.is_active })
      setSuccess(`Admin ${admin.is_active ? 'deactivated' : 'activated'} successfully!`)
      await loadAdmins()
    } catch (err: any) {
      console.error("Failed to toggle admin status:", err)
      setError(err.message || "Failed to toggle admin status")
    }
  }

  const handleDeleteAdmin = async (admin: AdminWithPermissions) => {
    if (!confirm(`Are you sure you want to delete admin "${admin.full_name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteAdmin(admin.id)
      setSuccess("Admin deleted successfully!")
      await loadAdmins()
    } catch (err: any) {
      console.error("Failed to delete admin:", err)
      setError(err.message || "Failed to delete admin")
    }
  }

  const openEditDialog = (admin: AdminWithPermissions) => {
    setSelectedAdmin(admin)
    setFormData({
      username: admin.username,
      email: admin.email,
      full_name: admin.full_name,
      password: "",
      confirm_password: "",
      permissions: admin.permissions
    })
    setShowEditDialog(true)
  }

  const renderPermissionCheckboxes = () => {
    const allPermissionKeys = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key))
    const allSelected = formData.permissions.length === allPermissionKeys.length

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={toggleAllPermissions}
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Select All Permissions
          </label>
        </div>

        {PERMISSION_GROUPS.map(group => (
          <div key={group.category}>
            <h4 className="font-medium text-sm mb-2">{group.category}</h4>
            <div className="space-y-2 ml-4">
              {group.permissions.map(permission => (
                <div key={permission.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`perm-${permission.key}`}
                    checked={formData.permissions.includes(permission.key)}
                    onCheckedChange={() => togglePermission(permission.key)}
                  />
                  <label
                    htmlFor={`perm-${permission.key}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {permission.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {fieldErrors.permissions && (
          <p className="text-red-500 text-xs">{fieldErrors.permissions}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 ">
      <div className=" flex flex-row items-center justify-between">
        <div>
          <h1 className={`font-medium tracking-tight ${
            isMobile ? 'text-xl' : isTablet ? 'text-xl' : 'text-xl'
          }`}>Admin Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage admin users with specific permissions
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
      </div>
      <Card className="rounded-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No admins found. Create your first admin user.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map(admin => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.full_name}</TableCell>
                    <TableCell>{admin.username}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions.length > 0 ? (
                          admin.permissions.slice(0, 3).map(perm => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No permissions</span>
                        )}
                        {admin.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{admin.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(admin)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(admin)}
                        >
                          {admin.is_active ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAdmin(admin)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleFieldChange("username", e.target.value)}
                className={fieldErrors.username ? "border-red-500" : ""}
                disabled={submitting}
              />
              {fieldErrors.username && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className={fieldErrors.email ? "border-red-500" : ""}
                disabled={submitting}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="full_name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleFieldChange("full_name", e.target.value)}
                className={fieldErrors.full_name ? "border-red-500" : ""}
                disabled={submitting}
              />
              {fieldErrors.full_name && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                className={fieldErrors.password ? "border-red-500" : ""}
                disabled={submitting}
              />
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirm Password <span className="text-red-500">*</span></Label>
              <Input
                id="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={(e) => handleFieldChange("confirm_password", e.target.value)}
                className={fieldErrors.confirm_password ? "border-red-500" : ""}
                disabled={submitting}
              />
              {fieldErrors.confirm_password && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.confirm_password}</p>
              )}
            </div>

            <div>
              <Label>Permissions <span className="text-red-500">*</span></Label>
              <div className="mt-2 border rounded-md p-4">
                {renderPermissionCheckboxes()}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { resetForm(); setShowAddDialog(false); }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="edit-email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className={fieldErrors.email ? "border-red-500" : ""}
                disabled={submitting}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-full_name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="edit-full_name"
                value={formData.full_name}
                onChange={(e) => handleFieldChange("full_name", e.target.value)}
                className={fieldErrors.full_name ? "border-red-500" : ""}
                disabled={submitting}
              />
              {fieldErrors.full_name && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                className={fieldErrors.password ? "border-red-500" : ""}
                disabled={submitting}
              />
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {formData.password && (
              <div>
                <Label htmlFor="edit-confirm_password">Confirm New Password</Label>
                <Input
                  id="edit-confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => handleFieldChange("confirm_password", e.target.value)}
                  className={fieldErrors.confirm_password ? "border-red-500" : ""}
                  disabled={submitting}
                />
                {fieldErrors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.confirm_password}</p>
                )}
              </div>
            )}

            <div>
              <Label>Permissions <span className="text-red-500">*</span></Label>
              <div className="mt-2 border rounded-md p-4">
                {renderPermissionCheckboxes()}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { resetForm(); setShowEditDialog(false); setSelectedAdmin(null); }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditAdmin} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
