'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BusinessManagementOptimized } from './business-management-optimized'

/**
 * Demo component to test Business Management form validation
 * This shows the validation features in action
 */
export function ValidationTestDemo() {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Form Validation Testing Demo
        </h1>
        <p className="text-gray-600">
          Test the Business Management form validation features below
        </p>
      </div>

      {/* Test Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Testing Instructions
            <Badge variant="outline">Interactive</Badge>
          </CardTitle>
          <CardDescription>
            Follow these steps to test the validation features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">✅ Valid Test Cases</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Fill all required fields with valid data</li>
                <li>• Enter valid email format (optional)</li>
                <li>• Enter valid phone: +1 (555) 123-4567</li>
                <li>• Enter positive rent amount</li>
                <li>• Select a floor from dropdown</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-red-700">❌ Invalid Test Cases</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Leave required fields empty</li>
                <li>• Enter invalid email: "notanemail"</li>
                <li>• Enter short names (less than 2 chars)</li>
                <li>• Enter invalid phone: "abc123"</li>
                <li>• Enter negative or zero rent</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">🎯 What to Look For:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <strong className="text-blue-700">Visual Feedback:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Red borders on invalid fields</li>
                  <li>• Red asterisks (*) for required</li>
                  <li>• Error messages below fields</li>
                </ul>
              </div>
              <div>
                <strong className="text-blue-700">Timing:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Errors after leaving field</li>
                  <li>• Errors clear when typing fix</li>
                  <li>• All errors on submit attempt</li>
                </ul>
              </div>
              <div>
                <strong className="text-blue-700">Form State:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Clean form on dialog open</li>
                  <li>• Reset after successful submit</li>
                  <li>• Prevent submit with errors</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Rules Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Validation Rules Reference
            <Badge variant="secondary">Quick Guide</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-800">🏢 Business Name *</h5>
              <p className="text-gray-600">• Required field</p>
              <p className="text-gray-600">• Min 2 characters</p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-800">👤 Owner Name *</h5>
              <p className="text-gray-600">• Required field</p>
              <p className="text-gray-600">• Min 2 characters</p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-800">📞 Phone *</h5>
              <p className="text-gray-600">• Required field</p>
              <p className="text-gray-600">• Min 10 digits</p>
              <p className="text-gray-600">• Valid format only</p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-800">📧 Email</h5>
              <p className="text-gray-400">• Optional field</p>
              <p className="text-gray-600">• Valid email format</p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-800">🏢 Floor *</h5>
              <p className="text-gray-600">• Required selection</p>
              <p className="text-gray-600">• From dropdown</p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-800">💰 Rent *</h5>
              <p className="text-gray-600">• Required field</p>
              <p className="text-gray-600">• Must be positive</p>
              <p className="text-gray-600">• Number only</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Legend:</strong> 
              <span className="text-red-600 font-semibold"> * </span> = Required field, 
              <span className="text-gray-400"> (optional) </span> = Optional field
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Management Component with Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 Live Demo - Business Management with Validation
            <Badge variant="destructive">Test Below</Badge>
          </CardTitle>
          <CardDescription>
            Click "Add Business" to open the form and test all validation features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessManagementOptimized />
        </CardContent>
      </Card>

      {/* Performance Notes */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">🎉 Performance & UX Benefits</CardTitle>
        </CardHeader>
        <CardContent className="text-green-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold">Performance Optimizations:</h5>
              <ul className="mt-2 space-y-1">
                <li>• Lazy loading with React.memo</li>
                <li>• Cached Supabase queries</li>
                <li>• Paginated data loading</li>
                <li>• Optimized re-renders</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold">User Experience:</h5>
              <ul className="mt-2 space-y-1">
                <li>• Real-time validation feedback</li>
                <li>• Clear error messaging</li>
                <li>• Smart validation timing</li>
                <li>• Professional UI/UX</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ValidationTestDemo
