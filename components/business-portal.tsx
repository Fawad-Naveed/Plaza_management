"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BusinessSidebar } from "@/components/business-sidebar"
import { BusinessDashboard } from "@/components/business-dashboard"
import { BusinessQueries } from "@/components/business-queries"
import { useMobileSidebar } from "@/hooks/use-mobile"

export function BusinessPortal() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { isMobile, isOpen: isMobileDrawerOpen, toggleSidebar } = useMobileSidebar()

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
  }

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <BusinessDashboard />
      case "queries":
        return <BusinessQueries />
      default:
        return <BusinessDashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <BusinessSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onMobileDrawerToggle={toggleSidebar}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        isMobile 
          ? 'ml-0' 
          : sidebarCollapsed 
            ? 'ml-16' 
            : 'ml-64'
      }`}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
            <h1 className="text-lg font-semibold text-gray-900">Business Portal</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}