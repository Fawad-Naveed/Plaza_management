"use client"

import { useEffect, useState } from "react"
import { SigninPage } from "./signin-page"
import { BusinessPortal } from "./business-portal"
import { PlazaManagementApp } from "./plaza-management-app"
import { OwnerPortal } from "./owner-portal"
import { getAuthState, type AuthResult } from "@/lib/auth"

export function AppRouter() {
  const [authState, setAuthState] = useState<AuthResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication state on mount
    const storedAuth = getAuthState()
    setAuthState(storedAuth)
    setLoading(false)

    // Listen for auth state changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authState') {
        const newAuthState = e.newValue ? JSON.parse(e.newValue) : null
        setAuthState(newAuthState)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // No authentication - show signin page
  if (!authState || !authState.success) {
    return <SigninPage />
  }

  // Owner authenticated - show owner portal (full access + admin management)
  if (authState.role === 'owner') {
    return <OwnerPortal />
  }

  // Admin authenticated - show admin interface with permission filtering
  if (authState.role === 'admin') {
    return <PlazaManagementApp permissions={authState.permissions || []} />
  }

  // Business authenticated - show business portal
  if (authState.role === 'business') {
    return <BusinessPortal />
  }

  // Fallback - show signin page
  return <SigninPage />
}