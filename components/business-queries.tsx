"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  Wrench,
  Zap,
  Building,
  MessageSquare,
  Eye,
  Loader2,
  Send,
  Calendar
} from "lucide-react"
import { getAuthState } from "@/lib/auth"
import { clientDb, type Query, type Business } from "@/lib/database"

export function BusinessQueries() {
  const [queries, setQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [showNewQueryDialog, setShowNewQueryDialog] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
  const [activeTab, setActiveTab] = useState("my-queries")
  const [error, setError] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  
  // New query form state
  const [newQuery, setNewQuery] = useState({
    title: "",
    description: "",
    category: "" as Query['category'] | "",
    priority: "medium" as Query['priority']
  })

  useEffect(() => {
    loadBusinessData()
    loadQueries()
  }, [])

  const loadBusinessData = async () => {
    try {
      const authState = getAuthState()
      if (authState && authState.businessId) {
        const result = await clientDb.getBusiness(authState.businessId)
        if (result.error) {
          console.error('Error loading business data:', result.error)
          setError('Failed to load business information')
        } else if (result.data) {
          setBusiness(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading business data:', error)
      setError('Failed to load business information')
    }
  }

  const loadQueries = async () => {
    setLoading(true)
    setError('')
    try {
      const authState = getAuthState()
      if (authState && authState.businessId) {
        const result = await clientDb.getQueries(authState.businessId)
        if (result.error) {
          console.error('Error loading queries:', result.error)
          setError('Failed to load queries')
        } else {
          setQueries(result.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading queries:', error)
      setError('Failed to load queries')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuery = async () => {
    if (!newQuery.title.trim() || !newQuery.description.trim() || !newQuery.category) {
      return
    }

    setLoading(true)
    setError('')
    try {
      const authState = getAuthState()
      if (!authState || !authState.businessId) {
        throw new Error('Not authenticated')
      }

      const queryData = {
        business_id: authState.businessId,
        title: newQuery.title.trim(),
        description: newQuery.description.trim(),
        category: newQuery.category,
        priority: newQuery.priority,
        status: "open" as const
      }

      // Debug: Log the query data being sent
      console.log('Submitting query data:', queryData)
      console.log('Auth state:', authState)
      
      const result = await clientDb.createQuery(queryData)
      if (result.error) {
        console.error('Error submitting query - Full error object:', result.error)
        console.error('Error details:', {
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
          hint: result.error.hint
        })
        setError(`Failed to submit query: ${result.error.message || 'Unknown error'}`)
        return
      }

      if (result.data) {
        // Add new query to the top of the list
        setQueries(prev => [result.data!, ...prev])
        
        // Reset form and close dialog
        setNewQuery({
          title: "",
          description: "",
          category: "",
          priority: "medium"
        })
        setShowNewQueryDialog(false)
      }
      
    } catch (error) {
      console.error('Error submitting query:', error)
      setError('Failed to submit query. Please try again.')
    } finally {
      setLoading(false)
    }
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
          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
        </Badge>
      )
    }
    
    // Clickable version with dropdown
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
            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
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
      <Badge className={priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusCounts = () => {
    return {
      open: queries.filter(q => q.status === 'open').length,
      inProgress: queries.filter(q => q.status === 'in-progress').length,
      resolved: queries.filter(q => q.status === 'resolved').length,
      total: queries.length
    }
  }

  const counts = getStatusCounts()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HelpCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Queries & Support</h1>
                <p className="text-gray-600">Submit and track your queries</p>
                {business && (
                  <p className="text-sm text-gray-500">{business.name} • Shop: {business.shop_number}</p>
                )}
              </div>
            </div>
            <Dialog open={showNewQueryDialog} onOpenChange={setShowNewQueryDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit New Query
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit New Query</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Query Title *</Label>
                    <Input
                      id="title"
                      placeholder="Brief description of your issue"
                      value={newQuery.title}
                      onChange={(e) => setNewQuery(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={newQuery.category} onValueChange={(value: Query['category']) => setNewQuery(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="facility">Facility</SelectItem>
                          <SelectItem value="complaint">Complaint</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newQuery.priority} onValueChange={(value: Query['priority']) => setNewQuery(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide detailed information about your query"
                      rows={4}
                      value={newQuery.description}
                      onChange={(e) => setNewQuery(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowNewQueryDialog(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitQuery}
                      disabled={loading || !newQuery.title.trim() || !newQuery.description.trim() || !newQuery.category}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Query
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                  <p className="text-sm text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-red-600">{counts.open}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{counts.inProgress}</p>
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
                  <p className="text-2xl font-bold text-green-600">{counts.resolved}</p>
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
                  <p className="text-2xl font-bold text-blue-600">{counts.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-queries">My Queries ({queries.length})</TabsTrigger>
            <TabsTrigger value="contact-info">Contact Support</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-queries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Your Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading queries...</span>
                  </div>
                ) : queries.length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No queries submitted yet.</p>
                    <Button onClick={() => setShowNewQueryDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Your First Query
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query Details</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queries.map((query) => (
                        <TableRow key={query.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{query.title}</p>
                              <p className="text-sm text-gray-600 truncate max-w-xs">
                                {query.description}
                              </p>
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
                                    <p className="text-gray-600 mt-2">{query.description}</p>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-600">Category</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {getCategoryIcon(query.category)}
                                        <span className="capitalize font-medium">{query.category}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Priority</p>
                                      <div className="mt-1">
                                        {getPriorityBadge(query.priority)}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Status</p>
                                      <div className="mt-1">
                                        {getStatusBadge(query.status, query.id)}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Submitted</p>
                                      <p className="font-medium">{formatDate(query.createdAt)}</p>
                                    </div>
                                  </div>

                                  {query.adminResponse && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <MessageCircle className="h-4 w-4 text-blue-600" />
                                        <p className="font-medium text-blue-900">Admin Response</p>
                                      </div>
                                      <p className="text-blue-800 mb-2">{query.adminResponse}</p>
                                      {query.adminResponseDate && (
                                        <p className="text-xs text-blue-600">
                                          <Calendar className="h-3 w-3 inline mr-1" />
                                          {formatDate(query.adminResponseDate)}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact-info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-green-50 border-b border-green-200">
                  <CardTitle className="text-lg font-semibold text-green-900 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-green-600" />
                    Contact Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Need immediate assistance? Contact our support team directly.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">+92 XXX XXXXXXX</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">support@plazamanagement.com</span>
                      </div>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Support
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-purple-50 border-b border-purple-200">
                  <CardTitle className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    Office Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Our support team is available during these hours:
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Monday - Friday:</span>
                        <span className="font-medium text-gray-900">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Saturday:</span>
                        <span className="font-medium text-gray-900">10:00 AM - 4:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Sunday:</span>
                        <span className="font-medium text-gray-900">Closed</span>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Emergency maintenance requests are handled 24/7.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
