// Authentication utilities for the plaza management system

import { createClient } from '@/lib/supabase/client'
import bcrypt from 'bcryptjs'

// Admin credentials (hardcoded for simplicity)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123', // Should be changed in production
}

// Types
export interface LoginCredentials {
  username: string
  password: string
  role: 'admin' | 'business'
}

export interface AuthResult {
  success: boolean
  role?: 'admin' | 'business'
  businessId?: string
  businessName?: string
  message?: string
}

// Hash password function
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Verify password function
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// Login function
export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  const { username, password, role } = credentials

  try {
    // Handle admin login
    if (role === 'admin') {
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        return {
          success: true,
          role: 'admin',
          message: 'Admin login successful'
        }
      } else {
        return {
          success: false,
          message: 'Invalid admin credentials'
        }
      }
    }

    // Handle business login
    if (role === 'business') {
      const supabase = createClient()
      
      // Find business by username
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id, name, username, password_hash')
        .eq('username', username)
        .single()

      if (error || !business) {
        return {
          success: false,
          message: 'Business not found or invalid username'
        }
      }

      // Check if business has password set
      if (!business.password_hash) {
        return {
          success: false,
          message: 'No password set for this business. Contact admin.'
        }
      }

      // Verify password
      const passwordMatch = await verifyPassword(password, business.password_hash)
      
      if (passwordMatch) {
        return {
          success: true,
          role: 'business',
          businessId: business.id,
          businessName: business.name,
          message: 'Business login successful'
        }
      } else {
        return {
          success: false,
          message: 'Invalid password'
        }
      }
    }

    return {
      success: false,
      message: 'Invalid role specified'
    }

  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      message: 'Login failed due to system error'
    }
  }
}

// Check if username is available for new business
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    // Check against admin username
    if (username === ADMIN_CREDENTIALS.username) {
      return false
    }

    // Check against existing business usernames
    const supabase = createClient()
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('username', username)
      .single()

    // If no data found, username is available
    return !data && error?.code === 'PGRST116'
  } catch (error) {
    console.error('Username availability check error:', error)
    return false
  }
}

// Store authentication state in localStorage (simple implementation)
export function setAuthState(authResult: AuthResult) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authState', JSON.stringify(authResult))
  }
}

// Get authentication state from localStorage
export function getAuthState(): AuthResult | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('authState')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error('Error parsing auth state:', error)
        clearAuthState()
      }
    }
  }
  return null
}

// Clear authentication state
export function clearAuthState() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authState')
  }
}

// Logout function
export function logout() {
  clearAuthState()
  // Redirect to main page - AppRouter will show signin page
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}
