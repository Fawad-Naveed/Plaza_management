import { createClient as createBrowserClient } from "./supabase/client"

// Types
export interface Business {
  id: string
  name: string
  type: string
  contact_person: string
  phone: string
  email?: string
  floor_number: number
  shop_number: string
  area_sqft: number
  rent_amount: number
  security_deposit: number
  lease_start_date: string
  lease_end_date: string
  electricity_consumer_number?: string
  gas_consumer_number?: string
  status: "active" | "inactive" | "terminated"
  created_at: string
  updated_at: string
}

export interface ContactPerson {
  id: string
  business_id: string
  name: string
  phone: string
  email?: string
  designation?: string
  is_primary: boolean
  created_at: string
}

export interface Floor {
  id: string
  floor_number: number
  floor_name: string
  total_shops: number
  occupied_shops: number
  total_area_sqft: number
  created_at: string
}

export interface Bill {
  id: string
  business_id: string
  bill_number: string
  bill_date: string
  due_date: string
  rent_amount: number
  maintenance_charges: number
  electricity_charges: number
  gas_charges: number
  water_charges: number
  other_charges: number
  total_amount: number
  status: "pending" | "paid" | "overdue" | "cancelled"
  terms_conditions_ids?: string[]
  terms_conditions_text?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  business_id: string
  bill_id?: string
  payment_date: string
  amount: number
  payment_method: "cash" | "cheque" | "bank_transfer" | "upi" | "card"
  reference_number?: string
  notes?: string
  created_at: string
}

export interface Advance {
  id: string
  business_id: string
  amount: number
  advance_date: string
  purpose?: string
  type: "electricity" | "rent" | "maintenance"
  month: number
  year: number
  status: "active" | "adjusted" | "refunded"
  created_at: string
}

export interface PaymentEntry {
  amount: number
  payment_date: string
  description?: string
}

export interface PartialPayment {
  id: string
  business_id: string
  month: number // 1-12 for rent month
  year: number // Year for rent period
  total_rent_amount: number // Total monthly rent amount
  payment_entries: PaymentEntry[] // Array of individual payment records
  total_paid_amount: number // Sum of all payments made
  description?: string // Optional description/notes
  status: "active" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}

export interface TermsCondition {
  id: string
  business_id: string | null  // Allow null for global terms
  title: string
  description: string
  effective_date: string
  created_at: string
}

export interface MeterReading {
  id: string
  business_id: string
  meter_type: "electricity" | "water" | "gas"
  reading_date: string
  previous_reading: number
  current_reading: number
  units_consumed: number
  rate_per_unit: number
  amount: number
  payment_status?: "pending" | "paid" | "overdue"
  bill_number?: string
  created_at: string
}

export interface MaintenanceBill {
  id: string
  business_id: string
  bill_number: string
  bill_date: string
  due_date: string
  description: string
  category: "cleaning" | "repair" | "general" | "emergency"
  amount: number
  status: "pending" | "paid" | "overdue" | "cancelled"
  created_at: string
  updated_at: string
}

export interface MaintenancePayment {
  id: string
  business_id: string
  maintenance_bill_id?: string
  payment_date: string
  amount: number
  payment_method: "cash" | "cheque" | "bank_transfer" | "upi" | "card"
  reference_number?: string
  notes?: string
  created_at: string
}

export interface MaintenanceAdvance {
  id: string
  business_id: string
  amount: number
  used_amount: number
  remaining_amount: number
  advance_date: string
  purpose?: string
  status: "active" | "used" | "refunded"
  created_at: string
}

export interface MaintenanceInstalment {
  id: string
  business_id: string
  total_amount: number
  instalment_amount: number // This is the partial payment amount per installment
  instalments_count: number // Number of partial payments planned
  instalments_paid: number // Number of partial payments completed
  start_date: string
  description?: string
  status: "active" | "completed" | "cancelled"
  created_at: string
}

export interface TC {
  id: string
  title: string
  description?: string
  effective_date: string
  created_at: string
}

export interface Information {
  id: string
  business_name: string
  logo_url?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  website?: string
  created_at: string
  updated_at: string
}

// Database operations class
export class DatabaseService {
  private getClient() {
    return createBrowserClient()
  }

  // Business operations
  async getBusinesses(): Promise<{ data: Business[] | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("businesses").select("*").order("created_at", { ascending: false })
  }

  async getBusiness(id: string): Promise<{ data: Business | null; error: any }> {
    const supabase = this.getClient()
    const result = await supabase.from("businesses").select("*").eq("id", id).single()
    return result
  }

  async createBusiness(
    business: Omit<Business, "id" | "created_at" | "updated_at">,
  ): Promise<{ data: Business | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("businesses").insert(business).select().single()
  }

  async updateBusiness(id: string, updates: Partial<Business>): Promise<{ data: Business | null; error: any }> {
    const supabase = this.getClient()
    return await supabase
      .from("businesses")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
  }

  async deleteBusiness(id: string): Promise<{ error: any }> {
    const supabase = this.getClient()
    return await supabase.from("businesses").delete().eq("id", id)
  }

  // Contact person operations
  async getContactPersons(businessId: string): Promise<{ data: ContactPerson[] | null; error: any }> {
    const supabase = this.getClient()
    return await supabase
      .from("contact_persons")
      .select("*")
      .eq("business_id", businessId)
      .order("is_primary", { ascending: false })
  }

  async createContactPerson(
    contactPerson: Omit<ContactPerson, "id" | "created_at">,
  ): Promise<{ data: ContactPerson | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("contact_persons").insert(contactPerson).select().single()
  }

  // Floor operations
  async getFloors(): Promise<{ data: Floor[] | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("floors").select("*").order("floor_number")
  }

  async createFloor(floor: Omit<Floor, "id" | "created_at">): Promise<{ data: Floor | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("floors").insert(floor).select().single()
  }

  async updateFloor(id: string, updates: Partial<Floor>): Promise<{ data: Floor | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("floors").update(updates).eq("id", id).select().single()
  }

  async deleteFloor(id: string): Promise<{ error: any }> {
    const supabase = this.getClient()
    return await supabase.from("floors").delete().eq("id", id)
  }

  // Bill operations
  async getBills(businessId?: string): Promise<{ data: Bill[] | null; error: any }> {
    const supabase = this.getClient()
    let query = supabase.from("bills").select("*")

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    return await query.order("bill_date", { ascending: false })
  }

  async createBill(bill: Omit<Bill, "id" | "created_at" | "updated_at">): Promise<{ data: Bill | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("bills").insert(bill).select().single()
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<{ data: Bill | null; error: any }> {
    const supabase = this.getClient()
    return await supabase
      .from("bills")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
  }

  async deleteBill(id: string): Promise<{ data: any; error: any }> {
    const supabase = this.getClient()
    return await supabase
      .from("bills")
      .delete()
      .eq("id", id)
  }

  // Payment operations
  async getPayments(businessId?: string): Promise<{ data: Payment[] | null; error: any }> {
    const supabase = this.getClient()
    let query = supabase.from("payments").select("*")

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    return await query.order("payment_date", { ascending: false })
  }

  async createPayment(payment: Omit<Payment, "id" | "created_at">): Promise<{ data: Payment | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("payments").insert(payment).select().single()
  }

  // Advance operations
  async getAdvances(businessId?: string): Promise<{ data: Advance[] | null; error: any }> {
    const supabase = this.getClient()
    let query = supabase.from("advances").select("*")

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    return await query.order("advance_date", { ascending: false })
  }

  async createAdvance(advance: Omit<Advance, "id" | "created_at">): Promise<{ data: Advance | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("advances").insert(advance).select().single()
  }

  async deleteAdvance(id: string): Promise<{ error: any }> {
    const supabase = this.getClient()
    return await supabase.from("advances").delete().eq("id", id)
  }

  async checkAdvanceExists(businessId: string, type: string, month: number, year: number): Promise<{ data: boolean; error: any }> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from("advances")
      .select("id")
      .eq("business_id", businessId)
      .eq("type", type)
      .eq("month", month)
      .eq("year", year)
      .eq("status", "active")
      .single()

    return { data: !!data, error: error?.code === 'PGRST116' ? null : error }
  }

  // Partial Payment operations
  async getPartialPayments(businessId?: string): Promise<{ data: PartialPayment[] | null; error: any }> {
    const supabase = this.getClient()
    
    // Try the new table first, fallback to old table if not migrated yet
    let query = supabase.from("partial_payments").select("*")
    
    if (businessId) {
      query = query.eq("business_id", businessId)
    }
    
    const result = await query.order("created_at", { ascending: false })
    
    // If partial_payments table doesn't exist, return empty array
    if (result.error && result.error.message?.includes('relation "partial_payments" does not exist')) {
      console.log('[v0] partial_payments table not found, returning empty array. Please run the migration script.')
      return { data: [], error: null }
    }
    
    return result
  }

  async createPartialPayment(
    partialPayment: Omit<PartialPayment, "id" | "created_at" | "updated_at">,
  ): Promise<{ data: PartialPayment | null; error: any }> {
    const supabase = this.getClient()
    const result = await supabase.from("partial_payments").insert(partialPayment).select().single()
    
    if (result.error && result.error.message?.includes('relation "partial_payments" does not exist')) {
      console.error('[v0] partial_payments table not found. Please run the migration script first.')
      return { data: null, error: { message: 'Database not migrated. Please run the migration script.' } }
    }
    
    return result
  }

  async updatePartialPayment(id: string, updates: Partial<PartialPayment>): Promise<{ data: PartialPayment | null; error: any }> {
    const supabase = this.getClient()
    return await supabase
      .from("partial_payments")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
  }

  async deletePartialPayment(id: string): Promise<{ error: any }> {
    const supabase = this.getClient()
    return await supabase.from("partial_payments").delete().eq("id", id)
  }

  async checkPartialPaymentExists(businessId: string, month: number, year: number): Promise<{ data: boolean; error: any }> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from("partial_payments")
      .select("id")
      .eq("business_id", businessId)
      .eq("month", month)
      .eq("year", year)
      .eq("status", "active")
      .single()

    // If table doesn't exist, return false (no records exist)
    if (error && error.message?.includes('relation "partial_payments" does not exist')) {
      return { data: false, error: null }
    }

    return { data: !!data, error: error?.code === 'PGRST116' ? null : error }
  }

  // Terms and conditions operations
  async getTermsConditions(): Promise<{ data: TermsCondition[] | null; error: any }> {
    const supabase = this.getClient()
    const query = supabase.from("terms_conditions").select("*")
    return await query.order("effective_date", { ascending: false })
  }

  async createTermsCondition(
    termsCondition: Omit<TermsCondition, "id" | "created_at">,
  ): Promise<{ data: TermsCondition | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("terms_conditions").insert(termsCondition).select().single()
  }

  async updateTermsCondition(id: string, updates: Partial<TermsCondition>): Promise<{ data: TermsCondition | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("terms_conditions").update(updates).eq("id", id).select().single()
  }

  async deleteTermsCondition(id: string): Promise<{ error: any }> {
    const supabase = this.getClient()
    return await supabase.from("terms_conditions").delete().eq("id", id)
  }

  // Meter reading operations
  async getMeterReadings(businessId?: string): Promise<{ data: MeterReading[] | null; error: any }> {
    const supabase = this.getClient()
    let query = supabase.from("meter_readings").select("*")

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    return await query.order("reading_date", { ascending: false })
  }

  async createMeterReading(
    meterReading: Omit<MeterReading, "id" | "created_at">,
  ): Promise<{ data: MeterReading | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("meter_readings").insert(meterReading).select().single()
  }

  async updateMeterReading(id: string, updates: Partial<MeterReading>): Promise<{ data: MeterReading | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("meter_readings").update(updates).eq("id", id).select().single()
  }

  async deleteMeterReading(id: string): Promise<{ error: any }> {
    const supabase = this.getClient()
    return await supabase.from("meter_readings").delete().eq("id", id)
  }

  // Maintenance bill operations
  async getMaintenanceBills(businessId?: string): Promise<{ data: MaintenanceBill[] | null; error: any }> {
    const supabase = this.getClient()
    let query = supabase.from("maintenance_bills").select("*")

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    return await query.order("bill_date", { ascending: false })
  }

  async createMaintenanceBill(
    bill: Omit<MaintenanceBill, "id" | "created_at" | "updated_at">,
  ): Promise<{ data: MaintenanceBill | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("maintenance_bills").insert(bill).select().single()
  }

  async updateMaintenanceBill(
    id: string,
    updates: Partial<MaintenanceBill>,
  ): Promise<{ data: MaintenanceBill | null; error: any }> {
    const supabase = this.getClient()
    return await supabase
      .from("maintenance_bills")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
  }

  async deleteMaintenanceBill(id: string): Promise<{ error: any }> {
    const supabase = this.getClient()
    return await supabase.from("maintenance_bills").delete().eq("id", id)
  }

  // Maintenance payment operations
  async getMaintenancePayments(businessId?: string): Promise<{ data: MaintenancePayment[] | null; error: any }> {
    const supabase = this.getClient()
    let query = supabase.from("maintenance_payments").select("*")

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    return await query.order("payment_date", { ascending: false })
  }

  async createMaintenancePayment(
    payment: Omit<MaintenancePayment, "id" | "created_at">,
  ): Promise<{ data: MaintenancePayment | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("maintenance_payments").insert(payment).select().single()
  }

  // Maintenance advance operations
  async getMaintenanceAdvances(businessId?: string): Promise<{ data: MaintenanceAdvance[] | null; error: any }> {
    const supabase = this.getClient()
    let query = supabase.from("maintenance_advances").select("*")

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    return await query.order("advance_date", { ascending: false })
  }

  async createMaintenanceAdvance(
    advance: Omit<MaintenanceAdvance, "id" | "created_at">,
  ): Promise<{ data: MaintenanceAdvance | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("maintenance_advances").insert(advance).select().single()
  }

  async updateMaintenanceAdvance(
    id: string,
    updates: Partial<MaintenanceAdvance>,
  ): Promise<{ data: MaintenanceAdvance | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("maintenance_advances").update(updates).eq("id", id).select().single()
  }

  async deleteMaintenanceAdvance(id: string): Promise<{ error: any }> {
    const supabase = this.getClient()
    return await supabase.from("maintenance_advances").delete().eq("id", id)
  }

  // Maintenance partial payment operations
  async getMaintenanceInstalments(businessId?: string): Promise<{ data: MaintenanceInstalment[] | null; error: any }> {
    const supabase = this.getClient()
    let query = supabase.from("maintenance_instalments").select("*")

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    return await query.order("start_date", { ascending: false })
  }

  async createMaintenanceInstalment(
    instalment: Omit<MaintenanceInstalment, "id" | "created_at">,
  ): Promise<{ data: MaintenanceInstalment | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("maintenance_instalments").insert(instalment).select().single()
  }

  async updateMaintenanceInstalment(
    id: string,
    updates: Partial<MaintenanceInstalment>,
  ): Promise<{ data: MaintenanceInstalment | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("maintenance_instalments").update(updates).eq("id", id).select().single()
  }

  // Information operations
  async getInformation(): Promise<{ data: Information | null; error: any }> {
    const supabase = this.getClient()
    const result = await supabase.from("information").select("*").single()
    return result
  }

  async createInformation(
    information: Omit<Information, "id" | "created_at" | "updated_at">,
  ): Promise<{ data: Information | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("information").insert(information).select().single()
  }

  async updateInformation(
    id: string,
    updates: Partial<Information>,
  ): Promise<{ data: Information | null; error: any }> {
    const supabase = this.getClient()
    return await supabase
      .from("information")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
  }

  async upsertInformation(
    information: Omit<Information, "id" | "created_at" | "updated_at">,
  ): Promise<{ data: Information | null; error: any }> {
    const supabase = this.getClient()
    return await supabase
      .from("information")
      .upsert(information, { onConflict: "business_name" })
      .select()
      .single()
  }

  // TC operations
  async getTCs(): Promise<{ data: TC[] | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("t_c").select("*").order("effective_date", { ascending: false })
  }

  async createTC(tc: Omit<TC, "id" | "created_at">): Promise<{ data: TC | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("t_c").insert(tc).select().single()
  }

  async updateTC(id: string, updates: Partial<TC>): Promise<{ data: TC | null; error: any }> {
    const supabase = this.getClient()
    return await supabase.from("t_c").update(updates).eq("id", id).select().single()
  }

  async deleteTC(id: string): Promise<{ error: any }> {
    const supabase = this.getClient()
    return await supabase.from("t_c").delete().eq("id", id)
  }
}

// Export singleton instance
export const clientDb = new DatabaseService()

// Convenience functions for easier usage in components
export async function getBusinesses() {
  const result = await clientDb.getBusinesses()
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function getBillsByBusinessId(businessId: string) {
  const result = await clientDb.getBills(businessId)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function getFloors() {
  const result = await clientDb.getFloors()
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function createBusiness(business: Omit<Business, "id" | "created_at" | "updated_at">) {
  const result = await clientDb.createBusiness(business)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function createFloor(floor: Omit<Floor, "id" | "created_at">) {
  const result = await clientDb.createFloor(floor)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function updateFloor(id: string, updates: Partial<Floor>) {
  const result = await clientDb.updateFloor(id, updates)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function createMeterReading(meterReading: Omit<MeterReading, "id" | "created_at">) {
  const result = await clientDb.createMeterReading(meterReading)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function createBill(bill: Omit<Bill, "id" | "created_at" | "updated_at">) {
  const result = await clientDb.createBill(bill)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function getPayments(businessId?: string) {
  const result = await clientDb.getPayments(businessId)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function createPayment(payment: Omit<Payment, "id" | "created_at">) {
  const result = await clientDb.createPayment(payment)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function getAdvances(businessId?: string) {
  const result = await clientDb.getAdvances(businessId)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function getPartialPayments(businessId?: string) {
  const result = await clientDb.getPartialPayments(businessId)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function deleteAdvance(id: string) {
  const result = await clientDb.deleteAdvance(id)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result
}

export async function checkAdvanceExists(businessId: string, type: string, month: number, year: number) {
  const result = await clientDb.checkAdvanceExists(businessId, type, month, year)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function deleteFloor(id: string) {
  const result = await clientDb.deleteFloor(id)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result
}

export async function getBills(businessId?: string) {
  const result = await clientDb.getBills(businessId)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function updateBill(id: string, updates: Partial<Bill>) {
  const result = await clientDb.updateBill(id, updates)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function deleteBill(id: string) {
  const result = await clientDb.deleteBill(id)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

// Comprehensive reporting functions
export async function getCustomerReports() {
  try {
    const businesses = await clientDb.getBusinesses()
    const floors = await clientDb.getFloors()

    const total = businesses.data ? businesses.data.length : 0
    const active = businesses.data ? businesses.data.filter((b) => b.status === "active").length : 0
    const inactive = businesses.data ? businesses.data.filter((b) => b.status !== "active").length : 0

    const byFloor = floors.data
      ? floors.data.map((floor) => ({
        floor: floor.floor_name,
        count: businesses.data ? businesses.data.filter((b) => b.floor_number === floor.floor_number).length : 0,
      }))
      : []

    return {
      total,
      active,
      inactive,
      byFloor,
    }
  } catch (error) {
    console.error("Error getting customer reports:", error)
    throw error
  }
}

export async function getBillReports() {
  try {
    // Get regular bills (rent/electricity)
    const billsResult = await clientDb.getBills()
    const bills = billsResult.data || []

    // Get maintenance bills
    const maintenanceBillsResult = await clientDb.getMaintenanceBills()
    const maintenanceBills = maintenanceBillsResult.data || []

    const electricityBills = bills.filter((b) => b.electricity_charges > 0)

    const maintenance = {
      total: maintenanceBills.length,
      paid: maintenanceBills.filter((b) => b.status === "paid").length,
      unpaid: maintenanceBills.filter((b) => b.status !== "paid").length,
      amount: maintenanceBills.reduce((sum, b) => sum + (b.amount || 0), 0),
    }

    const electricity = {
      total: electricityBills.length,
      paid: electricityBills.filter((b) => b.status === "paid").length,
      unpaid: electricityBills.filter((b) => b.status !== "paid").length,
      amount: electricityBills.reduce((sum, b) => sum + (b.total_amount || 0), 0),
    }

    // Combined totals (rent + maintenance)
    const combined = {
      total: bills.length + maintenanceBills.length,
      paid: bills.filter((b) => b.status === "paid").length + maintenanceBills.filter((b) => b.status === "paid").length,
      unpaid: bills.filter((b) => b.status !== "paid").length + maintenanceBills.filter((b) => b.status !== "paid").length,
      amount: bills.reduce((sum, b) => sum + (b.total_amount || 0), 0) + maintenanceBills.reduce((sum, b) => sum + (b.amount || 0), 0),
    }

    return {
      electricity,
      maintenance,
      combined,
    }
  } catch (error) {
    console.error("Error getting bill reports:", error)
    throw error
  }
}

export async function getPaymentReports() {
  try {
    // Get regular payments (rent)
    const paymentsResult = await clientDb.getPayments()
    const payments = paymentsResult.data || []

    // Get maintenance payments
    const maintenancePaymentsResult = await clientDb.getMaintenancePayments()
    const maintenancePayments = maintenancePaymentsResult.data || []

    const currentMonth = new Date().getMonth()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const currentYear = new Date().getFullYear()

    // Calculate total collected (rent + maintenance)
    const rentCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const maintenanceCollected = maintenancePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalCollected = rentCollected + maintenanceCollected

    // Calculate this month's collections (rent + maintenance)
    const thisMonthRent = payments
      .filter((p) => {
        const paymentDate = new Date(p.payment_date)
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const thisMonthMaintenance = maintenancePayments
      .filter((p) => {
        const paymentDate = new Date(p.payment_date)
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const thisMonth = thisMonthRent + thisMonthMaintenance

    // Calculate last month's collections (rent + maintenance)
    const lastMonthRent = payments
      .filter((p) => {
        const paymentDate = new Date(p.payment_date)
        const year = lastMonth === 11 ? currentYear - 1 : currentYear
        return paymentDate.getMonth() === lastMonth && paymentDate.getFullYear() === year
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const lastMonthMaintenanceAmount = maintenancePayments
      .filter((p) => {
        const paymentDate = new Date(p.payment_date)
        const year = lastMonth === 11 ? currentYear - 1 : currentYear
        return paymentDate.getMonth() === lastMonth && paymentDate.getFullYear() === year
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const lastMonthAmount = lastMonthRent + lastMonthMaintenanceAmount

    // Combine payment methods from both rent and maintenance payments
    const allPayments = [...payments, ...maintenancePayments]

    const byMethod = [
      {
        method: "Cash",
        amount: allPayments.filter((p) => p.payment_method === "cash").reduce((sum, p) => sum + (p.amount || 0), 0),
        count: allPayments.filter((p) => p.payment_method === "cash").length,
      },
      {
        method: "UPI",
        amount: allPayments.filter((p) => p.payment_method === "upi").reduce((sum, p) => sum + (p.amount || 0), 0),
        count: allPayments.filter((p) => p.payment_method === "upi").length,
      },
      {
        method: "Card",
        amount: allPayments.filter((p) => p.payment_method === "card").reduce((sum, p) => sum + (p.amount || 0), 0),
        count: allPayments.filter((p) => p.payment_method === "card").length,
      },
      {
        method: "Bank Transfer",
        amount: allPayments
          .filter((p) => p.payment_method === "bank_transfer")
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        count: allPayments.filter((p) => p.payment_method === "bank_transfer").length,
      },
    ]

    return {
      totalCollected,
      thisMonth,
      lastMonth: lastMonthAmount,
      byMethod,
    }
  } catch (error) {
    console.error("Error getting payment reports:", error)
    throw error
  }
}

export async function getFinancialReports() {
  try {
    // Get regular rent payments and bills
    const paymentsResult = await clientDb.getPayments()
    const payments = paymentsResult.data || []
    const billsResult = await clientDb.getBills()
    const bills = billsResult.data || []
    const advancesResult = await clientDb.getAdvances()
    const advances = advancesResult.data || []

    // Get maintenance payments and bills
    const maintenancePaymentsResult = await clientDb.getMaintenancePayments()
    const maintenancePayments = maintenancePaymentsResult.data || []
    const maintenanceBillsResult = await clientDb.getMaintenanceBills()
    const maintenanceBills = maintenanceBillsResult.data || []

    // Calculate total revenue (rent + maintenance)
    const rentRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const maintenanceRevenue = maintenancePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const revenue = rentRevenue + maintenanceRevenue

    // Calculate total outstanding (rent + maintenance)
    const rentOutstanding = bills.filter((b) => b.status !== "paid").reduce((sum, b) => sum + (b.total_amount || 0), 0)
    const maintenanceOutstanding = maintenanceBills.filter((b) => b.status !== "paid").reduce((sum, b) => sum + (b.amount || 0), 0)
    const outstanding = rentOutstanding + maintenanceOutstanding

    const advancesAmount = advances.filter((a) => a.status === "active").reduce((sum, a) => sum + (a.amount || 0), 0)

    // Generate monthly trend for last 6 months
    const monthlyTrend = []
    const currentDate = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const month = date.toLocaleDateString("en-US", { month: "short" })

      // Calculate rent revenue for the month
      const monthRentRevenue = payments
        .filter((p) => {
          const paymentDate = new Date(p.payment_date)
          return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear()
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0)

      // Calculate maintenance revenue for the month
      const monthMaintenanceRevenue = maintenancePayments
        .filter((p) => {
          const paymentDate = new Date(p.payment_date)
          return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear()
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0)

      // Total revenue for the month
      const monthRevenue = monthRentRevenue + monthMaintenanceRevenue

      // Calculate rent outstanding for the month
      const monthRentOutstanding = bills
        .filter((b) => {
          const billDate = new Date(b.bill_date)
          return (
            billDate.getMonth() === date.getMonth() &&
            billDate.getFullYear() === date.getFullYear() &&
            b.status !== "paid"
          )
        })
        .reduce((sum, b) => sum + (b.total_amount || 0), 0)

      // Calculate maintenance outstanding for the month
      const monthMaintenanceOutstanding = maintenanceBills
        .filter((b) => {
          const billDate = new Date(b.bill_date)
          return (
            billDate.getMonth() === date.getMonth() &&
            billDate.getFullYear() === date.getFullYear() &&
            b.status !== "paid"
          )
        })
        .reduce((sum, b) => sum + (b.amount || 0), 0)

      // Total outstanding for the month
      const monthOutstanding = monthRentOutstanding + monthMaintenanceOutstanding

      monthlyTrend.push({
        month,
        revenue: monthRevenue,
        outstanding: monthOutstanding,
      })
    }

    return {
      revenue,
      outstanding,
      advances: advancesAmount,
      monthlyTrend,
    }
  } catch (error) {
    console.error("Error getting financial reports:", error)
    throw error
  }
}

export async function getAllReportsData() {
  try {
    const [customers, bills, payments, financial] = await Promise.all([
      getCustomerReports(),
      getBillReports(),
      getPaymentReports(),
      getFinancialReports(),
    ])

    return {
      customers,
      bills,
      payments,
      financial,
    }
  } catch (error) {
    console.error("Error getting all reports data:", error)
    throw error
  }
}

// Revenue insights functions
export async function getRevenueByMonth() {
  try {
    // Get all bills (for total counts)
    const billsResult = await clientDb.getBills()
    const allBills = billsResult.data || []

    // Get all maintenance bills (for total counts)
    const maintenanceBillsResult = await clientDb.getMaintenanceBills()
    const allMaintenanceBills = maintenanceBillsResult.data || []

    // Get meter readings for gas charges
    const meterReadingsResult = await clientDb.getMeterReadings()
    const meterReadings = meterReadingsResult.data || []
    const gasReadings = meterReadings.filter(reading => reading.meter_type === 'gas')

    // Build monthly data for the past 12 months
    const monthlyData = []
    const currentDate = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const month = date.toLocaleDateString("en-US", { month: "short" })
      const year = date.getFullYear()
      const monthKey = `${month}`

      // Filter PAID bills for this month only (for revenue calculation)
      const monthPaidBills = allBills.filter(bill => {
        const billDate = new Date(bill.bill_date)
        return billDate.getMonth() === date.getMonth() && 
               billDate.getFullYear() === date.getFullYear() &&
               bill.status === 'paid'
      })

      // Filter PAID maintenance bills for this month only (for revenue calculation)
      const monthPaidMaintenanceBills = allMaintenanceBills.filter(bill => {
        const billDate = new Date(bill.bill_date)
        return billDate.getMonth() === date.getMonth() && 
               billDate.getFullYear() === date.getFullYear() &&
               bill.status === 'paid'
      })

      // Filter ALL bills for this month (for total count)
      const monthAllBills = allBills.filter(bill => {
        const billDate = new Date(bill.bill_date)
        return billDate.getMonth() === date.getMonth() && billDate.getFullYear() === date.getFullYear()
      })

      // Filter ALL maintenance bills for this month (for total count)
      const monthAllMaintenanceBills = allMaintenanceBills.filter(bill => {
        const billDate = new Date(bill.bill_date)
        return billDate.getMonth() === date.getMonth() && billDate.getFullYear() === date.getFullYear()
      })

      // Filter gas readings for this month
      const monthGasReadings = gasReadings.filter(reading => {
        const readingDate = new Date(reading.reading_date)
        return readingDate.getMonth() === date.getMonth() && readingDate.getFullYear() === date.getFullYear()
      })

      // Calculate revenue components (only from PAID bills)
      const rentAmount = monthPaidBills.reduce((sum, bill) => sum + (bill.rent_amount || 0), 0)
      // Calculate electricity amount from bills and meter readings
      const electricityFromBills = monthPaidBills.reduce((sum, bill) => {
        if (bill.bill_number && bill.bill_number.startsWith('ELE')) {
          return sum + ((bill.electricity_charges || 0) || (bill.total_amount || 0))
        }
        return sum + (bill.electricity_charges || 0)
      }, 0)
      
      // Add electricity from meter readings for this month (PAID only)
      const monthElectricityReadings = meterReadings.filter(reading => {
        const readingDate = new Date(reading.reading_date)
        return readingDate.getMonth() === date.getMonth() && 
               readingDate.getFullYear() === date.getFullYear() &&
               reading.meter_type === 'electricity' && 
               (reading.payment_status === 'paid')
      })
      const electricityFromMeterReadings = monthElectricityReadings.reduce((sum, reading) => sum + (reading.amount || 0), 0)
      
      const electricityAmount = electricityFromBills + electricityFromMeterReadings
      // For maintenance: only count maintenance_charges for non-rent bills + standalone maintenance bills
      const maintenanceFromBills = monthPaidBills.reduce((sum, bill) => {
        // Skip maintenance_charges for rent bills (they store rent amount there incorrectly)
        if (bill.bill_number && bill.bill_number.startsWith('RENT')) {
          return sum
        }
        return sum + (bill.maintenance_charges || 0)
      }, 0)
      const maintenanceFromStandalone = monthPaidMaintenanceBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
      const maintenanceAmount = maintenanceFromBills + maintenanceFromStandalone
      const gasAmount = monthPaidBills.reduce((sum, bill) => sum + (bill.gas_charges || 0), 0) +
                      monthGasReadings.reduce((sum, reading) => sum + (reading.amount || 0), 0)

      // Calculate UNPAID amounts by component
      const monthUnpaidBills = allBills.filter(bill => {
        const billDate = new Date(bill.bill_date)
        return billDate.getMonth() === date.getMonth() && 
               billDate.getFullYear() === date.getFullYear() &&
               bill.status !== 'paid'
      })

      const monthUnpaidMaintenanceBills = allMaintenanceBills.filter(bill => {
        const billDate = new Date(bill.bill_date)
        return billDate.getMonth() === date.getMonth() && 
               billDate.getFullYear() === date.getFullYear() &&
               bill.status !== 'paid'
      })

      const unpaidRentAmount = monthUnpaidBills.reduce((sum, bill) => sum + (bill.rent_amount || 0), 0)
      // Calculate unpaid electricity from bills and meter readings
      const unpaidElectricityFromBills = monthUnpaidBills.reduce((sum, bill) => {
        if (bill.bill_number && bill.bill_number.startsWith('ELE')) {
          return sum + ((bill.electricity_charges || 0) || (bill.total_amount || 0))
        }
        return sum + (bill.electricity_charges || 0)
      }, 0)
      
      // Add unpaid electricity from meter readings for this month (payment status not paid)
      const monthUnpaidElectricityReadings = meterReadings.filter(reading => {
        const readingDate = new Date(reading.reading_date)
        return readingDate.getMonth() === date.getMonth() && 
               readingDate.getFullYear() === date.getFullYear() &&
               reading.meter_type === 'electricity' && 
               (reading.payment_status !== 'paid')
      })
      const unpaidElectricityFromMeterReadings = monthUnpaidElectricityReadings.reduce((sum, reading) => sum + (reading.amount || 0), 0)
      
      const unpaidElectricityAmount = unpaidElectricityFromBills + unpaidElectricityFromMeterReadings
      const unpaidMaintenanceFromBills = monthUnpaidBills.reduce((sum, bill) => {
        if (bill.bill_number && bill.bill_number.startsWith('RENT')) {
          return sum
        }
        return sum + (bill.maintenance_charges || 0)
      }, 0)
      const unpaidMaintenanceFromStandalone = monthUnpaidMaintenanceBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
      const unpaidMaintenanceAmount = unpaidMaintenanceFromBills + unpaidMaintenanceFromStandalone
      const unpaidGasAmount = monthUnpaidBills.reduce((sum, bill) => sum + (bill.gas_charges || 0), 0)
      const totalAmount = rentAmount + electricityAmount + maintenanceAmount + gasAmount

      // Count PAID bills by component (for revenue tracking)
      const rentBillsCount = monthPaidBills.filter(bill => bill.bill_number && bill.bill_number.startsWith('RENT')).length
      const electricityBillsFromRegularBills = monthPaidBills.filter(bill => 
        (bill.bill_number && bill.bill_number.startsWith('ELE')) || 
        (bill.electricity_charges > 0 && (!bill.bill_number || !bill.bill_number.startsWith('RENT')))
      ).length
      const electricityBillsFromMeterReadings = monthElectricityReadings.length
      const electricityBillsCount = electricityBillsFromRegularBills + electricityBillsFromMeterReadings
      const gasBillsCount = monthPaidBills.filter(bill => bill.gas_charges > 0).length + monthGasReadings.length
      const maintenanceBillsCount = monthPaidBills.filter(bill => bill.maintenance_charges > 0 && (!bill.bill_number || !bill.bill_number.startsWith('RENT'))).length + monthPaidMaintenanceBills.length
      
      // Count UNPAID bills by component
      const unpaidRentBillsCount = monthUnpaidBills.filter(bill => bill.bill_number && bill.bill_number.startsWith('RENT')).length
      const unpaidElectricityBillsFromRegularBills = monthUnpaidBills.filter(bill => 
        (bill.bill_number && bill.bill_number.startsWith('ELE')) || 
        (bill.electricity_charges > 0 && (!bill.bill_number || !bill.bill_number.startsWith('RENT')))
      ).length
      const unpaidElectricityBillsFromMeterReadings = monthUnpaidElectricityReadings.length
      const unpaidElectricityBillsCount = unpaidElectricityBillsFromRegularBills + unpaidElectricityBillsFromMeterReadings
      const unpaidGasBillsCount = monthUnpaidBills.filter(bill => bill.gas_charges > 0).length
      const unpaidMaintenanceBillsCount = monthUnpaidBills.filter(bill => bill.maintenance_charges > 0 && (!bill.bill_number || !bill.bill_number.startsWith('RENT'))).length + monthUnpaidMaintenanceBills.length
      
      // Total bills generated (all bills - paid + unpaid)
      const totalBillsGenerated = monthAllBills.length + monthAllMaintenanceBills.length

      monthlyData.push({
        month: monthKey,
        shortMonth: month,
        fullDate: date,
        revenue: totalAmount,
        rent: rentAmount,
        electricity: electricityAmount,
        maintenance: maintenanceAmount,
        gas: gasAmount,
        billsGenerated: totalBillsGenerated,
        billCounts: {
          rent: rentBillsCount,
          electricity: electricityBillsCount,
          gas: gasBillsCount,
          maintenance: maintenanceBillsCount
        },
        unpaidAmounts: {
          rent: unpaidRentAmount,
          electricity: unpaidElectricityAmount,
          maintenance: unpaidMaintenanceAmount,
          gas: unpaidGasAmount
        },
        unpaidBillCounts: {
          rent: unpaidRentBillsCount,
          electricity: unpaidElectricityBillsCount,
          gas: unpaidGasBillsCount,
          maintenance: unpaidMaintenanceBillsCount
        }
      })
    }

    return monthlyData
  } catch (error) {
    console.error("Error getting revenue by month:", error)
    throw error
  }
}

export async function getRevenueStats() {
  try {
    // Get all PAID bills only for revenue calculation
    const billsResult = await clientDb.getBills()
    const allBills = billsResult.data || []
    const bills = allBills.filter(bill => bill.status === 'paid')
    
    // Get PAID maintenance bills only
    const maintenanceBillsResult = await clientDb.getMaintenanceBills()
    const allMaintenanceBills = maintenanceBillsResult.data || []
    const maintenanceBills = allMaintenanceBills.filter(bill => bill.status === 'paid')

    // Get all meter readings (electricity, gas, water)
    const meterReadingsResult = await clientDb.getMeterReadings()
    const meterReadings = meterReadingsResult.data || []
    
    console.log('All paid bills:', bills.length)
    console.log('All meter readings:', meterReadings.length)
    const gasReadings = meterReadings.filter(reading => reading.meter_type === 'gas')
    const electricityReadings = meterReadings.filter(reading => reading.meter_type === 'electricity')

    // Calculate total revenue by component (PAID bills only)
    const totalRent = bills.reduce((sum, bill) => sum + (bill.rent_amount || 0), 0)
    // Calculate electricity revenue from both bills and meter readings
    const electricityFromBills = bills.reduce((sum, bill) => {
      if (bill.bill_number && bill.bill_number.startsWith('ELE')) {
        return sum + ((bill.electricity_charges || 0) || (bill.total_amount || 0))
      }
      return sum + (bill.electricity_charges || 0)
    }, 0)
    
    // Add electricity revenue from meter readings (PAID readings only)
    const electricityFromMeterReadings = meterReadings.reduce((sum, reading) => {
      if (reading.meter_type === 'electricity' && reading.payment_status === 'paid' && (reading.amount || 0) > 0) {
        console.log('PAID electricity meter reading:', {
          id: reading.id,
          business_id: reading.business_id,
          amount: reading.amount,
          units_consumed: reading.units_consumed,
          rate_per_unit: reading.rate_per_unit,
          reading_date: reading.reading_date
        })
        return sum + (reading.amount || 0)
      }
      return sum
    }, 0)
    
    const totalElectricity = electricityFromBills + electricityFromMeterReadings
    
    console.log('Electricity calculation:', {
      electricityFromBills,
      electricityFromMeterReadings,
      totalElectricity,
      meterReadings: meterReadings.filter(r => r.meter_type === 'electricity')
    })
    // For maintenance: only count maintenance_charges for non-rent bills + standalone maintenance bills
    const maintenanceFromBills = bills.reduce((sum, bill) => {
      // Skip maintenance_charges for rent bills (they store rent amount there incorrectly)
      if (bill.bill_number && bill.bill_number.startsWith('RENT')) {
        return sum
      }
      return sum + (bill.maintenance_charges || 0)
    }, 0)
    const maintenanceFromStandalone = maintenanceBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
    const totalMaintenance = maintenanceFromBills + maintenanceFromStandalone
    const totalGas = bills.reduce((sum, bill) => sum + (bill.gas_charges || 0), 0) +
                   gasReadings.reduce((sum, reading) => sum + (reading.amount || 0), 0)

    // Calculate UNPAID amounts by component
    const unpaidBills = allBills.filter(bill => bill.status !== 'paid')
    const unpaidMaintenanceBills = allMaintenanceBills.filter(bill => bill.status !== 'paid')

    const totalUnpaidRent = unpaidBills.reduce((sum, bill) => sum + (bill.rent_amount || 0), 0)
    // Calculate unpaid electricity from both bills and meter readings
    const unpaidElectricityFromBills = unpaidBills.reduce((sum, bill) => {
      if (bill.bill_number && bill.bill_number.startsWith('ELE')) {
        return sum + ((bill.electricity_charges || 0) || (bill.total_amount || 0))
      }
      return sum + (bill.electricity_charges || 0)
    }, 0)
    
    // Add unpaid electricity from meter readings (payment status not paid)
    const unpaidElectricityFromMeterReadings = meterReadings.reduce((sum, reading) => {
      if (reading.meter_type === 'electricity' && reading.payment_status !== 'paid') {
        console.log('UNPAID electricity meter reading:', {
          id: reading.id,
          business_id: reading.business_id,
          amount: reading.amount,
          units_consumed: reading.units_consumed,
          rate_per_unit: reading.rate_per_unit,
          reading_date: reading.reading_date
        })
        return sum + (reading.amount || 0)
      }
      return sum
    }, 0)
    
    const totalUnpaidElectricity = unpaidElectricityFromBills + unpaidElectricityFromMeterReadings
    const unpaidMaintenanceFromBills = unpaidBills.reduce((sum, bill) => {
      if (bill.bill_number && bill.bill_number.startsWith('RENT')) {
        return sum
      }
      return sum + (bill.maintenance_charges || 0)
    }, 0)
    const unpaidMaintenanceFromStandalone = unpaidMaintenanceBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
    const totalUnpaidMaintenance = unpaidMaintenanceFromBills + unpaidMaintenanceFromStandalone
    const totalUnpaidGas = unpaidBills.reduce((sum, bill) => sum + (bill.gas_charges || 0), 0)
    
    // Total revenue
    const totalRevenue = totalRent + totalElectricity + totalMaintenance + totalGas

    // Count PAID bills by component (for revenue tracking)
    const rentBillsCount = bills.filter(bill => bill.bill_number && bill.bill_number.startsWith('RENT')).length
    const electricityBillsFromRegularBills = bills.filter(bill => 
      (bill.bill_number && bill.bill_number.startsWith('ELE')) || 
      (bill.electricity_charges > 0 && (!bill.bill_number || !bill.bill_number.startsWith('RENT')))
    ).length
    const electricityBillsFromMeterReadings = meterReadings.filter(reading => 
      reading.meter_type === 'electricity' && reading.payment_status === 'paid' && (reading.amount || 0) > 0
    ).length
    const electricityBillsCount = electricityBillsFromRegularBills + electricityBillsFromMeterReadings
    
    console.log('Electricity bill counts:', {
      electricityBillsFromRegularBills,
      electricityBillsFromMeterReadings,
      electricityBillsCount
    })
    const gasBillsCount = bills.filter(bill => bill.gas_charges > 0).length + gasReadings.length
    const maintenanceBillsCount = bills.filter(bill => bill.maintenance_charges > 0 && (!bill.bill_number || !bill.bill_number.startsWith('RENT'))).length + maintenanceBills.length
    
    // Count UNPAID bills by component
    const unpaidRentBillsCount = unpaidBills.filter(bill => bill.bill_number && bill.bill_number.startsWith('RENT')).length
    const unpaidElectricityBillsFromRegularBills = unpaidBills.filter(bill => 
      (bill.bill_number && bill.bill_number.startsWith('ELE')) || 
      (bill.electricity_charges > 0 && (!bill.bill_number || !bill.bill_number.startsWith('RENT')))
    ).length
    const unpaidElectricityBillsFromMeterReadings = meterReadings.filter(reading => 
      reading.meter_type === 'electricity' && reading.payment_status !== 'paid'
    ).length
    const unpaidElectricityBillsCount = unpaidElectricityBillsFromRegularBills + unpaidElectricityBillsFromMeterReadings
    
    console.log('Unpaid electricity bill counts:', {
      unpaidElectricityBillsFromRegularBills,
      unpaidElectricityBillsFromMeterReadings,
      unpaidElectricityBillsCount
    })
    const unpaidGasBillsCount = unpaidBills.filter(bill => bill.gas_charges > 0).length
    const unpaidMaintenanceBillsCount = unpaidBills.filter(bill => bill.maintenance_charges > 0 && (!bill.bill_number || !bill.bill_number.startsWith('RENT'))).length + unpaidMaintenanceBills.length
    
    // Total bills generated (all bills - paid + unpaid)
    const totalBillsGenerated = allBills.length + allMaintenanceBills.length

    return {
      totalRevenue,
      revenueByComponent: {
        rent: totalRent,
        electricity: totalElectricity,
        maintenance: totalMaintenance,
        gas: totalGas
      },
      unpaidByComponent: {
        rent: totalUnpaidRent,
        electricity: totalUnpaidElectricity,
        maintenance: totalUnpaidMaintenance,
        gas: totalUnpaidGas
      },
      totalBillsGenerated,
      billCountsByComponent: {
        rent: rentBillsCount,
        electricity: electricityBillsCount,
        gas: gasBillsCount,
        maintenance: maintenanceBillsCount
      },
      unpaidBillCountsByComponent: {
        rent: unpaidRentBillsCount,
        electricity: unpaidElectricityBillsCount,
        gas: unpaidGasBillsCount,
        maintenance: unpaidMaintenanceBillsCount
      }
    }
  } catch (error) {
    console.error("Error getting revenue stats:", error)
    throw error
  }
}

// Maintenance convenience functions
export async function getMaintenanceBills(businessId?: string) {
  const result = await clientDb.getMaintenanceBills(businessId)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function createMaintenanceBill(bill: Omit<MaintenanceBill, "id" | "created_at" | "updated_at">) {
  const result = await clientDb.createMaintenanceBill(bill)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function updateMaintenanceBill(id: string, updates: Partial<MaintenanceBill>) {
  const result = await clientDb.updateMaintenanceBill(id, updates)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function getMaintenancePayments(businessId?: string) {
  const result = await clientDb.getMaintenancePayments(businessId)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function createMaintenancePayment(payment: Omit<MaintenancePayment, "id" | "created_at">) {
  const result = await clientDb.createMaintenancePayment(payment)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function getMaintenanceAdvances(businessId?: string) {
  const result = await clientDb.getMaintenanceAdvances(businessId)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function createMaintenanceAdvance(advance: Omit<MaintenanceAdvance, "id" | "created_at">) {
  const result = await clientDb.createMaintenanceAdvance(advance)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function updateMaintenanceAdvance(id: string, updates: Partial<MaintenanceAdvance>) {
  const result = await clientDb.updateMaintenanceAdvance(id, updates)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function getMaintenanceInstalments(businessId?: string) {
  const result = await clientDb.getMaintenanceInstalments(businessId)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function createMaintenanceInstalment(instalment: Omit<MaintenanceInstalment, "id" | "created_at">) {
  const result = await clientDb.createMaintenanceInstalment(instalment)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function updateMaintenanceInstalment(id: string, updates: Partial<MaintenanceInstalment>) {
  const result = await clientDb.updateMaintenanceInstalment(id, updates)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function getInformation() {
  const result = await clientDb.getInformation()
  if (result.error && result.error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    throw new Error(result.error.message)
  }
  return result.data
}

export async function createInformation(information: Omit<Information, "id" | "created_at" | "updated_at">) {
  const result = await clientDb.createInformation(information)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function updateInformation(id: string, updates: Partial<Information>) {
  const result = await clientDb.updateInformation(id, updates)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function upsertInformation(information: Omit<Information, "id" | "created_at" | "updated_at">) {
  const result = await clientDb.upsertInformation(information)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function deleteMaintenanceAdvance(id: string) {
  const result = await clientDb.deleteMaintenanceAdvance(id)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result
}

// Meter Reading convenience functions
export async function getMeterReadings(businessId?: string) {
  const result = await clientDb.getMeterReadings(businessId)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function updateMeterReading(id: string, updates: Partial<MeterReading>) {
  const result = await clientDb.updateMeterReading(id, updates)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

// Terms and Conditions convenience functions
export async function getTermsConditions() {
  const result = await clientDb.getTermsConditions()
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function createTermsCondition(termsCondition: Omit<TermsCondition, "id" | "created_at">) {
  const result = await clientDb.createTermsCondition(termsCondition)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function updateTermsCondition(id: string, updates: Partial<TermsCondition>) {
  const result = await clientDb.updateTermsCondition(id, updates)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function deleteTermsCondition(id: string) {
  const result = await clientDb.deleteTermsCondition(id)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

// TC convenience functions
export async function getTCs() {
  const result = await clientDb.getTCs()
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data || []
}

export async function createTC(tc: Omit<TC, "id" | "created_at">) {
  const result = await clientDb.createTC(tc)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function updateTC(id: string, updates: Partial<TC>) {
  const result = await clientDb.updateTC(id, updates)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function deleteTC(id: string) {
  const result = await clientDb.deleteTC(id)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result
}

// Enhanced Partial Payment convenience functions
export async function createPartialPayment(partialPayment: Omit<PartialPayment, "id" | "created_at" | "updated_at">) {
  const result = await clientDb.createPartialPayment(partialPayment)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function updatePartialPayment(id: string, updates: Partial<PartialPayment>) {
  const result = await clientDb.updatePartialPayment(id, updates)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function deletePartialPayment(id: string) {
  const result = await clientDb.deletePartialPayment(id)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result
}

export async function checkPartialPaymentExists(businessId: string, month: number, year: number) {
  const result = await clientDb.checkPartialPaymentExists(businessId, month, year)
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}
