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
import { createStaff, updateStaff } from "@/lib/expense-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Staff } from "@/lib/database"

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  id_card_number: z.string().min(5, "ID card number is required"),
  category: z.enum(["security", "admin", "maintenance", "other"]),
  salary_amount: z.string().min(1, "Salary amount is required"),
  hire_date: z.string().min(1, "Hire date is required"),
  notes: z.string().optional(),
})

type StaffFormData = z.infer<typeof staffSchema>

interface StaffFormProps {
  staff?: Staff
  onSuccess?: () => void
  onCancel?: () => void
}

export function StaffForm({ staff, onSuccess, onCancel }: StaffFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: staff
      ? {
          name: staff.name,
          phone: staff.phone,
          email: staff.email || "",
          id_card_number: staff.id_card_number,
          category: staff.category,
          salary_amount: staff.salary_amount.toString(),
          hire_date: staff.hire_date,
          notes: staff.notes || "",
        }
      : {
          category: "security",
          hire_date: new Date().toISOString().split("T")[0],
        },
  })

  const category = watch("category")

  const onSubmit = async (data: StaffFormData) => {
    setIsSubmitting(true)

    try {
      const staffData = {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        id_card_number: data.id_card_number,
        category: data.category,
        salary_amount: parseFloat(data.salary_amount),
        hire_date: data.hire_date,
        status: staff?.status || ("active" as const),
        notes: data.notes || undefined,
      }

      let result
      if (staff) {
        result = await updateStaff(staff.id, staffData)
      } else {
        result = await createStaff(staffData)
      }

      if (result.success) {
        toast.success(staff ? "Staff member updated successfully" : "Staff member added successfully")
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
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input id="name" {...register("name")} placeholder="Enter staff name" />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input id="phone" {...register("phone")} placeholder="03XX-XXXXXXX" />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email (Optional)</Label>
          <Input id="email" type="email" {...register("email")} placeholder="email@example.com" />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        {/* ID Card Number */}
        <div className="space-y-2">
          <Label htmlFor="id_card_number">
            ID Card Number <span className="text-red-500">*</span>
          </Label>
          <Input id="id_card_number" {...register("id_card_number")} placeholder="XXXXX-XXXXXXX-X" />
          {errors.id_card_number && <p className="text-sm text-red-500">{errors.id_card_number.message}</p>}
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
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
        </div>

        {/* Salary Amount */}
        <div className="space-y-2">
          <Label htmlFor="salary_amount">
            Monthly Salary (PKR) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="salary_amount"
            type="number"
            {...register("salary_amount")}
            placeholder="25000"
            min="0"
            step="0.01"
          />
          {errors.salary_amount && <p className="text-sm text-red-500">{errors.salary_amount.message}</p>}
        </div>

        {/* Hire Date */}
        <div className="space-y-2">
          <Label htmlFor="hire_date">
            Hire Date <span className="text-red-500">*</span>
          </Label>
          <Input id="hire_date" type="date" {...register("hire_date")} />
          {errors.hire_date && <p className="text-sm text-red-500">{errors.hire_date.message}</p>}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea id="notes" {...register("notes")} placeholder="Additional information..." rows={3} />
        {errors.notes && <p className="text-sm text-red-500">{errors.notes.message}</p>}
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
          {staff ? "Update Staff" : "Add Staff"}
        </Button>
      </div>
    </form>
  )
}
