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
import { Checkbox } from "@/components/ui/checkbox"
import { createFixedExpenseConfig, updateFixedExpenseConfig } from "@/lib/expense-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { FixedExpenseConfig } from "@/lib/database"

const recurringExpenseSchema = z.object({
  expense_type: z.enum(["property_tax", "insurance", "other"]),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  frequency: z.enum(["monthly", "quarterly", "semi_annual", "annual"]),
  next_due_date: z.string().min(1, "Next due date is required"),
  reminder_date: z.string().optional(),
  auto_generate: z.boolean().default(false),
})

type RecurringExpenseFormData = z.infer<typeof recurringExpenseSchema>

interface RecurringExpenseFormProps {
  config?: FixedExpenseConfig
  onSuccess?: () => void
  onCancel?: () => void
}

export function RecurringExpenseForm({ config, onSuccess, onCancel }: RecurringExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RecurringExpenseFormData>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: config
      ? {
          expense_type: config.expense_type,
          title: config.title,
          description: config.description || "",
          amount: config.amount.toString(),
          frequency: config.frequency,
          next_due_date: config.next_due_date,
          reminder_date: config.reminder_date || "",
          auto_generate: config.auto_generate,
        }
      : {
          expense_type: "other",
          frequency: "monthly",
          next_due_date: new Date().toISOString().split("T")[0],
          auto_generate: true,
        },
  })

  const expenseType = watch("expense_type")
  const frequency = watch("frequency")
  const autoGenerate = watch("auto_generate")

  const onSubmit = async (data: RecurringExpenseFormData) => {
    setIsSubmitting(true)

    try {
      const configData = {
        expense_type: data.expense_type,
        title: data.title,
        description: data.description || undefined,
        amount: parseFloat(data.amount),
        frequency: data.frequency,
        next_due_date: data.next_due_date,
        reminder_date: data.reminder_date || undefined,
        auto_generate: data.auto_generate,
        status: config?.status || ("active" as const),
      }

      let result
      if (config) {
        result = await updateFixedExpenseConfig(config.id, configData)
      } else {
        result = await createFixedExpenseConfig(configData)
      }

      if (result.success) {
        toast.success(
          config ? "Recurring expense updated successfully" : "Recurring expense created successfully"
        )
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
        {/* Expense Type */}
        <div className="space-y-2">
          <Label htmlFor="expense_type">
            Expense Type <span className="text-red-500">*</span>
          </Label>
          <Select value={expenseType} onValueChange={(value) => setValue("expense_type", value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="property_tax">Property Tax</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.expense_type && <p className="text-sm text-red-500">{errors.expense_type.message}</p>}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input id="title" {...register("title")} placeholder="e.g., Monthly Plaza Electricity" />
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

        {/* Frequency */}
        <div className="space-y-2">
          <Label htmlFor="frequency">
            Frequency <span className="text-red-500">*</span>
          </Label>
          <Select value={frequency} onValueChange={(value) => setValue("frequency", value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
              <SelectItem value="semi_annual">Semi-Annual (Every 6 months)</SelectItem>
              <SelectItem value="annual">Annual (Yearly)</SelectItem>
            </SelectContent>
          </Select>
          {errors.frequency && <p className="text-sm text-red-500">{errors.frequency.message}</p>}
        </div>

        {/* Next Due Date */}
        <div className="space-y-2">
          <Label htmlFor="next_due_date">
            Next Due Date <span className="text-red-500">*</span>
          </Label>
          <Input id="next_due_date" type="date" {...register("next_due_date")} />
          {errors.next_due_date && <p className="text-sm text-red-500">{errors.next_due_date.message}</p>}
          <p className="text-xs text-muted-foreground">
            Bills will be generated on this date and subsequent dates based on frequency
          </p>
        </div>

        {/* Reminder Date */}
        <div className="space-y-2">
          <Label htmlFor="reminder_date">Reminder Date (Optional)</Label>
          <Input id="reminder_date" type="date" {...register("reminder_date")} />
          <p className="text-xs text-muted-foreground">Get reminded before the bill is due</p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Additional details about this recurring expense..."
          rows={2}
        />
      </div>

      {/* Auto Generate */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="auto_generate"
          checked={autoGenerate}
          onCheckedChange={(checked) => setValue("auto_generate", checked as boolean)}
        />
        <Label htmlFor="auto_generate" className="cursor-pointer">
          Automatically generate bills on due date
        </Label>
      </div>
      <p className="text-xs text-muted-foreground ml-6">
        When enabled, bills will be automatically created when you click "Generate Recurring Bills"
      </p>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {config ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </form>
  )
}
