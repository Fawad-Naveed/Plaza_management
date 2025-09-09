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
  const [expandedSections, setExpandedSections] = useState<string[]>(["customer", "rent-billing"])
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
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  const isActive = (itemId: string) => {
    return activeSection === itemId || activeSection.startsWith(itemId + "-")
  }

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-black text-white transition-all duration-300 z-50 flex flex-col overflow-hidden ${
        collapsed ? "w-16" : "w-64"
      } max-h-screen`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && <h1 className="text-lg font-semibold">Plaza Management</h1>}
        <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="text-white hover:bg-gray-800">
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-2 flex-1 overflow-y-auto pr-1 scroll-smooth pb-4 min-h-0" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#4B5563 #1F2937'
      }}>
        {navigationItems.map((item) => (
          <div key={item.id} className="mb-1">
            {item.subItems ? (
              <>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left hover:bg-gray-800 ${
                    isActive(item.id) ? "bg-gray-800" : ""
                  } ${collapsed ? "px-2" : "px-3"}`}
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
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Button
                        key={subItem.id}
                        variant="ghost"
                        className={`w-full justify-start text-left text-sm hover:bg-gray-800 ${
                          activeSection === subItem.id ? "bg-gray-700" : ""
                        }`}
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
                className={`w-full justify-start text-left hover:bg-gray-800 ${
                  activeSection === item.id ? "bg-gray-800" : ""
                } ${collapsed ? "px-2" : "px-3"}`}
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
        <div className="border-t border-gray-800 p-4 mt-auto flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center space-x-3">
              {businessInfo.logo_url ? (
                <img
                  src={businessInfo.logo_url}
                  alt={businessInfo.business_name}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                  <Building className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {businessInfo.business_name}
                </p>
                {businessInfo.contact_email && (
                  <p className="text-xs text-gray-400 truncate">
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
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                  <Building className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
