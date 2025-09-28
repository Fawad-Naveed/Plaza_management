"use client"

import { useState, useEffect } from "react"
import { Menu, X, Building, Home, LogOut, HelpCircle, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMobileSidebar, usePreventScroll, useTouchGestures } from "@/hooks/use-mobile"
import { logout, getAuthState } from "@/lib/auth"

interface BusinessSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  isMobileDrawerOpen?: boolean
  onMobileDrawerToggle?: () => void
}

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3
  },
  {
    id: "queries",
    label: "Queries",
    icon: HelpCircle
  }
]

export function BusinessSidebar({
  activeSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
  isMobileDrawerOpen = false,
  onMobileDrawerToggle,
}: BusinessSidebarProps) {
  const [businessName, setBusinessName] = useState<string>("")
  const { isMobile } = useMobileSidebar()
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures()
  
  // Prevent body scroll when mobile drawer is open
  usePreventScroll(isMobile && isMobileDrawerOpen)

  useEffect(() => {
    const authState = getAuthState()
    if (authState && authState.businessName) {
      setBusinessName(authState.businessName)
    }
  }, [])

  const isActive = (itemId: string) => {
    return activeSection === itemId
  }

  // Handle mobile section change and close drawer
  const handleMobileSectionChange = (section: string) => {
    onSectionChange(section)
    if (isMobile && onMobileDrawerToggle) {
      onMobileDrawerToggle()
    }
  }

  // Handle swipe gestures for mobile drawer
  const handleTouchEndWithSwipe = () => {
    const swipeResult = handleTouchEnd()
    if (swipeResult?.isLeftSwipe && isMobileDrawerOpen && onMobileDrawerToggle) {
      onMobileDrawerToggle()
    }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isMobileDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileDrawerToggle}
        />
      )}
      
      {/* Sidebar Container */}
      <div
        className={`
          fixed left-0 top-0 h-full bg-gray-900 text-white z-50 flex flex-col overflow-hidden shadow-xl max-h-screen
          transition-all duration-300 ease-in-out
          ${
            isMobile 
              ? `w-80 ${isMobileDrawerOpen ? 'mobile-nav-visible' : 'mobile-nav-hidden'}`
              : collapsed 
                ? "w-16" 
                : "w-64"
          }
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove} 
        onTouchEnd={handleTouchEndWithSwipe}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 min-h-[64px]">
          <div className="flex items-center gap-3">
            {isMobile && (
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Home className="h-4 w-4 text-white" />
              </div>
            )}
            {(!collapsed || isMobile) && (
              <h1 className={`font-bold tracking-wide ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                Business Portal
              </h1>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={isMobile ? onMobileDrawerToggle : onToggleCollapse} 
            className="text-gray-300 hover:text-white hover:bg-gray-700 rounded-md touch-button"
          >
            {(collapsed && !isMobile) ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className={`${isMobile ? 'p-4' : 'p-3'} flex-1 overflow-y-auto pr-1 scroll-smooth pb-4 min-h-0`} style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #1F2937'
        }}>
          {navigationItems.map((item) => (
            <div key={item.id} className={isMobile ? "mb-3" : "mb-2"}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-left hover:bg-gray-700 hover:text-white hover:scale-105 transition-all duration-200 rounded-lg ${
                  isActive(item.id) ? "bg-gray-700 text-white" : "text-gray-300"
                } ${
                  collapsed && !isMobile ? "px-2 py-3" : isMobile ? "px-4 py-4 touch-button" : "px-3 py-2"
                }`}
                onClick={() => handleMobileSectionChange(item.id)}
              >
                {(collapsed && !isMobile) ? (
                  <div className="w-full flex justify-center">
                    <item.icon className="h-4 w-4" />
                  </div>
                ) : (
                  <>
                    <item.icon className={`${isMobile ? 'h-5 w-5 mr-3' : 'h-4 w-4 mr-3'}`} />
                    <span className={isMobile ? 'text-base' : ''}>{item.label}</span>
                  </>
                )}
              </Button>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className={`border-t border-gray-700 flex-shrink-0 ${
          isMobile ? 'p-4' : 'p-3'
        }`}>
          <Button
            variant="ghost"
            onClick={logout}
            className={`w-full justify-start text-left hover:bg-red-600 hover:text-white transition-all duration-200 rounded-lg text-gray-300 group ${
              collapsed && !isMobile ? "px-2 py-3" : isMobile ? "px-4 py-4 touch-button" : "px-3 py-2"
            }`}
          >
            {(collapsed && !isMobile) ? (
              <div className="w-full flex justify-center">
                <LogOut className="h-4 w-4 group-hover:text-white" />
              </div>
            ) : (
              <>
                <LogOut className={`${isMobile ? 'h-5 w-5 mr-3' : 'h-4 w-4 mr-3'} group-hover:text-white`} />
                <span className={isMobile ? 'text-base' : ''}>Sign Out</span>
              </>
            )}
          </Button>
        </div>

        {/* Business Branding */}
        {businessName && (
          <div className={`border-t border-gray-700 mt-auto flex-shrink-0 bg-gray-800 ${
            isMobile ? 'p-4' : 'p-4'
          }`}>
            {(!collapsed || isMobile) ? (
              <div className="flex items-center space-x-3">
                <div className={`bg-gray-600 rounded-lg flex items-center justify-center border border-gray-500 ${
                  isMobile ? 'w-10 h-10' : 'w-9 h-9'
                }`}>
                  <Building className={`text-gray-300 ${
                    isMobile ? 'h-6 w-6' : 'h-5 w-5'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-white truncate ${
                    isMobile ? 'text-base' : 'text-sm'
                  }`}>
                    {businessName}
                  </p>
                  <p className={`text-gray-300 truncate ${
                    isMobile ? 'text-sm' : 'text-xs'
                  }`}>
                    Business Portal
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-9 h-9 bg-gray-600 rounded-lg flex items-center justify-center border border-gray-500">
                  <Building className="h-5 w-5 text-gray-300" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}