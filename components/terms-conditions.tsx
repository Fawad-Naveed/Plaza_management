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
import { getTermsConditions, createTermsCondition, updateTermsCondition, deleteTermsCondition, type TermsCondition } from "@/lib/database"

export function TermsConditions() {
  const [terms, setTerms] = useState<TermsCondition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTerm, setEditingTerm] = useState<TermsCondition | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deletingTerm, setDeletingTerm] = useState<TermsCondition | null>(null)
  const [newTerm, setNewTerm] = useState({
    title: "",
    description: "",
  })

  // Load terms and conditions from database
  const loadTermsConditions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTermsConditions()
      setTerms(data)
    } catch (err) {
      console.error("Error loading terms and conditions:", err)
      setError(err instanceof Error ? err.message : "Failed to load terms and conditions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTermsConditions()
  }, [])

  const addTerm = async () => {
    if (newTerm.title && newTerm.description) {
      try {
        await createTermsCondition({
          business_id: null,  // Global terms, not business-specific
          title: newTerm.title,
          description: newTerm.description,
          effective_date: new Date().toISOString().split('T')[0],
        })
        
        setNewTerm({ title: "", description: "" })
        setShowAddDialog(false)
        await loadTermsConditions() // Reload to show new term
      } catch (err) {
        console.error("Error creating term:", err)
        setError(err instanceof Error ? err.message : "Failed to create terms and conditions")
      }
    }
  }

  const handleUpdateTerm = async () => {
    if (editingTerm) {
      try {
        await updateTermsCondition(editingTerm.id, {
          title: editingTerm.title,
          description: editingTerm.description,
        })
        
        setEditingTerm(null)
        setShowEditDialog(false)
        await loadTermsConditions() // Reload to show updated term
      } catch (err) {
        console.error("Error updating term:", err)
        setError(err instanceof Error ? err.message : "Failed to update terms and conditions")
      }
    }
  }

  const handleDeleteTerm = async () => {
    if (deletingTerm) {
      try {
        await deleteTermsCondition(deletingTerm.id)
        setDeletingTerm(null)
        await loadTermsConditions() // Reload to show updated list
      } catch (err) {
        console.error("Error deleting term:", err)
        setError(err instanceof Error ? err.message : "Failed to delete terms and conditions")
      }
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading terms and conditions...</span>
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
          <Button onClick={loadTermsConditions} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Terms and Conditions</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Terms and Condition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Terms and Condition</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="termTitle">Terms Title</Label>
                <Input
                  id="termTitle"
                  value={newTerm.title}
                  onChange={(e) => setNewTerm({ ...newTerm, title: e.target.value })}
                  placeholder="Enter terms title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="termDescription">Terms Description</Label>
                <Textarea
                  id="termDescription"
                  value={newTerm.description}
                  onChange={(e) => setNewTerm({ ...newTerm, description: e.target.value })}
                  placeholder="Enter detailed terms description"
                  rows={6}
                />
              </div>
              <Button 
                onClick={addTerm} 
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={!newTerm.title || !newTerm.description}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Terms and Condition
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {terms.map((term) => (
          <Card key={term.id} className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                {term.title}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setEditingTerm(term)
                      setShowEditDialog(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingTerm(term)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{term.description}</p>
              <p className="text-xs text-gray-400 mt-2">Effective: {term.effective_date}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {terms.length === 0 && !loading && (
        <Card className="border-gray-200">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">No terms and conditions added yet.</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-black text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Terms and Condition
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Terms and Condition</DialogTitle>
          </DialogHeader>
          {editingTerm && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Terms Title</Label>
                <Input
                  value={editingTerm.title}
                  onChange={(e) => setEditingTerm({ ...editingTerm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms Description</Label>
                <Textarea
                  value={editingTerm.description}
                  onChange={(e) => setEditingTerm({ ...editingTerm, description: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateTerm}
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                  disabled={!editingTerm.title || !editingTerm.description}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Terms and Condition
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTerm(null)
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
      <AlertDialog open={!!deletingTerm} onOpenChange={() => setDeletingTerm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Terms and Condition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTerm?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTerm}
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
