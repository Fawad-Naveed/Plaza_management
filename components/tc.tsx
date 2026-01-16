"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { getTCs, createTC, updateTC, deleteTC, type TC } from "@/lib/database"

export function TCComponent() {
  const [tcs, setTCs] = useState<TC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTC, setEditingTC] = useState<TC | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deletingTC, setDeletingTC] = useState<TC | null>(null)
  const [newTC, setNewTC] = useState({
    title: "",
    description: "",
    effective_date: "",
  })

  // Load T&C from database
  const loadTCs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTCs()
      setTCs(data)
    } catch (err) {
      console.error("Error loading T&C:", err)
      setError(err instanceof Error ? err.message : "Failed to load T&C")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTCs()
  }, [])

  const addTC = async () => {
    if (newTC.title && newTC.effective_date) {
      try {
        await createTC({
          title: newTC.title,
          description: newTC.description || undefined,
          effective_date: newTC.effective_date,
        })
        
        setNewTC({ title: "", description: "", effective_date: "" })
        setShowAddDialog(false)
        await loadTCs() // Reload to show new T&C
      } catch (err) {
        console.error("Error creating T&C:", err)
        setError(err instanceof Error ? err.message : "Failed to create T&C")
      }
    }
  }

  const handleUpdateTC = async () => {
    if (editingTC) {
      try {
        await updateTC(editingTC.id, {
          title: editingTC.title,
          description: editingTC.description,
          effective_date: editingTC.effective_date,
        })
        
        setEditingTC(null)
        setShowEditDialog(false)
        await loadTCs() // Reload to show updated T&C
      } catch (err) {
        console.error("Error updating T&C:", err)
        setError(err instanceof Error ? err.message : "Failed to update T&C")
      }
    }
  }

  const handleDeleteTC = async () => {
    if (deletingTC) {
      try {
        await deleteTC(deletingTC.id)
        setDeletingTC(null)
        await loadTCs() // Reload to show updated list
      } catch (err) {
        console.error("Error deleting T&C:", err)
        setError(err instanceof Error ? err.message : "Failed to delete T&C")
      }
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading T&C...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={loadTCs} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-black">Terms & Conditions</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add T&C
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New T&C</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tcTitle">Title</Label>
                <Input
                  id="tcTitle"
                  value={newTC.title}
                  onChange={(e) => setNewTC({ ...newTC, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tcDescription">Description</Label>
                <Textarea
                  id="tcDescription"
                  value={newTC.description}
                  onChange={(e) => setNewTC({ ...newTC, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tcEffectiveDate">Effective Date</Label>
                <Input
                  id="tcEffectiveDate"
                  type="date"
                  value={newTC.effective_date}
                  onChange={(e) => setNewTC({ ...newTC, effective_date: e.target.value })}
                />
              </div>
              <Button 
                onClick={addTC} 
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={!newTC.title || !newTC.effective_date}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add T&C
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {tcs.map((tc) => (
          <Card key={tc.id} className="border-0 rounded-4xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                {tc.title}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setEditingTC(tc)
                      setShowEditDialog(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingTC(tc)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tc.description && (
                <p className="text-gray-700 leading-relaxed mb-2">{tc.description}</p>
              )}
              <p className="text-xs text-gray-400">Effective: {tc.effective_date}</p>
              <p className="text-xs text-gray-400 mt-1">Created: {new Date(tc.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {tcs.length === 0 && !loading && (
        <Card className="border-0 rounded-4xl">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">No T&C added yet.</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-black text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First T&C
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit T&C</DialogTitle>
          </DialogHeader>
          {editingTC && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingTC.title}
                  onChange={(e) => setEditingTC({ ...editingTC, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingTC.description || ""}
                  onChange={(e) => setEditingTC({ ...editingTC, description: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={editingTC.effective_date}
                  onChange={(e) => setEditingTC({ ...editingTC, effective_date: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateTC}
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                  disabled={!editingTC.title || !editingTC.effective_date}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update T&C
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTC(null)
                    setShowEditDialog(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTC} onOpenChange={() => setDeletingTC(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete T&C</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTC?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTC}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
