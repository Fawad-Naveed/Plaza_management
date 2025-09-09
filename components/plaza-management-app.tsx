"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Sidebar } from "@/components/sidebar"

// Dynamically import heavy sections to avoid loading them all on first paint
const Dashboard = dynamic(() => import("@/components/dashboard").then(m => m.Dashboard), {
  ssr: false,
  loading: () => <div className="p-6">Loading dashboard...</div>,
})
const CustomerManagement = dynamic(() => import("@/components/customer-management").then(m => m.CustomerManagement), {
  ssr: false,
  loading: () => <div className="p-6">Loading customers...</div>,
})
const MeterReading = dynamic(() => import("@/components/meter-reading").then(m => m.MeterReading), {
  ssr: false,
  loading: () => <div className="p-6">Loading meter reading...</div>,
})
const GasManagement = dynamic(() => import("@/components/gas-management").then(m => m.GasManagement), {
  ssr: false,
  loading: () => <div className="p-6">Loading gas management...</div>,
})
const BillGeneration = dynamic(() => import("@/components/bill-generation").then(m => m.BillGeneration), {
  ssr: false,
  loading: () => <div className="p-6">Loading bills...</div>,
})
const PaymentManagement = dynamic(() => import("@/components/payment-management").then(m => m.PaymentManagement), {
  ssr: false,
  loading: () => <div className="p-6">Loading payments...</div>,
})
const MaintenanceModule = dynamic(() => import("@/components/maintenance-module").then(m => m.MaintenanceModule), {
  ssr: false,
  loading: () => <div className="p-6">Loading maintenance...</div>,
})
const ReportsModule = dynamic(() => import("@/components/reports-module").then(m => m.ReportsModule), {
  ssr: false,
  loading: () => <div className="p-6">Loading reports...</div>,
})
const TermsConditions = dynamic(() => import("@/components/terms-conditions").then(m => m.TermsConditions), {
  ssr: false,
  loading: () => <div className="p-6">Loading terms...</div>,
})
const TCComponent = dynamic(() => import("@/components/tc").then(m => m.TCComponent), {
  ssr: false,
  loading: () => <div className="p-6">Loading T&C...</div>,
})
const Settings = dynamic(() => import("@/components/settings").then(m => m.Settings), {
  ssr: false,
  loading: () => <div className="p-6">Loading settings...</div>,
})

// Note: Using original CustomerManagement component with added validation

export type NavigationItem = {
  id: string
  label: string
  subItems?: { id: string; label: string }[]
}

export const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard" },
  {
    id: "customer",
    label: "Business Management",
    subItems: [
      { id: "customer-add", label: "Add Business" },
      { id: "customer-view", label: "View Businesses" },
      { id: "customer-floors", label: "Floor Management" },
      { id: "customer-advance", label: "Advances" },
      { id: "customer-instalments", label: "Instalments" },
      { id: "customer-theft", label: "Theft Records" },
      { id: "customer-meter-load", label: "Meter Load" },
    ],
  },
  {
    id: "rent-billing",
    label: "Rent Management",
    subItems: [
      { id: "bill-generate", label: "Generate Bills" },
      { id: "bill-all", label: "All Bills" },
    ],
  },
  {
    id: "electricity",
    label: "Electricity Management",
    subItems: [
      { id: "meter-add-reading", label: "Meter Reading" },
      { id: "electricity-all", label: "All Bills" },
    ],
  },
  {
    id: "gas",
    label: "Gas Management",
    subItems: [
      { id: "gas-add-reading", label: "Meter Reading" },
      { id: "gas-all", label: "All Bills" },
    ],
  },
  {
    id: "maintenance",
    label: "Maintenance Management",
    subItems: [
      { id: "maintenance-bill", label: "Generate Bills" },
      { id: "maintenance-unpaid", label: "Unpaid Bills" },
      { id: "maintenance-paid", label: "Paid Bills" },
      // { id: "maintenance-advance", label: "Advances" },
      // { id: "maintenance-instalments", label: "Instalments" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    subItems: [
      { id: "reports-rent", label: "Rent History" },
      { id: "reports-maintenance", label: "Maintenance History" },
      { id: "reports-gas", label: "Gas History" },
      { id: "reports-electricity", label: "Electricity History" },
    ],
  },
  // { id: "terms-conditions", label: "Terms & Conditions" },
  { id: "tc", label: "T&C" },
  { id: "settings", label: "Settings" },
]

export function PlazaManagementApp() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0)

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />
      case "customer-add":
      case "customer-view":
      case "customer-floors":
      case "customer-advance":
      case "customer-instalments":
      case "customer-theft":
      case "customer-meter-load":
        return <CustomerManagement activeSubSection={activeSection} />
      case "meter-reading-sheet":
      case "meter-add-reading":
        return <MeterReading activeSubSection={activeSection} />
      case "gas-add-reading":
        return <GasManagement activeSubSection={activeSection} />
      case "bill-generate":
      case "bill-all":
        return <BillGeneration activeSubSection={activeSection} />
      case "electricity-generate":
      case "electricity-all":
        return <BillGeneration activeSubSection={activeSection} />
      case "gas-all":
        return <BillGeneration activeSubSection={activeSection} />
      case "payment-unpaid":
      case "payment-paid":
        return <PaymentManagement activeSubSection={activeSection} />
      case "maintenance-bill":
      // case "maintenance-advance":
      // case "maintenance-instalments":
      case "maintenance-unpaid":
      case "maintenance-paid":
        return <MaintenanceModule activeSubSection={activeSection} />
      case "reports-rent":
      case "reports-maintenance":
      case "reports-gas":
      case "reports-electricity":
        return <ReportsModule activeSubSection={activeSection} />
      case "terms-conditions":
        return <TermsConditions />
      case "tc":
        return <TCComponent />
      case "settings":
        return <Settings onSettingsSaved={() => setSidebarRefreshKey(prev => prev + 1)} />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        key={sidebarRefreshKey}
        navigationItems={navigationItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  )
}
