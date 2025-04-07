"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/SupabaseProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Upload, X } from "lucide-react"
import { RoleSelect } from "@/components/admin/RoleSelect"
import { ContentTypeSelect } from "@/components/admin/ContentTypeSelect"
import { WorkflowSelect } from "@/components/admin/WorkflowSelect"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { GripVertical, Trash2 } from "lucide-react"
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from "react-beautiful-dnd"
import Image from "next/image"
import { countries } from '@/lib/countries'

interface Language {
  code: string
  name: string
}

interface Country {
  code: string
  name: string
}

interface Role {
  id: string
  name: string
}

const languages: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" }
]

interface BrandRole {
  id: string
  brand_id: string
  role_id: string
  email?: string
  is_compulsory: boolean
  order: number
  name: string
}

interface BrandSettings {
  brandIdentity?: string
  toneOfVoice?: string
  guardrails?: string[]
  keywords?: string[]
  allowedContentTypes?: string[]
}

interface Brand {
  id: string
  name: string
  logo_url?: string | null
  website_url?: string | null
  language?: string | null
  country?: string | null
  settings?: BrandSettings
  roles?: BrandRole[]
  created_at?: string
}

const defaultBrand: Brand = {
  id: "",
  name: "",
  settings: {
    brandIdentity: "",
    toneOfVoice: "",
    guardrails: [],
    keywords: [],
    allowedContentTypes: []
  },
  roles: []
}

const RoleIcon = ({ role }: { role: BrandRole }) => {
  return (
    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
      <span className="text-xs font-medium text-primary">{role.name[0]}</span>
    </div>
  )
}

export default function BrandEditPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brand, setBrand] = useState<Brand>(defaultBrand)
  const [newGuardrail, setNewGuardrail] = useState("")
  const [newRoleId, setNewRoleId] = useState("")
  const [newRoleEmail, setNewRoleEmail] = useState("")
  const [newRoleName, setNewRoleName] = useState("")
  const [isCompulsory, setIsCompulsory] = useState(false)
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const loadBrand = useCallback(async () => {
    if (!params.id) return

    try {
      const [brandResult, rolesResult, availableRolesResult] = await Promise.all([
        supabase
          .from("brands")
          .select("*")
          .eq("id", params.id)
          .single(),
        supabase
          .from("brand_roles")
          .select("*, roles!inner(name)")
          .eq("brand_id", params.id)
          .order("order"),
        supabase
          .from("roles")
          .select("id, name")
      ])

      if (brandResult.error) throw brandResult.error
      if (rolesResult.error) throw rolesResult.error
      if (availableRolesResult.error) throw availableRolesResult.error

      if (brandResult.data) {
        setBrand({
          ...defaultBrand,
          ...brandResult.data,
          roles: rolesResult.data.map(role => ({
            id: role.id,
            brand_id: role.brand_id,
            role_id: role.roles.name,
            email: role.email,
            is_compulsory: role.is_compulsory,
            order: role.order,
            name: role.display_name || role.roles.name
          })),
          settings: {
            ...defaultBrand.settings,
            ...brandResult.data.settings
          }
        })
      }

      setAvailableRoles(availableRolesResult.data)
      setLoading(false)
    } catch (err) {
      console.error("Error loading brand:", err)
      setError(err instanceof Error ? err.message : "Failed to load brand")
      setLoading(false)
    }
  }, [params.id, supabase])

  useEffect(() => {
    loadBrand()
  }, [loadBrand])

  const handleSave = async () => {
    if (!brand.id) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("brands")
        .update({
          name: brand.name,
          logo_url: brand.logo_url,
          website_url: brand.website_url,
          language: brand.language,
          country: brand.country,
          settings: brand.settings || defaultBrand.settings
        })
        .eq("id", brand.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Brand settings saved successfully."
      })
      router.push("/admin/brands")
    } catch (err) {
      console.error("Error saving brand:", err)
      toast({
        title: "Error",
        description: "Failed to save brand settings.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddRole = async () => {
    if (!brand.id || !newRoleId || !newRoleName) return

    try {
      setSaving(true)
      setError(null)

      // Get the highest order value
      const maxOrder = Math.max(...(brand.roles?.map(r => r.order) || [-1]))

      // Get the role name from the available roles
      const selectedRole = availableRoles.find(role => role.id === newRoleId)
      if (!selectedRole) {
        throw new Error('Selected role not found')
      }

      const { data, error } = await supabase
        .from("brand_roles")
        .insert({
          brand_id: brand.id,
          role_name: selectedRole.name,
          email: newRoleEmail || null,
          is_compulsory: isCompulsory,
          order: maxOrder + 1,
          display_name: newRoleName // Use display_name instead of name
        })
        .select()

      if (error) throw error

      // Reset form
      setNewRoleId("")
      setNewRoleEmail("")
      setNewRoleName("")
      setIsCompulsory(false)
      setShowAddRoleDialog(false)

      // Reload brand data
      await loadBrand()
    } catch (err) {
      console.error("Error adding role:", err)
      setError(err instanceof Error ? err.message : "Failed to add role")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveRole = async (roleId: string) => {
    if (!brand.id) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from("brand_roles")
        .delete()
        .eq("id", roleId)

      if (error) throw error

      // Reload brand data
      await loadBrand()
    } catch (err) {
      console.error("Error removing role:", err)
      setError(err instanceof Error ? err.message : "Failed to remove role")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRole = async (roleId: string, updates: Partial<BrandRole>) => {
    if (!brand.id) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from("brand_roles")
        .update(updates)
        .eq("id", roleId)

      if (error) throw error

      // Reload brand data
      await loadBrand()
    } catch (err) {
      console.error("Error updating role:", err)
      setError(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!brand.id || !brand.roles || !result.destination) return

    try {
      setSaving(true)
      setError(null)

      const items = Array.from(brand.roles)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      // Update the order of all roles
      const updatedRoles = items.map((role, index) => ({
        ...role,
        order: index
      }))

      // Update all roles in the database
      const promises = updatedRoles.map(role =>
        supabase
          .from("brand_roles")
          .update({ order: role.order })
          .eq("id", role.id)
      )

      const results = await Promise.all(promises)
      const errors = results.filter(r => r.error).map(r => r.error)

      if (errors.length > 0) {
        throw new Error("Failed to update role order")
      }

      // Update local state
      setBrand({
        ...brand,
        roles: updatedRoles
      })
    } catch (err) {
      console.error("Error updating role order:", err)
      setError(err instanceof Error ? err.message : "Failed to update role order")
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateIdentity = async () => {
    if (!brand.language) {
      toast({
        title: "Error",
        description: "Please select a language before generating brand identity.",
        variant: "destructive"
      })
      return
    }

    try {
      setGenerating(true)
      const response = await fetch("/api/generate-brand-identity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: brand.name,
          website: brand.website_url,
          language: brand.language
        })
      })

      if (!response.ok) {
        throw new Error("Failed to generate brand identity")
      }

      const { brandIdentity, toneOfVoice, guardrails } = await response.json()

      setBrand({
        ...brand,
        settings: {
          ...brand.settings,
          brandIdentity,
          toneOfVoice,
          guardrails: guardrails || []
        }
      })

      toast({
        title: "Success",
        description: "Brand identity generated successfully."
      })
    } catch (err) {
      console.error("Error generating brand identity:", err)
      toast({
        title: "Error",
        description: "Failed to generate brand identity.",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const addGuardrail = () => {
    if (!newGuardrail.trim()) return

    setBrand({
      ...brand,
      settings: {
        ...brand.settings,
        guardrails: [...(brand.settings?.guardrails || []), newGuardrail.trim()]
      }
    })
    setNewGuardrail("")
  }

  const removeGuardrail = (index: number) => {
    setBrand({
      ...brand,
      settings: {
        ...brand.settings,
        guardrails: brand.settings?.guardrails?.filter((_, i) => i !== index) || []
      }
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !brand.id) return

    try {
      setUploadingLogo(true)
      setError(null)

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${brand.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('brand-logos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(fileName)

      // Update brand with new logo URL
      const { error: updateError } = await supabase
        .from('brands')
        .update({ logo_url: publicUrl })
        .eq('id', brand.id)

      if (updateError) throw updateError

      // Update local state
      setBrand({
        ...brand,
        logo_url: publicUrl
      })

      toast({
        title: "Success",
        description: "Logo uploaded successfully."
      })
    } catch (err) {
      console.error("Error uploading logo:", err)
      toast({
        title: "Error",
        description: "Failed to upload logo.",
        variant: "destructive"
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!brand.id || !brand.logo_url) return

    try {
      setSaving(true)
      setError(null)

      // Extract filename from URL
      const fileName = brand.logo_url.split('/').pop()
      if (fileName) {
        // Remove file from storage
        const { error: removeError } = await supabase.storage
          .from('brand-logos')
          .remove([fileName])

        if (removeError) throw removeError
      }

      // Update brand to remove logo URL
      const { error: updateError } = await supabase
        .from('brands')
        .update({ logo_url: null })
        .eq('id', brand.id)

      if (updateError) throw updateError

      // Update local state
      setBrand({
        ...brand,
        logo_url: null
      })

      toast({
        title: "Success",
        description: "Logo removed successfully."
      })
    } catch (err) {
      console.error("Error removing logo:", err)
      toast({
        title: "Error",
        description: "Failed to remove logo.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLanguageChange = (value: string) => {
    setBrand({
      ...brand,
      language: value,
    })
  }

  const handleCountryChange = (value: string) => {
    setBrand({
      ...brand,
      country: value,
    })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-start gap-8">
        <div className="flex-shrink-0">
          <div className="space-y-2">
            <Label>Brand Logo</Label>
            <div className="relative group">
              {brand.logo_url ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-background">
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    fill
                    className="object-contain"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6 text-white" />
                      <span className="text-sm text-white">Change Logo</span>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo || saving}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo || saving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload Logo</span>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo || saving}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a square logo in PNG or JPG format, ideally 512x512px.
            </p>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-2">
            <Label>Brand Name</Label>
            <Input
              value={brand.name}
              onChange={(e) =>
                setBrand({
                  ...brand,
                  name: e.target.value,
                })
              }
              placeholder="Enter brand name"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="identity">Brand Identity & Voice</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="content-types">Content Types</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the basic details of your brand.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input
                  value={brand.website_url || ""}
                  onChange={(e) =>
                    setBrand({
                      ...brand,
                      website_url: e.target.value,
                    })
                  }
                  placeholder="https://example.com"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={brand.language || ""}
                  onValueChange={handleLanguageChange}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={brand.country || ""}
                  onValueChange={handleCountryChange}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity & Voice</CardTitle>
              <CardDescription>Define your brand's identity and tone of voice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateIdentity}
                  disabled={generating || !brand.language}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {generating ? "Generating..." : "Generate with AI"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Brand Identity</Label>
                <Textarea
                  value={brand.settings?.brandIdentity ?? ""}
                  onChange={(e) =>
                    setBrand({
                      ...brand,
                      settings: {
                        ...brand.settings,
                        brandIdentity: e.target.value
                      }
                    })
                  }
                  placeholder="Describe your brand's identity"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Tone of Voice</Label>
                <Textarea
                  value={brand.settings?.toneOfVoice ?? ""}
                  onChange={(e) =>
                    setBrand({
                      ...brand,
                      settings: {
                        ...brand.settings,
                        toneOfVoice: e.target.value
                      }
                    })
                  }
                  placeholder="Describe your brand's tone of voice"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Content Guardrails</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {brand.settings?.guardrails?.map((guardrail, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {guardrail}
                      <button
                        onClick={() => removeGuardrail(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newGuardrail}
                    onChange={(e) => setNewGuardrail(e.target.value)}
                    placeholder="Add new guardrail"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addGuardrail()
                      }
                    }}
                  />
                  <Button onClick={addGuardrail} disabled={!newGuardrail.trim()}>
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Management</CardTitle>
              <CardDescription>Configure the content workflow stages and roles for this brand.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">Workflow Stages</h3>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop roles to reorder the workflow stages.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAddRoleDialog(true)}
                    disabled={saving}
                  >
                    Add Role
                  </Button>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="roles">
                    {(provided: DroppableProvided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {brand.roles?.map((role, index) => (
                          <Draggable
                            key={role.id}
                            draggableId={role.id}
                            index={index}
                          >
                            {(provided: DraggableProvided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center gap-4 p-4 bg-card border rounded-lg"
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <RoleIcon role={role} />
                                    <span className="font-medium">{role.name}</span>
                                    {role.is_compulsory && (
                                      <Badge>Required</Badge>
                                    )}
                                  </div>
                                  {role.email && (
                                    <p className="text-sm text-muted-foreground">
                                      {role.email}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveRole(role.id)}
                                  disabled={saving}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-types">
          <Card>
            <CardHeader>
              <CardTitle>Content Types</CardTitle>
              <CardDescription>Configure which content types are available for this brand.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContentTypeSelect
                value={brand.settings?.allowedContentTypes || []}
                onChange={(contentTypes) =>
                  setBrand({
                    ...brand,
                    settings: {
                      ...brand.settings,
                      allowedContentTypes: contentTypes
                    }
                  })
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Workflow Role</DialogTitle>
            <DialogDescription>
              Add a new role to the brand&apos;s workflow. Each role represents a stage in the content approval process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Type</Label>
              <Select value={newRoleId} onValueChange={setNewRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter a custom name for this role"
              />
            </div>

            <div className="space-y-2">
              <Label>Email (Optional)</Label>
              <Input
                value={newRoleEmail}
                onChange={(e) => setNewRoleEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-compulsory"
                checked={isCompulsory}
                onCheckedChange={(checked) => setIsCompulsory(checked as boolean)}
              />
              <Label htmlFor="is-compulsory">Required for content approval</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={!newRoleId || !newRoleName || saving}>
              {saving ? "Adding..." : "Add Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 