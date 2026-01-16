// import { NextRequest, NextResponse } from 'next/server'

// /**
//  * Admin endpoint to manually trigger rent bill generation
//  * This is a wrapper that calls the cron endpoint internally
//  * No authentication needed as it's for admin testing
//  */
// export async function POST(request: NextRequest) {
//   try {
//     const cronSecret = process.env.CRON_SECRET
    
//     // Get the base URL
//     const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
//     const host = request.headers.get('host')
//     const baseUrl = `${protocol}://${host}`
    
//     // Call the cron endpoint internally
//     const response = await fetch(`${baseUrl}/api/cron/generate-rent-bills`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${cronSecret}`,
//         'Content-Type': 'application/json',
//       },
//     })
    
//     const data = await response.json()
    
//     return NextResponse.json(data, { status: response.status })
    
//   } catch (error) {
//     console.error('Error triggering rent bill generation:', error)
//     return NextResponse.json(
//       { 
//         error: 'Failed to trigger bill generation',
//         message: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     )
//   }
// }

// // Allow GET for easy browser testing
// export async function GET(request: NextRequest) {
//   return POST(request)
// }

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      throw new Error('CRON_SECRET is not defined')
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/cron/generate-rent-bills`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    })

    const text = await response.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`Invalid JSON response from cron endpoint: ${text.substring(0, 200)}`)
    }

    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Error triggering rent bill generation:', error)

    return NextResponse.json(
      {
        error: 'Failed to trigger bill generation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
