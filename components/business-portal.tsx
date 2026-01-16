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
    <div className="flex h-screen bg-background overflow-hidden">
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
            ? 'ml-20' 
            : 'ml-72'
      }`}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between lg:hidden">
            <h1 className="text-lg font-semibold text-foreground">Business Portal</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
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