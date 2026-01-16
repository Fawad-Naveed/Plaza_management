import { NextRequest, NextResponse } from 'next/server'
import { clientDb } from '@/lib/database'
import { logActivity, ACTION_TYPES } from '@/lib/activity-logger'

/**
 * API route to automatically generate rent bills based on the configured generation day
 * This endpoint should be called daily by a cron service
 * 
 * Can be triggered:
 * 1. By external cron service (e.g., cron-job.org, EasyCron)
 * 2. By Vercel Cron (if using vercel.json configuration)
 * 3. Manually from admin dashboard
 * 
 * Authentication: Uses a secret token to prevent unauthorized access
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (using a secret token)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // In production, require authentication
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const today = new Date()
    const currentDay = today.getDate()

    // Get business information to check the configured generation day
    const { getInformation } = await import('@/lib/database')
    const businessInfo = await getInformation()

    if (!businessInfo?.rent_bill_generation_day) {
      return NextResponse.json(
        { 
          message: 'No rent bill generation day configured',
          generated: 0
        },
        { status: 200 }
      )
    }

    // Check if today is the configured generation day
    if (currentDay !== businessInfo.rent_bill_generation_day) {
      return NextResponse.json(
        { 
          message: `Today is not the generation day. Bills will be generated on day ${businessInfo.rent_bill_generation_day} of the month`,
          currentDay,
          configuredDay: businessInfo.rent_bill_generation_day,
          generated: 0
        },
        { status: 200 }
      )
    }

    // Get all businesses with rent management enabled
    const businessesResult = await clientDb.getBusinesses()
    if (businessesResult.error) {
      throw businessesResult.error
    }

    const rentManagedBusinesses = (businessesResult.data || []).filter(
      business => business.rent_management
    )

    if (rentManagedBusinesses.length === 0) {
      return NextResponse.json(
        { 
          message: 'No businesses with rent management enabled',
          generated: 0
        },
        { status: 200 }
      )
    }

    // Get all existing bills to check for duplicates
    const billsResult = await clientDb.getBills()
    if (billsResult.error) {
      throw billsResult.error
    }
    const existingBills = billsResult.data || []

    // Get all advances to check for rent advances
    const advancesResult = await clientDb.getAdvances()
    if (advancesResult.error) {
      throw advancesResult.error
    }
    const advances = advancesResult.data || []

    // Get terms and conditions
    const { getTCs } = await import('@/lib/database')
    const allTerms = await getTCs()
    
    // Use all available terms for auto-generated bills
    const selectedTermsIds = allTerms.map(t => t.id)
    const termsText = allTerms.map(term => `${term.title}: ${term.description || ''}`).join('\n\n')

    const currentMonth = today.getMonth() // 0-11
    const currentYear = today.getFullYear()
    
    // Calculate due date (e.g., 15 days from generation date)
    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + 15) // 15 days to pay
    const dueDateString = dueDate.toISOString().split('T')[0]

    let successCount = 0
    let skipCount = 0
    const errors: string[] = []
    
    // Track generated bill numbers to avoid duplicates in this run
    const generatedBillNumbers = new Set<string>()

    // Generate bill number helper - tracks numbers across loop iterations
    const generateBillNumber = () => {
      const prefix = "RENT"
      const year = currentYear

      const prefixPattern = `${prefix}-${year}-`
      const existingNumbers = existingBills
        .filter((b) => b.bill_number.startsWith(prefixPattern))
        .map((b) => {
          const numberPart = b.bill_number.replace(prefixPattern, "")
          return parseInt(numberPart, 10)
        })
        .filter((num) => !isNaN(num))
      
      // Also consider already generated numbers in this run
      const alreadyGeneratedNumbers = Array.from(generatedBillNumbers)
        .filter(billNum => billNum.startsWith(prefixPattern))
        .map(billNum => {
          const numberPart = billNum.replace(prefixPattern, "")
          return parseInt(numberPart, 10)
        })
        .filter((num) => !isNaN(num))
      
      // Combine both existing and newly generated numbers
      const allNumbers = [...existingNumbers, ...alreadyGeneratedNumbers]
      const nextNumber = allNumbers.length > 0 ? Math.max(...allNumbers) + 1 : 1
      const billNumber = `${prefix}-${year}-${nextNumber.toString().padStart(3, "0")}`
      
      // Track this number
      generatedBillNumbers.add(billNumber)
      
      return billNumber
    }

    // Generate bills for each business
    for (const business of rentManagedBusinesses) {
      try {
        // Check for existing advance for this month
        const existingAdvance = advances.find(advance => 
          advance.business_id === business.id && 
          advance.type === "rent" &&
          advance.month === currentMonth + 1 && // Advance months are 1-12
          advance.year === currentYear &&
          advance.status === "active"
        )

        if (existingAdvance) {
          skipCount++
          continue // Skip if advance fully paid
        }

        // Check if bill already exists for this month/year
        const existingBill = existingBills.find(b => {
          const billDate = new Date(b.bill_date)
          return b.business_id === business.id &&
                 billDate.getMonth() === currentMonth &&
                 billDate.getFullYear() === currentYear &&
                 b.bill_number.startsWith('RENT')
        })

        if (existingBill) {
          skipCount++
          continue // Skip if bill already exists
        }

        // Generate new bill
        const billNumber = generateBillNumber()
        const rentAmount = business.rent_amount || 0

        const billData = {
          business_id: business.id,
          bill_number: billNumber,
          bill_date: today.toISOString().split("T")[0],
          due_date: dueDateString,
          rent_amount: rentAmount,
          maintenance_charges: rentAmount,
          electricity_charges: 0,
          gas_charges: 0,
          water_charges: 0,
          other_charges: 0,
          total_amount: rentAmount,
          status: "pending" as const,
          terms_conditions_ids: selectedTermsIds.length > 0 ? selectedTermsIds : null,
          terms_conditions_text: termsText || null,
        }

        const { error, data: createdBill } = await clientDb.createBill(billData)
        
        if (error) {
          errors.push(`${business.name}: ${error.message}`)
        } else {
          successCount++
          
          // Log activity
          if (createdBill) {
            await logActivity({
              action_type: ACTION_TYPES.BILL_GENERATED,
              entity_type: 'bill',
              entity_id: createdBill.id,
              entity_name: business.name,
              description: `Auto-generated Rent bill ${billNumber} for ${business.name} (${business.shop_number})`,
              amount: rentAmount,
              notes: `Bill Number: ${billNumber}, Due Date: ${dueDateString}, Generated automatically by cron`
            })
          }
        }
      } catch (err) {
        errors.push(`${business.name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    // Return summary
    return NextResponse.json(
      {
        success: true,
        message: 'Rent bill generation completed',
        date: today.toISOString(),
        generationDay: businessInfo.rent_bill_generation_day,
        statistics: {
          total: rentManagedBusinesses.length,
          generated: successCount,
          skipped: skipCount,
          failed: errors.length
        },
        errors: errors.length > 0 ? errors : undefined
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in rent bill generation cron:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support GET for manual testing (only in development)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'GET method not allowed in production' },
      { status: 405 }
    )
  }

  // In development, allow GET without auth for testing
  return POST(request)
}
