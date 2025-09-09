"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Check, X } from "lucide-react"
import { getTermsConditions, type TermsCondition } from "@/lib/database"

interface TermsSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (selectedTerms: TermsCondition[], termsText: string) => void
  onCancel: () => void
  loading?: boolean
}

export function TermsSelectionDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  onCancel, 
  loading = false 
}: TermsSelectionDialogProps) {
  const [terms, setTerms] = useState<TermsCondition[]>([])
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([])
  const [termsLoading, setTermsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load terms and conditions when dialog opens
  useEffect(() => {
    if (open) {
      loadTerms()
    }
  }, [open])

  const loadTerms = async () => {
    try {
      setTermsLoading(true)
      setError(null)
      const data = await getTermsConditions()
      setTerms(data)
      
      // Auto-select commonly used terms
      const commonTerms = data.filter(term => 
        term.title.toLowerCase().includes('payment') ||
        term.title.toLowerCase().includes('general')
      )
      setSelectedTermIds(commonTerms.map(t => t.id))
      
    } catch (err) {
      console.error("Error loading terms:", err)
      setError(err instanceof Error ? err.message : "Failed to load terms")
    } finally {
      setTermsLoading(false)
    }
  }

  const handleTermToggle = (termId: string) => {
    setSelectedTermIds(prev => 
      prev.includes(termId) 
        ? prev.filter(id => id !== termId)
        : [...prev, termId]
    )
  }

  const handleConfirm = () => {
    const selectedTerms = terms.filter(term => selectedTermIds.includes(term.id))
    
    // Generate formatted terms text for the bill
    const termsText = selectedTerms.length > 0 
      ? selectedTerms.map((term, index) => 
          `${index + 1}. ${term.title}\n   ${term.description}`
        ).join('\n\n')
      : ''
    
    onConfirm(selectedTerms, termsText)
  }

  const handleCancel = () => {
    setSelectedTermIds([])
    onCancel()
  }

  const selectedCount = selectedTermIds.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Terms and Conditions for Bill
          </DialogTitle>
          <DialogDescription>
            Choose the terms and conditions that will be applied to this bill. 
            Selected terms will be included in the generated PDF invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Badge variant={selectedCount > 0 ? "default" : "secondary"}>
              {selectedCount} term{selectedCount !== 1 ? 's' : ''} selected
            </Badge>
            {selectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTermIds([])}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            )}
          </div>
          
          {terms.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTermIds(terms.map(t => t.id))}
              className="text-blue-600 hover:text-blue-700"
            >
              Select all
            </Button>
          )}
        </div>

        <Separator />

        <ScrollArea className="h-[400px] pr-4">
          {termsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading terms and conditions...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          )}

          {!termsLoading && !error && terms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Terms and Conditions Found</p>
              <p className="text-sm text-center">
                You need to create terms and conditions first.<br />
                Go to the Terms & Conditions section to add some.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {terms.map((term) => (
              <div
                key={term.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedTermIds.includes(term.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTermToggle(term.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedTermIds.includes(term.id)}
                    onChange={() => handleTermToggle(term.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{term.title}</h3>
                      <div className="text-xs text-gray-400">
                        {term.effective_date}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {term.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || selectedCount === 0}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Check className="h-4 w-4 mr-2" />
            {loading ? "Creating Bill..." : `Apply ${selectedCount} Term${selectedCount !== 1 ? 's' : ''} & Generate Bill`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
