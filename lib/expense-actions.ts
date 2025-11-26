"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  Staff,
  StaffSalaryRecord,
  PlazaUtilityBill,
  FixedExpenseConfig,
  VariableExpense,
  ExpenseReminder,
} from "./database"

// ============================================
// STAFF MANAGEMENT ACTIONS
// ============================================

export async function createStaff(data: Omit<Staff, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient()

  const { data: staff, error } = await supabase.from("staff").insert(data).select().single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/staff")
  return { success: true, data: staff }
}

export async function getStaff(filters?: { status?: string; category?: string }) {
  const supabase = await createClient()

  let query = supabase.from("staff").select("*").order("created_at", { ascending: false })

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.category) {
    query = query.eq("category", filters.category)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getStaffById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("staff").select("*").eq("id", id).single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateStaff(id: string, updates: Partial<Staff>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("staff")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/staff")
  revalidatePath(`/expenses/staff/${id}`)
  return { success: true, data }
}

export async function deleteStaff(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("staff").delete().eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/staff")
  return { success: true }
}

// ============================================
// STAFF SALARY RECORDS ACTIONS
// ============================================

export async function createStaffSalaryRecord(
  data: Omit<StaffSalaryRecord, "id" | "created_at" | "updated_at">,
) {
  const supabase = await createClient()

  const { data: record, error } = await supabase.from("staff_salary_records").insert(data).select().single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/staff")
  revalidatePath(`/expenses/staff/${data.staff_id}`)
  return { success: true, data: record }
}

export async function getStaffSalaryRecords(staffId?: string, filters?: { month?: number; year?: number }) {
  const supabase = await createClient()

  let query = supabase.from("staff_salary_records").select("*, staff(*)").order("year", { ascending: false }).order("month", { ascending: false })

  if (staffId) {
    query = query.eq("staff_id", staffId)
  }

  if (filters?.month) {
    query = query.eq("month", filters.month)
  }

  if (filters?.year) {
    query = query.eq("year", filters.year)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateStaffSalaryRecord(id: string, updates: Partial<StaffSalaryRecord>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("staff_salary_records")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/staff")
  return { success: true, data }
}

// Generate monthly salary records for all active staff
export async function generateMonthlySalaries(month: number, year: number) {
  const supabase = await createClient()

  // Get all active staff
  const { data: activeStaff, error: staffError } = await supabase
    .from("staff")
    .select("*")
    .eq("status", "active")

  if (staffError || !activeStaff) {
    return { success: false, error: staffError?.message || "No active staff found" }
  }

  // Check if records already exist for this month/year
  const { data: existingRecords } = await supabase
    .from("staff_salary_records")
    .select("staff_id")
    .eq("month", month)
    .eq("year", year)

  const existingStaffIds = new Set(existingRecords?.map((r) => r.staff_id) || [])

  // Create salary records for staff without existing records
  const salaryRecords = activeStaff
    .filter((staff) => !existingStaffIds.has(staff.id))
    .map((staff) => ({
      staff_id: staff.id,
      month,
      year,
      amount: staff.salary_amount,
      status: "pending" as const,
    }))

  if (salaryRecords.length === 0) {
    return { success: true, message: "All salary records already exist", data: [] }
  }

  const { data, error } = await supabase.from("staff_salary_records").insert(salaryRecords).select()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/staff")
  return { success: true, data, message: `Generated ${salaryRecords.length} salary records` }
}

// ============================================
// PLAZA UTILITY BILLS ACTIONS
// ============================================

export async function createPlazaUtilityBill(data: Omit<PlazaUtilityBill, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient()

  const { data: bill, error } = await supabase.from("plaza_utility_bills").insert(data).select().single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/fixed")
  return { success: true, data: bill }
}

export async function getPlazaUtilityBills(filters?: {
  utility_type?: string
  status?: string
  month?: number
  year?: number
}) {
  const supabase = await createClient()

  let query = supabase.from("plaza_utility_bills").select("*").order("bill_date", { ascending: false })

  if (filters?.utility_type) {
    query = query.eq("utility_type", filters.utility_type)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.month) {
    query = query.eq("month", filters.month)
  }

  if (filters?.year) {
    query = query.eq("year", filters.year)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updatePlazaUtilityBill(id: string, updates: Partial<PlazaUtilityBill>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("plaza_utility_bills")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/fixed")
  return { success: true, data }
}

export async function deletePlazaUtilityBill(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("plaza_utility_bills").delete().eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/fixed")
  return { success: true }
}

// ============================================
// FIXED EXPENSE CONFIG ACTIONS
// ============================================

export async function createFixedExpenseConfig(
  data: Omit<FixedExpenseConfig, "id" | "created_at" | "updated_at">,
) {
  const supabase = await createClient()

  const { data: config, error } = await supabase.from("fixed_expenses_config").insert(data).select().single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/fixed")
  return { success: true, data: config }
}

export async function getFixedExpenseConfigs(filters?: { status?: string }) {
  const supabase = await createClient()

  let query = supabase.from("fixed_expenses_config").select("*").order("next_due_date", { ascending: true })

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateFixedExpenseConfig(id: string, updates: Partial<FixedExpenseConfig>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("fixed_expenses_config")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/fixed")
  return { success: true, data }
}

export async function deleteFixedExpenseConfig(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("fixed_expenses_config").delete().eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/fixed")
  return { success: true }
}

// Generate bills from recurring expense templates
export async function generateRecurringBills() {
  const supabase = await createClient()

  // Get all active recurring expense configs that are due
  const today = new Date().toISOString().split("T")[0]
  const { data: configs, error: configError } = await supabase
    .from("fixed_expenses_config")
    .select("*")
    .eq("status", "active")
    .eq("auto_generate", true)
    .lte("next_due_date", today)

  if (configError) {
    return { success: false, error: configError.message }
  }

  if (!configs || configs.length === 0) {
    return { success: true, message: "No recurring bills are due", generated: 0 }
  }

  const generatedBills = []
  const errors = []

  for (const config of configs) {
    try {
      // Create a utility bill from the template
      const billData = {
        utility_type: "electricity" as const, // You can make this configurable
        title: config.title,
        description: config.description,
        amount: config.amount,
        bill_date: config.next_due_date,
        due_date: config.next_due_date,
        month: new Date(config.next_due_date).getMonth() + 1,
        year: new Date(config.next_due_date).getFullYear(),
        status: "pending" as const,
      }

      const { data: bill, error: billError } = await supabase
        .from("plaza_utility_bills")
        .insert(billData)
        .select()
        .single()

      if (billError) {
        errors.push({ config: config.title, error: billError.message })
        continue
      }

      generatedBills.push(bill)

      // Calculate next due date based on frequency
      const currentDate = new Date(config.next_due_date)
      let nextDate: Date

      switch (config.frequency) {
        case "monthly":
          nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1))
          break
        case "quarterly":
          nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 3))
          break
        case "semi_annual":
          nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 6))
          break
        case "annual":
          nextDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1))
          break
        default:
          nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1))
      }

      // Update the config with the new next_due_date
      await supabase
        .from("fixed_expenses_config")
        .update({ next_due_date: nextDate.toISOString().split("T")[0] })
        .eq("id", config.id)
    } catch (error) {
      errors.push({ config: config.title, error: String(error) })
    }
  }

  revalidatePath("/expenses/fixed")

  if (errors.length > 0) {
    return {
      success: true,
      message: `Generated ${generatedBills.length} bills with ${errors.length} errors`,
      generated: generatedBills.length,
      errors,
    }
  }

  return {
    success: true,
    message: `Successfully generated ${generatedBills.length} recurring bills`,
    generated: generatedBills.length,
  }
}

// ============================================
// VARIABLE EXPENSE ACTIONS
// ============================================

export async function createVariableExpense(data: Omit<VariableExpense, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient()

  const { data: expense, error } = await supabase.from("variable_expenses").insert(data).select().single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/variable")
  return { success: true, data: expense }
}

export async function getVariableExpenses(filters?: { category?: string; startDate?: string; endDate?: string }) {
  const supabase = await createClient()

  let query = supabase.from("variable_expenses").select("*").order("expense_date", { ascending: false })

  if (filters?.category) {
    query = query.eq("category", filters.category)
  }

  if (filters?.startDate) {
    query = query.gte("expense_date", filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte("expense_date", filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateVariableExpense(id: string, updates: Partial<VariableExpense>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("variable_expenses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/variable")
  return { success: true, data }
}

export async function deleteVariableExpense(id: string) {
  const supabase = await createClient()

  // Get the expense to check for receipt image
  const { data: expense } = await supabase.from("variable_expenses").select("receipt_image_url").eq("id", id).single()

  // Delete receipt image from storage if it exists
  if (expense?.receipt_image_url) {
    const path = expense.receipt_image_url.split("/").pop()
    if (path) {
      await supabase.storage.from("expense-receipts").remove([path])
    }
  }

  const { error } = await supabase.from("variable_expenses").delete().eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses/variable")
  return { success: true }
}

// ============================================
// RECEIPT IMAGE UPLOAD
// ============================================

export async function uploadReceiptImage(formData: FormData) {
  const supabase = await createClient()

  const file = formData.get("file") as File
  if (!file) {
    return { success: false, error: "No file provided" }
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = fileName

  // Convert file to ArrayBuffer for server action
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error } = await supabase.storage.from("expense-receipts").upload(filePath, buffer, {
    contentType: file.type,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("expense-receipts").getPublicUrl(filePath)

  return { success: true, data: { path: data.path, url: publicUrl } }
}

export async function deleteReceiptImage(path: string) {
  const supabase = await createClient()

  const { error } = await supabase.storage.from("expense-receipts").remove([path])

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============================================
// EXPENSE REMINDERS ACTIONS
// ============================================

export async function createExpenseReminder(data: Omit<ExpenseReminder, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient()

  const { data: reminder, error } = await supabase.from("expense_reminders").insert(data).select().single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses")
  return { success: true, data: reminder }
}

export async function getExpenseReminders(filters?: { status?: string; startDate?: string; endDate?: string }) {
  const supabase = await createClient()

  let query = supabase.from("expense_reminders").select("*").order("reminder_date", { ascending: true })

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.startDate) {
    query = query.gte("reminder_date", filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte("reminder_date", filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateExpenseReminder(id: string, updates: Partial<ExpenseReminder>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("expense_reminders")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/expenses")
  return { success: true, data }
}

// ============================================
// DASHBOARD STATISTICS
// ============================================

export async function getExpenseDashboardStats(month?: number, year?: number) {
  const supabase = await createClient()

  const currentMonth = month || new Date().getMonth() + 1
  const currentYear = year || new Date().getFullYear()

  try {
    // Run all queries in parallel for better performance
    const [
      { data: salaryData },
      { data: utilityData },
      { data: variableData },
      { count: activeStaffCount },
      { count: pendingRemindersCount }
    ] = await Promise.all([
      // Get staff salary totals
      supabase
        .from("staff_salary_records")
        .select("amount, status")
        .eq("month", currentMonth)
        .eq("year", currentYear),
      
      // Get utility bills totals
      supabase
        .from("plaza_utility_bills")
        .select("amount, status")
        .eq("month", currentMonth)
        .eq("year", currentYear),
      
      // Get variable expenses for the month
      supabase
        .from("variable_expenses")
        .select("amount")
        .gte("expense_date", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`)
        .lte("expense_date", new Date(currentYear, currentMonth, 0).toISOString().split("T")[0]),
      
      // Get active staff count
      supabase
        .from("staff")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      
      // Get pending reminders count
      supabase
        .from("expense_reminders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .lte("reminder_date", new Date().toISOString().split("T")[0])
    ])

    // Calculate totals
    const totalSalaries = salaryData?.reduce((sum, record) => sum + Number(record.amount), 0) || 0
    const totalUtilities = utilityData?.reduce((sum, bill) => sum + Number(bill.amount), 0) || 0
    const totalVariable = variableData?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0
    const totalFixed = totalSalaries + totalUtilities

    const paidSalaries = salaryData?.filter((r) => r.status === "paid").reduce((sum, r) => sum + Number(r.amount), 0) || 0
    const paidUtilities = utilityData?.filter((b) => b.status === "paid").reduce((sum, b) => sum + Number(b.amount), 0) || 0
    const totalPaid = paidSalaries + paidUtilities + totalVariable

    const pendingSalaries = salaryData?.filter((r) => r.status === "pending").reduce((sum, r) => sum + Number(r.amount), 0) || 0
    const pendingUtilities = utilityData?.filter((b) => b.status === "pending").reduce((sum, b) => sum + Number(b.amount), 0) || 0
    const totalPending = pendingSalaries + pendingUtilities

    return {
      success: true,
      data: {
        totalFixed,
        totalVariable,
        totalExpenses: totalFixed + totalVariable,
        totalPaid,
        totalPending,
        activeStaffCount: activeStaffCount || 0,
        pendingRemindersCount: pendingRemindersCount || 0,
        breakdown: {
          salaries: totalSalaries,
          utilities: totalUtilities,
          variable: totalVariable,
        },
      },
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      success: false,
      error: "Failed to load dashboard statistics"
    }
  }
}
