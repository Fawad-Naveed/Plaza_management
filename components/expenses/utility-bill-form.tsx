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
import { createPlazaUtilityBill, updatePlazaUtilityBill } from "@/lib/expense-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { PlazaUtilityBill } from "@/lib/database"

const utilityBillSchema = z.object({
  utility_type: z.enum(["electricity", "water", "gas", "property_tax"]),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  bill_date: z.string().min(1, "Bill date is required"),
  due_date: z.string().min(1, "Due date is required"),
  month: z.string().optional(),
  year: z.string().min(1, "Year is required"),
  payment_method: z.enum(["cash", "cheque", "bank_transfer", "upi", "card"]).optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

type UtilityBillFormData = z.infer<typeof utilityBillSchema>

interface UtilityBillFormProps {
  bill?: PlazaUtilityBill
  onSuccess?: () => void
  onCancel?: () => void
}

export function UtilityBillForm({ bill, onSuccess, onCancel }: UtilityBillFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UtilityBillFormData>({
    resolver: zodResolver(utilityBillSchema),
    defaultValues: bill
      ? {
          utility_type: bill.utility_type,
          title: bill.title,
          description: bill.description || "",
          amount: bill.amount.toString(),
          bill_date: bill.bill_date,
          due_date: bill.due_date,
          month: bill.month?.toString() || "",
          year: bill.year.toString(),
          payment_method: bill.payment_method || undefined,
          reference_number: bill.reference_number || "",
          notes: bill.notes || "",
        }
      : {
          utility_type: "electricity",
          bill_date: new Date().toISOString().split("T")[0],
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          year: new Date().getFullYear().toString(),
          month: (new Date().getMonth() + 1).toString(),
        },
  })

  const utilityType = watch("utility_type")
  const paymentMethod = watch("payment_method")

  const onSubmit = async (data: UtilityBillFormData) => {
    setIsSubmitting(true)

    try {
      const billData = {
        utility_type: data.utility_type,
        title: data.title,
        description: data.description || undefined,
        amount: parseFloat(data.amount),
        bill_date: data.bill_date,
        due_date: data.due_date,
        month: data.month ? parseInt(data.month) : undefined,
        year: parseInt(data.year),
        payment_method: data.payment_method || undefined,
        reference_number: data.reference_number || undefined,
        status: bill?.status || ("pending" as const),
        notes: data.notes || undefined,
      }

      let result
      if (bill) {
        result = await updatePlazaUtilityBill(bill.id, billData)
      } else {
        result = await createPlazaUtilityBill(billData)
      }

      if (result.success) {
        toast.success(bill ? "Utility bill updated successfully" : "Utility bill added successfully")
        onSuccess?.()
      } else {
        toast.error(result.error || "An error occurred")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Utility Type */}
        <div className="space-y-2">
          <Label htmlFor="utility_type">
            Utility Type <span className="text-red-500">*</span>
          </Label>
          <Select value={utilityType} onValueChange={(value) => setValue("utility_type", value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select utility type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="electricity">Plaza Electricity</SelectItem>
              <SelectItem value="water">Plaza Water</SelectItem>
              <SelectItem value="gas">Plaza Gas</SelectItem>
              <SelectItem value="property_tax">Property Tax</SelectItem>
            </SelectContent>
          </Select>
          {errors.utility_type && <p className="text-sm text-red-500">{errors.utility_type.message}</p>}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input id="title" {...register("title")} placeholder="e.g., Monthly Electricity Bill" />
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
            placeholder="50000"
            min="0"
            step="0.01"
          />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>

        {/* Bill Date */}
        <div className="space-y-2">
          <Label htmlFor="bill_date">
            Bill Date <span className="text-red-500">*</span>
          </Label>
          <Input id="bill_date" type="date" {...register("bill_date")} />
          {errors.bill_date && <p className="text-sm text-red-500">{errors.bill_date.message}</p>}
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="due_date">
            Due Date <span className="text-red-500">*</span>
          </Label>
          <Input id="due_date" type="date" {...register("due_date")} />
          {errors.due_date && <p className="text-sm text-red-500">{errors.due_date.message}</p>}
        </div>

        {/* Month */}
        <div className="space-y-2">
          <Label htmlFor="month">Month (Optional)</Label>
          <Select value={watch("month")} onValueChange={(value) => setValue("month", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label htmlFor="year">
            Year <span className="text-red-500">*</span>
          </Label>
          <Input id="year" type="number" {...register("year")} placeholder="2024" min="2000" max="2100" />
          {errors.year && <p className="text-sm text-red-500">{errors.year.message}</p>}
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
          placeholder="Additional details..."
          rows={2}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea id="notes" {...register("notes")} placeholder="Internal notes..." rows={2} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {bill ? "Update Bill" : "Add Bill"}
        </Button>
      </div>
    </form>
  )
}
