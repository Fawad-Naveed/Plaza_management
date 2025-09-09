"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Save, Loader2, Building, Mail, Phone, Globe, MapPin } from "lucide-react"
import { clientDb, type Information, getInformation, upsertInformation } from "@/lib/database"

interface SettingsProps {
  onSettingsSaved?: () => void
}

export function Settings({ onSettingsSaved }: SettingsProps) {
  const [information, setInformation] = useState<Information | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    business_name: "",
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    website: "",
  })

  useEffect(() => {
    loadInformation()
  }, [])

  const loadInformation = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await getInformation()
      if (data) {
        setInformation(data)
        setFormData({
          business_name: data.business_name || "",
          logo_url: data.logo_url || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          address: data.address || "",
          website: data.website || "",
        })
      }
    } catch (err) {
      console.error("[v0] Error loading information:", err)
      // Don't set error for "no rows" case - it's expected for first time setup
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.business_name.trim()) {
      setError("Business name is required")
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const result = await upsertInformation(formData)
      setInformation(result)
      setSuccess("Settings saved successfully!")
      
      // Trigger sidebar refresh
      onSettingsSaved?.()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("[v0] Error saving information:", err)
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear messages when user starts typing
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Settings</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.business_name}
                onChange={(e) => handleInputChange("business_name", e.target.value)}
                placeholder="Enter your business name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={formData.logo_url}
                onChange={(e) => handleInputChange("logo_url", e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Enter a URL to your logo image. Recommended size: 200x200px or smaller.
              </p>
            </div>

            {formData.logo_url && (
              <div className="space-y-2">
                <Label>Logo Preview</Label>
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <img
                    src={formData.logo_url}
                    alt="Logo preview"
                    className="max-w-32 max-h-32 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      setError("Invalid logo URL - image could not be loaded")
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange("contact_email", e.target.value)}
                placeholder="contact@yourbusiness.com"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="contactPhone"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://yourbusiness.com"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter your business address"
                className="w-full"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !formData.business_name.trim()}
          className="bg-black text-white hover:bg-gray-800"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Preview Section */}
      {formData.business_name && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sidebar Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-white p-4 rounded-md max-w-64">
              <div className="flex items-center gap-3">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt={formData.business_name}
                    className="w-8 h-8 object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                    <Building className="h-4 w-4" />
                  </div>
                )}
                <span className="text-sm font-medium truncate">{formData.business_name}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This is how your branding will appear in the sidebar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}