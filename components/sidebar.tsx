"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Menu, X, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { NavigationItem } from "@/components/plaza-management-app"
import { getInformation, type Information } from "@/lib/database"

interface SidebarProps {
  navigationItems: NavigationItem[]
  activeSection: string
  onSectionChange: (section: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({
  navigationItems,
  activeSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["customer"])
  const [businessInfo, setBusinessInfo] = useState<Information | null>(null)

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const info = await getInformation()
        setBusinessInfo(info)
      } catch (error) {
        console.error('Failed to fetch business information:', error)
      }
    }
    fetchBusinessInfo()
  }, [])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      // If the clicked section is already expanded, collapse it
      if (prev.includes(sectionId)) {
        return prev.filter((id) => id !== sectionId)
      }
      // Otherwise, close all other sections and expand only this one
      return [sectionId]
    })
  }

  const isActive = (itemId: string) => {
    return activeSection === itemId || activeSection.startsWith(itemId + "-")
  }

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-50 flex flex-col overflow-hidden shadow-xl ${
        collapsed ? "w-16" : "w-64"
      } max-h-screen`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        {!collapsed && <h1 className="text-xl font-bold tracking-wide">Plaza Management</h1>}
        <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-3 flex-1 overflow-y-auto pr-1 scroll-smooth pb-4 min-h-0" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#4B5563 #1F2937'
      }}>
        {navigationItems.map((item) => (
          <div key={item.id} className="mb-2">
            {item.subItems ? (
              <>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left hover:bg-gray-700 hover:text-white hover:scale-105 transition-all duration-200 rounded-lg ${
                    isActive(item.id) ? "bg-gray-700 text-white" : "text-gray-300"
                  } ${collapsed ? "px-2 py-3" : "px-3 py-2"}`}
                  onClick={() => !collapsed && toggleSection(item.id)}
                >
                  {collapsed ? (
                    <div className="w-full flex justify-center">
                      <span className="text-xs font-medium">{item.label.charAt(0)}</span>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {expandedSections.includes(item.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </>
                  )}
                </Button>
                {!collapsed && expandedSections.includes(item.id) && (
                  <div className="ml-6 mt-2 space-y-1 border-l border-gray-600 pl-3">
                    {item.subItems.map((subItem) => (
                      <Button
                        key={subItem.id}
                        variant="ghost"
                        className={`w-full justify-start text-left text-sm hover:bg-gray-700 hover:text-white hover:scale-105 transition-all duration-200 rounded-md ${
                          activeSection === subItem.id ? "bg-gray-600 text-white" : "text-gray-400"
                        } py-1.5`}
                        onClick={() => onSectionChange(subItem.id)}
                      >
                        {subItem.label}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Button
                variant="ghost"
                className={`w-full justify-start text-left hover:bg-gray-700 hover:text-white hover:scale-105 transition-all duration-200 rounded-lg ${
                  activeSection === item.id ? "bg-gray-700 text-white" : "text-gray-300"
                } ${collapsed ? "px-2 py-3" : "px-3 py-2"}`}
                onClick={() => onSectionChange(item.id)}
              >
                {collapsed ? (
                  <div className="w-full flex justify-center">
                    <span className="text-xs font-medium">{item.label.charAt(0)}</span>
                  </div>
                ) : (
                  item.label
                )}
              </Button>
            )}
          </div>
        ))}
      </nav>

      {/* Business Branding */}
      {businessInfo && (
        <div className="border-t border-gray-700 p-4 mt-auto flex-shrink-0 bg-gray-800">
          {!collapsed ? (
            <div className="flex items-center space-x-3">
              {businessInfo.logo_url ? (
                <img
                  src={businessInfo.logo_url}
                  alt={businessInfo.business_name}
                  className="w-9 h-9 rounded-lg object-cover border border-gray-600"
                />
              ) : (
                <div className="w-9 h-9 bg-gray-600 rounded-lg flex items-center justify-center border border-gray-500">
                  <Building className="h-5 w-5 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {businessInfo.business_name}
                </p>
                {businessInfo.contact_email && (
                  <p className="text-xs text-gray-300 truncate">
                    {businessInfo.contact_email}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              {businessInfo.logo_url ? (
                <img
                  src={businessInfo.logo_url}
                  alt={businessInfo.business_name}
                  className="w-9 h-9 rounded-lg object-cover border border-gray-600"
                />
              ) : (
                <div className="w-9 h-9 bg-gray-600 rounded-lg flex items-center justify-center border border-gray-500">
                  <Building className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
