import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { Column } from 'jspdf-autotable'
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any
  }
}

export interface RentBillData {
  reading: {
    id: string
    business_id: string
    bill_number: string
    reading_date: string
    payment_status: string
    amount: number
    monthly_rent: number
    created_at?: string
  }
  businessReadings: any[]
  business?: {
    name: string
    shop_number: string
    floor_number?: number
    business_type?: string
  }
  businessInfo?: {
    business_name?: string
    logo_url?: string
    contact_email?: string
    contact_phone?: string
  }
  getBusinessName: (id: string) => string
  getBusinessShop: (id: string) => string
  getFloorName: (floorNum: number) => string
  arrears: number
  lateSurcharge: number
}

export const generateRentBillPDF = async (billData: RentBillData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin

  let yPos = 20

  // ==================== HEADER SECTION ====================
  const businessName = billData.businessInfo?.business_name || 'PLAZA MANAGEMENT'
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text(`${businessName.toUpperCase()} - RENT BILL`, pageWidth / 2, yPos, {
    align: 'center',
  })
  doc.setFont(undefined, 'normal')
  yPos += 15

  // ==================== PREPARE DATA ====================
  const readingDateObj = new Date(billData.reading.reading_date)
  const issueDate = new Date(billData.reading.created_at || billData.reading.reading_date)
  const dueDate = new Date(billData.reading.reading_date)
  dueDate.setDate(dueDate.getDate() + 15)

  const monthYear = readingDateObj.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase()
  const readingDateFormatted = readingDateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const issueDateFormatted = issueDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const dueDateFormatted = dueDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  // ==================== SECTION 1: BILL DETAILS TABLE ====================
  doc.autoTable({
    startY: yPos,
    margin: margin,
    theme: 'grid',
    head: [
      ['Reference No', 'BILLING MONTH', 'READING DATE', 'ISSUE DATE', 'DUE DATE'],
    ],
    body: [
      [
        billData.reading.bill_number,
        monthYear,
        readingDateFormatted,
        issueDateFormatted,
        dueDateFormatted,
      ],
    ],
    headStyles: {
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 4,
      fillColor: [0, 150, 136],
      textColor: [255, 255, 255],
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // ==================== SECTION 2: CUSTOMER INFORMATION ====================
  doc.autoTable({
    startY: yPos,
    margin: margin,
    theme: 'grid',
    head: [[{ content: 'Customer Information', colSpan: 4, styles: { fontStyle: 'bold', halign: 'center', fillColor: [0, 150, 136], textColor: [255, 255, 255] } }]],
    body: [
      ['UD :', billData.getBusinessShop(billData.reading.business_id) || 'N/A', 'Floor :', billData.getFloorName(billData.business?.floor_number || 1) || 'N/A'],
      ['Shop No :', billData.business?.shop_number || 'N/A', 'Categories :', billData.business?.business_type || 'Commercial'],
      ['Customer :', billData.getBusinessName(billData.reading.business_id) || 'N/A', '', ''],
    ],
    headStyles: {
      fontStyle: 'bold',
      columnSpan: 4,
      fontSize: 11,
      cellPadding: 4,
      halign: 'center',
      fillColor: [0, 150, 136],
      textColor: [255, 255, 255],
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.25, fontStyle: 'bold' },
      1: { cellWidth: contentWidth * 0.25 },
      2: { cellWidth: contentWidth * 0.25, fontStyle: 'bold' },
      3: { cellWidth: contentWidth * 0.25 },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // ==================== SECTION 3: UNIFIED TWO-COLUMN LAYOUT ====================
  // Build combined body with left and right columns side by side
  const historyRows = billData.businessReadings.slice(0, 12).map((reading) => {
    const histDate = new Date(reading.reading_date)
    const monthStr = histDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    const statusValue = reading.payment_status === 'paid' ? reading.amount.toFixed(0) : '0'
    return [
      monthStr,
      reading.amount.toFixed(0),
      statusValue,
    ]
  })

  const paymentWithinDueDate = billData.reading.amount + billData.arrears
  const paymentAfterDueDate = paymentWithinDueDate + billData.lateSurcharge

  // Create unified table body
  const unifiedBody: any[] = []
  
  // Rent Information + Payment History headers
  unifiedBody.push([
    { content: 'Month', colSpan: 1, styles: { fontStyle: 'bold', halign: 'center' } },
    { content: 'Rent Amount', colSpan: 1, styles: { fontStyle: 'bold', halign: 'center' } },
    { content: 'Status', colSpan: 1, styles: { fontStyle: 'bold', halign: 'center' } },
    { content: 'Month', colSpan: 1, styles: { fontStyle: 'bold', halign: 'center' } },
    { content: 'Bill', colSpan: 1, styles: { fontStyle: 'bold', halign: 'center' } },
    { content: 'Status', colSpan: 1, styles: { fontStyle: 'bold', halign: 'center' } },
  ])
  
  // Current rent + history rows
  const maxRows = Math.max(1, historyRows.length)
  for (let i = 0; i < maxRows; i++) {
    const row: any[] = []
    
    if (i === 0) {
      // First row: current rent data
      row.push(
        monthYear,
        billData.reading.monthly_rent.toFixed(0),
        billData.reading.payment_status || 'pending'
      )
    } else {
      // Empty cells for other rows in left column
      row.push({ content: '', colSpan: 3 })
    }
    
    // History data
    if (i < historyRows.length) {
      row.push(...historyRows[i])
    } else {
      row.push('', '', '')
    }
    
    unifiedBody.push(row)
  }
  
  // Add Bill Calculation section
  unifiedBody.push([
    { content: 'Monthly Rent', styles: { fontStyle: 'bold' } },
    { content: billData.reading.monthly_rent.toFixed(0), colSpan: 2 },
    { content: 'CURRENT BILL', styles: { fontStyle: 'bold' } },
    { content: billData.reading.amount.toFixed(0), colSpan: 2, styles: { halign: 'right' } },
  ])
  
  unifiedBody.push([
    { content: 'Total Rent', styles: { fontStyle: 'bold' } },
    { content: String(billData.reading.amount.toFixed(0)), colSpan: 2 },
    { content: 'ARREARS', styles: { fontStyle: 'bold' } },
    { content: billData.arrears.toFixed(0), colSpan: 2, styles: { halign: 'right' } },
  ])
  
  unifiedBody.push([
    { content: 'Advance', styles: { fontStyle: 'bold' } },
    { content: '0', colSpan: 2 },
    { content: 'PAYMENT WITHIN DUE DATE', styles: { fontStyle: 'bold' } },
    { content: paymentWithinDueDate.toFixed(0), colSpan: 2, styles: { halign: 'right' } },
  ])
  
  unifiedBody.push([
    { content: '', colSpan: 3 },
    { content: 'L.P. SURCHARGE', styles: { fontStyle: 'bold' } },
    { content: billData.lateSurcharge.toFixed(0), colSpan: 2, styles: { halign: 'right' } },
  ])
  
  unifiedBody.push([
    { content: '', colSpan: 3 },
    { content: 'PAYMENT AFTER DUE DATE', styles: { fontStyle: 'bold' } },
    { content: paymentAfterDueDate.toFixed(0), colSpan: 2, styles: { halign: 'right' } },
  ])

  // Create unified table
  doc.autoTable({
    startY: yPos,
    margin: margin,
    theme: 'grid',
    head: [
      [
        { content: 'Rent Information', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center', fillColor: [0, 150, 136], textColor: [255, 255, 255] } },
        { content: 'Payment History', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center', fillColor: [0, 150, 136], textColor: [255, 255, 255] } },
      ],
    ],
    body: unifiedBody,
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.17 },
      1: { cellWidth: contentWidth * 0.17 },
      2: { cellWidth: contentWidth * 0.16 },
      3: { cellWidth: contentWidth * 0.17 },
      4: { cellWidth: contentWidth * 0.17 },
      5: { cellWidth: contentWidth * 0.16 },
    },
  })

  // ==================== FOOTER SECTION ====================
  yPos = (doc as any).lastAutoTable.finalY + 15

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  const paymentInstructions = billData.businessInfo?.contact_email || 'Cash Payment at Management Office'
  doc.text(paymentInstructions, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  if (billData.businessInfo?.contact_phone) {
    doc.text(`Contact: ${billData.businessInfo.contact_phone}`, pageWidth / 2, yPos, {
      align: 'center',
    })
    yPos += 8
  }

  yPos += 5
  doc.setFontSize(8)
  doc.text('This rent bill includes the following charges:', margin, yPos)
  yPos += 4

  const charges = [
    '• Monthly Rent',
    '• Property Lease',
    '• Service Charges',
    '• Late Payment Surcharge (if applicable)',
  ]

  charges.forEach((charge) => {
    doc.text(charge, margin + 3, yPos)
    yPos += 4
  })

  doc.setFontSize(7)
  doc.text('All of the above are included in this bill.', margin, yPos)

  // ==================== DOWNLOAD ====================
  const fileName = `Rent_Bill_${billData.reading.bill_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  doc.save(fileName)
}
