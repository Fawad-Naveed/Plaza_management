"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  HelpCircle, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  Plus,
  User,
  Calendar,
  Building,
  Wrench,
  Zap,
  Home,
  MessageCircle,
  Eye,
  Edit,
  Trash2,
  Loader2
} from "lucide-react"
import { clientDb, type Query, type Business } from "@/lib/database"

// Extended query interface with business information
interface QueryWithBusiness extends Query {
  business?: Business
}

interface AdminQueriesProps {
  activeSubSection: string
}

export function AdminQueries({ activeSubSection }: AdminQueriesProps) {
  const [queries, setQueries] = useState<QueryWithBusiness[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedQuery, setSelectedQuery] = useState<QueryWithBusiness | null>(null)
  const [responseMessage, setResponseMessage] = useState("")
  const [error, setError] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    loadQueries()
  }, [])

  const loadQueries = async () => {
    setLoading(true)
    setError('')
    try {
      // Get all queries (admin can see all)
      const queriesResult = await clientDb.getQueries()
      if (queriesResult.error) {
        console.error('Error loading queries:', queriesResult.error)
        setError('Failed to load queries')
        return
      }

      // Get all businesses to match with queries
      const businessesResult = await clientDb.getBusinesses()
      if (businessesResult.error) {
        console.error('Error loading businesses:', businessesResult.error)
        setError('Failed to load business information')
        return
      }

      // Combine queries with business information
      const queriesWithBusiness: QueryWithBusiness[] = (queriesResult.data || []).map(query => ({
        ...query,
        business: (businessesResult.data || []).find(b => b.id === query.business_id)
      }))

      setQueries(queriesWithBusiness)
      
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load queries')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "maintenance": return <Wrench className="h-4 w-4" />
      case "billing": return <Zap className="h-4 w-4" />
      case "facility": return <Building className="h-4 w-4" />
      case "complaint": return <AlertCircle className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string, queryId?: string) => {
    const statusConfig = {
      "open": { color: "bg-red-100 text-red-800", icon: <AlertCircle className="h-3 w-3" /> },
      "in-progress": { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
      "resolved": { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
      "closed": { color: "bg-gray-100 text-gray-800", icon: <CheckCircle className="h-3 w-3" /> }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    
    if (!queryId) {
      // Non-clickable version (for stats cards)
      return (
        <Badge className={`${config.color} flex items-center gap-1`}>
          {config.icon}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    }
    
    // Clickable version with dropdown for admins
    return (
      <Select 
        value={status} 
        onValueChange={(newStatus) => handleStatusUpdate(queryId, newStatus)}
        disabled={updatingStatus === queryId}
      >
        <SelectTrigger className={`w-auto h-auto p-0 border-0 ${config.color}`}>
          <Badge className={`${config.color} flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity`}>
            {updatingStatus === queryId ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              config.icon
            )}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      "low": "bg-blue-100 text-blue-800",
      "medium": "bg-orange-100 text-orange-800", 
      "high": "bg-red-100 text-red-800",
      "urgent": "bg-purple-100 text-purple-800"
    }
    
    return (
      <Badge className={priorityColors[priority as keyof typeof priorityColors] || priorityColors.low}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const filteredQueries = queries.filter(query => {
    const matchesSearch = 
      query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (query.business?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (query.business?.shop_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || query.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || query.status === selectedStatus
    const matchesPriority = selectedPriority === "all" || query.priority === selectedPriority

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority
  })

  const getFilteredQueriesByStatus = (status: string) => {
    return queries.filter(query => query.status === status)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleStatusUpdate = async (queryId: string, newStatus: string) => {
    setUpdatingStatus(queryId)
    setError('')
    try {
      const result = await clientDb.updateQuery(queryId, { 
        status: newStatus as Query['status']
      })
      
      if (result.error) {
        console.error('Error updating query status:', result.error)
        setError('Failed to update query status')
        return
      }

      // Update local state
      setQueries(prev => prev.map(query => 
        query.id === queryId 
          ? { ...query, status: newStatus as Query['status'], updated_at: result.data!.updated_at }
          : query
      ))
    } catch (error) {
      console.error('Error updating query status:', error)
      setError('Failed to update query status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleResponseSubmit = async (queryId: string) => {
    if (!responseMessage.trim()) return

    try {
      const result = await clientDb.updateQuery(queryId, { 
        admin_response: responseMessage,
        admin_response_date: new Date().toISOString(),
        status: "in-progress" as Query['status']
      })
      
      if (result.error) {
        console.error('Error submitting response:', result.error)
        setError('Failed to submit response')
        return
      }

      // Update local state
      setQueries(prev => prev.map(query => 
        query.id === queryId 
          ? { 
              ...query, 
              admin_response: responseMessage,
              admin_response_date: result.data!.admin_response_date,
              status: "in-progress" as Query['status'],
              updated_at: result.data!.updated_at 
            }
          : query
      ))

      setResponseMessage("")
      setSelectedQuery(null)
    } catch (error) {
      console.error('Error submitting response:', error)
      setError('Failed to submit response')
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HelpCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Query Management</h1>
                <p className="text-muted-foreground">Manage and respond to business queries</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Open Queries</p>
                  <p className="text-2xl font-bold text-red-600">
                    {getFilteredQueriesByStatus("open").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {getFilteredQueriesByStatus("in-progress").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {getFilteredQueriesByStatus("resolved").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Queries</p>
                  <p className="text-2xl font-bold text-blue-600">{queries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search queries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Queries Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Queries ({filteredQueries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query Details</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueries.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{query.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {query.description}
                        </p>
                      </div>
                    </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{query.business?.name || 'Unknown Business'}</p>
                              <p className="text-sm text-muted-foreground">Shop: {query.business?.shop_number || 'N/A'}</p>
                            </div>
                          </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(query.category)}
                        <span className="capitalize">{query.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(query.priority)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(query.status, query.id)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDate(query.createdAt)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedQuery(query)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Query Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold text-lg">{query.title}</h3>
                                <p className="text-muted-foreground mt-2">{query.description}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Business</p>
                                  <p className="font-medium">{query.business?.name || 'Unknown Business'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Shop</p>
                                  <p className="font-medium">{query.business?.shop_number || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Category</p>
                                  <p className="font-medium capitalize">{query.category}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Priority</p>
                                  {getPriorityBadge(query.priority)}
                                </div>
                              </div>

                              <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div className="mt-1">
                                  {getStatusBadge(query.status, query.id)}
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Response</label>
                                <Textarea
                                  placeholder="Type your response..."
                                  value={responseMessage}
                                  onChange={(e) => setResponseMessage(e.target.value)}
                                  className="mt-1"
                                  rows={3}
                                />
                                <Button 
                                  className="mt-2"
                                  onClick={() => handleResponseSubmit(query.id)}
                                  disabled={!responseMessage.trim()}
                                >
                                  Send Response
                                </Button>
                              </div>

                              {query.admin_response && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <p className="text-sm font-medium text-blue-900">Previous Response:</p>
                                  <p className="text-sm text-blue-800">{query.admin_response}</p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    {query.admin_response_date && `Responded: ${formatDate(query.admin_response_date)}`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredQueries.length === 0 && (
              <div className="text-center py-8">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No queries found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}