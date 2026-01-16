"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  History, 
  Loader2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react"
import {
  getActivityLogs,
  getActionTypes,
  getUsernames,
  formatActionType,
  getUserTypeBadgeColor,
  type ActivityLog,
  type ActivityLogFilters
} from "@/lib/activity-logger"
import { format } from "date-fns"

export function ActivityHistory() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<ActivityLogFilters>({
    pageSize: 20
  })
  
  // Filter options
  const [actionTypes, setActionTypes] = useState<string[]>([])
  const [usernames, setUsernames] = useState<string[]>([])
  
  // Detail dialog
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  useEffect(() => {
    loadActivityLogs()
    loadFilterOptions()
  }, [page, filters])

  const loadActivityLogs = async () => {
    try {
      setLoading(true)
      const result = await getActivityLogs({ ...filters, page })
      setLogs(result.logs)
      setTotal(result.total)
    } catch (error) {
      console.error("Failed to load activity logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadFilterOptions = async () => {
    try {
      const [types, users] = await Promise.all([
        getActionTypes(),
        getUsernames()
      ])
      setActionTypes(types)
      setUsernames(users)
    } catch (error) {
      console.error("Failed to load filter options:", error)
    }
  }

  const handleFilterChange = (key: keyof ActivityLogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({ pageSize: 20 })
    setPage(1)
  }

  const totalPages = Math.ceil(total / (filters.pageSize || 20))

  const viewDetails = (log: ActivityLog) => {
    setSelectedLog(log)
    setShowDetailDialog(true)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss')
    } catch {
      return dateString
    }
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            Activity History
          </h1>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <Label htmlFor="startDate" className="py-2">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate" className="py-2">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            {/* Action Type */}
            <div>
              <Label htmlFor="actionType" className="py-2">Action Type</Label>
              <Select
                value={filters.actionType || 'all'}
                onValueChange={(value) => handleFilterChange('actionType', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {formatActionType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username" className="py-2">User</Label>
              <Select
                value={filters.username || 'all'}
                onValueChange={(value) => handleFilterChange('username', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {usernames.map(username => (
                    <SelectItem key={username} value={username}>
                      {username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity Name Search */}
            <div>
              <Label htmlFor="entityName" className="py-2">Business/Entity Name</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="entityName"
                  placeholder="Search..."
                  value={filters.entityName || ''}
                  onChange={(e) => handleFilterChange('entityName', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* User Type */}
            <div>
              <Label htmlFor="userType" className="py-2">User Type</Label>
              <Select
                value={filters.userType || 'all'}
                onValueChange={(value) => handleFilterChange('userType', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Logs ({total} total)</CardTitle>
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No activity logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{log.username}</span>
                            <Badge className={getUserTypeBadgeColor(log.user_type)}>
                              {log.user_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatActionType(log.action_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.entity_name || '-'}
                        </TableCell>
                        <TableCell>
                          {formatAmount(log.amount)}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.description}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Showing {(page - 1) * (filters.pageSize || 20) + 1} to {Math.min(page * (filters.pageSize || 20), total)} of {total} entries
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Detail</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Timestamp</Label>
                  <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">User</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedLog.username}</p>
                    <Badge className={getUserTypeBadgeColor(selectedLog.user_type)}>
                      {selectedLog.user_type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Action Type</Label>
                  <p className="font-medium">{formatActionType(selectedLog.action_type)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Entity Type</Label>
                  <p className="font-medium">{selectedLog.entity_type || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Admin Name</Label>
                  <p className="font-medium">{selectedLog.entity_name || 'N/A'}</p>
                </div>
                {selectedLog.amount && (
                  <div>
                    <Label className="text-gray-600">Amount</Label>
                    <p className="font-medium text-green-600">{formatAmount(selectedLog.amount)}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-gray-600">Description</Label>
                <p className="font-medium mt-1">{selectedLog.description}</p>
              </div>

              {selectedLog.notes && (
                <div>
                  <Label className="text-gray-600">Notes</Label>
                  <p className="mt-1">{selectedLog.notes}</p>
                </div>
              )}

              {selectedLog.old_value && (
                <div>
                  <Label className="text-gray-600">Old Status</Label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                   {Object.entries(selectedLog.old_value)
                  .map(([key, value]) => `${JSON.stringify(value, null,2)}`)
                  .join('\n')}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div>
                  <Label className="text-gray-600">New Status</Label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                   {Object.entries(selectedLog.new_value)
                  .map(([key, value]) => `${JSON.stringify(value, null, 2)}`)
                  .join('\n')}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
