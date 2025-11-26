"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createVariableExpense, updateVariableExpense, uploadReceiptImage } from "@/lib/expense-actions"
import { toast } from "sonner"
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react"
import type { VariableExpense } from "@/lib/database"

const variableExpenseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  expense_date: z.string().min(1, "Expense date is required"),
  category: z.enum(["repairs", "supplies", "maintenance", "misc", "emergency", "other"]),
  payment_method: z.enum(["cash", "cheque", "bank_transfer", "upi", "card"]).optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

type VariableExpenseFormData = z.infer<typeof variableExpenseSchema>

interface VariableExpenseFormProps {
  expense?: VariableExpense
  onSuccess?: () => void
  onCancel?: () => void
}

export function VariableExpenseForm({ expense, onSuccess, onCancel }: VariableExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(expense?.receipt_image_url || null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VariableExpenseFormData>({
    resolver: zodResolver(variableExpenseSchema),
    defaultValues: expense
      ? {
          title: expense.title,
          description: expense.description || "",
          amount: expense.amount.toString(),
          expense_date: expense.expense_date,
          category: expense.category,
          payment_method: expense.payment_method || undefined,
          reference_number: expense.reference_number || "",
          notes: expense.notes || "",
        }
      : {
          category: "misc",
          expense_date: new Date().toISOString().split("T")[0],
        },
  })

  const category = watch("category")
  const paymentMethod = watch("payment_method")

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB")
        return
      }

      setReceiptFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  const onSubmit = async (data: VariableExpenseFormData) => {
    setIsSubmitting(true)

    try {
      let receiptUrl = expense?.receipt_image_url

      // Upload receipt if new file is selected
      if (receiptFile) {
        setUploadingReceipt(true)
        const formData = new FormData()
        formData.append("file", receiptFile)
        
        const uploadResult = await uploadReceiptImage(formData)

        if (!uploadResult.success) {
          toast.error(uploadResult.error || "Failed to upload receipt")
          setIsSubmitting(false)
          setUploadingReceipt(false)
          return
        }

        receiptUrl = uploadResult.data?.url
        setUploadingReceipt(false)
      }

      const expenseData = {
        title: data.title,
        description: data.description || undefined,
        amount: parseFloat(data.amount),
        expense_date: data.expense_date,
        category: data.category,
        receipt_image_url: receiptUrl,
        payment_method: data.payment_method || undefined,
        reference_number: data.reference_number || undefined,
        notes: data.notes || undefined,
      }

      let result
      if (expense) {
        result = await updateVariableExpense(expense.id, expenseData)
      } else {
        result = await createVariableExpense(expenseData)
      }

      if (result.success) {
        toast.success(expense ? "Expense updated successfully" : "Expense added successfully")
        onSuccess?.()
      } else {
        toast.error(result.error || "An error occurred")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error(error)
    } finally {
      setIsSubmitting(false)
      setUploadingReceipt(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Expense Title <span className="text-red-500">*</span>
          </Label>
          <Input id="title" {...register("title")} placeholder="e.g., Office Supplies Purchase" />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount (PKR) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="amount"
            type="number"
            {...register("amount")}
            placeholder="5000"
            min="0"
            step="0.01"
          />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select value={category} onValueChange={(value) => setValue("category", value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="repairs">Repairs</SelectItem>
              <SelectItem value="supplies">Supplies</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="misc">Miscellaneous</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
        </div>

        {/* Expense Date */}
        <div className="space-y-2">
          <Label htmlFor="expense_date">
            Expense Date <span className="text-red-500">*</span>
          </Label>
          <Input id="expense_date" type="date" {...register("expense_date")} />
          {errors.expense_date && <p className="text-sm text-red-500">{errors.expense_date.message}</p>}
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment Method (Optional)</Label>
          <Select value={paymentMethod} onValueChange={(value) => setValue("payment_method", value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reference Number */}
        <div className="space-y-2">
          <Label htmlFor="reference_number">Reference Number (Optional)</Label>
          <Input id="reference_number" {...register("reference_number")} placeholder="Transaction ID" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Brief description of the expense..."
          rows={2}
        />
      </div>

      {/* Receipt Upload */}
      <div className="space-y-2">
        <Label htmlFor="receipt">Receipt Image (Optional)</Label>
        {receiptPreview ? (
          <div className="relative border rounded-lg p-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeReceipt}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
            <img src={receiptPreview} alt="Receipt preview" className="max-h-48 mx-auto rounded" />
            <p className="text-xs text-muted-foreground text-center mt-2">
              {receiptFile?.name || "Current receipt"}
            </p>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Input
              id="receipt"
              type="file"
              accept="image/*"
              onChange={handleReceiptChange}
              className="hidden"
            />
            <Label htmlFor="receipt" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-sm">
                  <span className="text-primary font-medium">Click to upload</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
              </div>
            </Label>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea id="notes" {...register("notes")} placeholder="Any additional information..." rows={2} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || uploadingReceipt}>
          {(isSubmitting || uploadingReceipt) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {uploadingReceipt ? "Uploading..." : expense ? "Update Expense" : "Add Expense"}
        </Button>
      </div>
    </form>
  )
}
