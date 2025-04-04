'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Save, Trash2, GripVertical, Sparkles } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface Role {
  id: string
  name: string
}

interface BrandRole {
  id: string
  roleId: string
  name: string
  displayName: string
  emails: string[]
  isCompulsory: boolean
  order: number
}

interface Brand {
  id: string
  name: string
  slug: string
  settings: {
    brandIdentity: string
    toneOfVoice: string
    guardrails: string[]
    allowedContentTypes: string[]
    workflowStages: string[]
  }
  roles: BrandRole[]
  created_at: string
}

interface UrlInput {
  url: string
  isValid: boolean
}

const contentTypes = [
  { id: 'article', name: 'Article' },
  { id: 'product', name: 'Product' },
  { id: 'recipe', name: 'Recipe' },
  { id: 'email', name: 'Email' },
  { id: 'social', name: 'Social Post' }
]

export default function BrandEditPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brand, setBrand] = useState<Brand | null>(null)
  const [newGuardrail, setNewGuardrail] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [newRoleId, setNewRoleId] = useState('')
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('')
  const [newRoleEmail, setNewRoleEmail] = useState('')
  const [isCompulsory, setIsCompulsory] = useState(false)
  const [showIdentityDialog, setShowIdentityDialog] = useState(false)
  const [showToneDialog, setShowToneDialog] = useState(false)
  const [urlInputs, setUrlInputs] = useState<UrlInput[]>([{ url: '', isValid: false }])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadBrand()
    loadRoles()
  }, [params.id])

  const loadBrand = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('brands')
        .select(`
          *,
          brand_roles (
            id,
            role_id,
            display_name,
            email,
            is_compulsory,
            "order",
            roles (
              id,
              name
            )
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      setBrand({
        ...data,
        settings: {
          brandIdentity: data.settings?.brandIdentity || '',
          toneOfVoice: data.settings?.toneOfVoice || '',
          guardrails: data.settings?.guardrails || [],
          allowedContentTypes: data.settings?.allowedContentTypes || contentTypes.map(t => t.id),
          workflowStages: data.settings?.workflowStages || []
        },
        roles: (data.brand_roles || []).map((br: any) => ({
          id: br.id,
          roleId: br.roles.id,
          name: br.roles.name,
          displayName: br.display_name || br.roles.name,
          emails: Array.isArray(br.email) ? br.email : [],
          isCompulsory: br.is_compulsory || false,
          order: br.order || 0
        })).sort((a: any, b: any) => a.order - b.order)
      })
    } catch (err) {
      console.error('Error loading brand:', err)
      setError(err instanceof Error ? err.message : 'Failed to load brand')
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name')

      if (error) throw error
      setRoles(data || [])
    } catch (err) {
      console.error('Error loading roles:', err)
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    }
  }

  const handleSave = async () => {
    if (!brand) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('brands')
        .update({
          settings: brand.settings
        })
        .eq('id', brand.id)

      if (error) throw error

      router.refresh()
    } catch (err) {
      console.error('Error saving brand:', err)
      setError(err instanceof Error ? err.message : 'Failed to save brand')
    } finally {
      setSaving(false)
    }
  }

  const addGuardrail = () => {
    if (!newGuardrail.trim() || !brand) return

    setBrand({
      ...brand,
      settings: {
        ...brand.settings,
        guardrails: [...brand.settings.guardrails, newGuardrail.trim()]
      }
    })
    setNewGuardrail('')
  }

  const removeGuardrail = (index: number) => {
    if (!brand) return

    setBrand({
      ...brand,
      settings: {
        ...brand.settings,
        guardrails: brand.settings.guardrails.filter((_, i) => i !== index)
      }
    })
  }

  const toggleContentType = (typeId: string) => {
    if (!brand) return

    const allowedTypes = brand.settings.allowedContentTypes
    const newAllowedTypes = allowedTypes.includes(typeId)
      ? allowedTypes.filter(t => t !== typeId)
      : [...allowedTypes, typeId]

    setBrand({
      ...brand,
      settings: {
        ...brand.settings,
        allowedContentTypes: newAllowedTypes
      }
    })
  }

  const handleAddRole = async () => {
    if (!brand || !newRoleId) return

    try {
      setSaving(true)
      setError(null)

      // Get the highest order value
      const maxOrder = Math.max(...brand.roles.map(r => r.order), -1)

      const { data, error } = await supabase
        .from('brand_roles')
        .insert({
          brand_id: brand.id,
          role_id: newRoleId,
          display_name: newRoleDisplayName || roles.find(r => r.id === newRoleId)?.name,
          email: [newRoleEmail],
          is_compulsory: isCompulsory,
          order: maxOrder + 1
        })
        .select()

      if (error) throw error

      // Reset form
      setNewRoleId('')
      setNewRoleDisplayName('')
      setNewRoleEmail('')
      setIsCompulsory(false)

      // Reload brand data
      await loadBrand()
    } catch (err) {
      console.error('Error adding role:', err)
      setError(err instanceof Error ? err.message : 'Failed to add role')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveRole = async (roleId: string) => {
    if (!brand) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('brand_roles')
        .delete()
        .eq('id', roleId)

      if (error) throw error

      // Reload brand data
      await loadBrand()
    } catch (err) {
      console.error('Error removing role:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove role')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRole = async (roleId: string, updates: Partial<BrandRole>) => {
    if (!brand) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('brand_roles')
        .update(updates)
        .eq('id', roleId)

      if (error) throw error

      // Reload brand data
      await loadBrand()
    } catch (err) {
      console.error('Error updating role:', err)
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!brand || !result.destination) return

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
          .from('brand_roles')
          .update({ order: role.order })
          .eq('id', role.id)
      )

      const results = await Promise.all(promises)
      const errors = results.filter(r => r.error).map(r => r.error)

      if (errors.length > 0) {
        throw new Error('Failed to update role order')
      }

      // Update local state
      setBrand({
        ...brand,
        roles: updatedRoles
      })
    } catch (err) {
      console.error('Error updating role order:', err)
      setError(err instanceof Error ? err.message : 'Failed to update role order')
    } finally {
      setSaving(false)
    }
  }

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleUrlChange = (index: number, value: string) => {
    const newInputs = [...urlInputs]
    newInputs[index] = { url: value, isValid: validateUrl(value) }
    setUrlInputs(newInputs)
  }

  const addUrlInput = () => {
    if (urlInputs.length < 10) {
      setUrlInputs([...urlInputs, { url: '', isValid: false }])
    }
  }

  const removeUrlInput = (index: number) => {
    const newInputs = urlInputs.filter((_, i) => i !== index)
    if (newInputs.length === 0) {
      newInputs.push({ url: '', isValid: false })
    }
    setUrlInputs(newInputs)
  }

  const fetchUrlContent = async (url: string): Promise<string> => {
    try {
      // Proxy the request through our backend API
      const response = await fetch('/api/fetch-url-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.statusText}`)
      }

      const { content } = await response.json()
      return content
    } catch (err) {
      console.error(`Error fetching content from ${url}:`, err)
      throw new Error(`Failed to fetch content from ${url}`)
    }
  }

  const handleGenerateIdentity = async () => {
    if (!brand) return

    try {
      setIsGenerating(true)
      setError(null)

      // Get valid URLs
      const validUrls = urlInputs.filter(input => input.isValid).map(input => input.url)
      if (validUrls.length === 0) {
        throw new Error('No valid URLs provided')
      }

      // Fetch content from all valid URLs
      const contents = await Promise.all(validUrls.map(fetchUrlContent))
      const combinedContent = contents.join('\n')

      // Call your AI service to generate brand identity
      // TODO: Replace with your actual AI service call
      const response = await fetch('/api/generate-brand-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: combinedContent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate brand identity')
      }

      const { generatedIdentity } = await response.json()

      // Update the brand identity field
      setBrand({
        ...brand,
        settings: {
          ...brand.settings,
          brandIdentity: generatedIdentity
        }
      })

      // Close the dialog and reset
      setShowIdentityDialog(false)
      setUrlInputs([{ url: '', isValid: false }])

    } catch (err) {
      console.error('Error generating brand identity:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate brand identity')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateTone = async () => {
    if (!brand) return

    try {
      setIsGenerating(true)
      setError(null)

      // Get valid URLs
      const validUrls = urlInputs.filter(input => input.isValid).map(input => input.url)
      if (validUrls.length === 0) {
        throw new Error('No valid URLs provided')
      }

      // Fetch content from all valid URLs
      const contents = await Promise.all(validUrls.map(fetchUrlContent))
      const combinedContent = contents.join('\n')

      // Call your AI service to generate tone of voice
      // TODO: Replace with your actual AI service call
      const response = await fetch('/api/generate-tone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: combinedContent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate tone of voice')
      }

      const { generatedTone } = await response.json()

      // Update the tone of voice field
      setBrand({
        ...brand,
        settings: {
          ...brand.settings,
          toneOfVoice: generatedTone
        }
      })

      // Close the dialog and reset
      setShowToneDialog(false)
      setUrlInputs([{ url: '', isValid: false }])

    } catch (err) {
      console.error('Error generating tone of voice:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate tone of voice')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="p-6">
        <div className="text-red-500">Brand not found</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{brand.name}</h1>
          <p className="text-gray-500">Manage brand settings and configuration</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="identity">Brand Identity & Voice</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="content">Content Types</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity & Voice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Brand Identity</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIdentityDialog(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  value={brand.settings.brandIdentity}
                  onChange={(e) => setBrand({
                    ...brand,
                    settings: {
                      ...brand.settings,
                      brandIdentity: e.target.value
                    }
                  })}
                  placeholder="Describe your brand's identity, values, and mission..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Tone of Voice</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowToneDialog(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  value={brand.settings.toneOfVoice}
                  onChange={(e) => setBrand({
                    ...brand,
                    settings: {
                      ...brand.settings,
                      toneOfVoice: e.target.value
                    }
                  })}
                  placeholder="Describe your brand's tone of voice and communication style..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Guardrails</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newGuardrail}
                    onChange={(e) => setNewGuardrail(e.target.value)}
                    placeholder="Add a new guardrail..."
                    onKeyPress={(e) => e.key === 'Enter' && addGuardrail()}
                  />
                  <Button onClick={addGuardrail}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {brand.settings.guardrails.map((guardrail, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {guardrail}
                      <button
                        onClick={() => removeGuardrail(index)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Configure roles and their display names for the content approval workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Roles */}
              <div className="space-y-2">
                <h3 className="font-semibold">Current Roles</h3>
                <div className="space-y-2">
                  {brand?.roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex flex-col p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={role.displayName}
                            onChange={(e) => handleUpdateRole(role.id, { displayName: e.target.value })}
                            className="w-48 h-8"
                            placeholder="Display name"
                          />
                          <span className="text-sm text-gray-500">({role.name})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(role.id)}
                            className="h-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {role.emails.map((email, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded"
                            >
                              {email}
                              <button
                                onClick={() => {
                                  const updatedEmails = role.emails.filter((_, i) => i !== index)
                                  handleUpdateRole(role.id, { emails: updatedEmails })
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              if (newRoleEmail) {
                                handleUpdateRole(role.id, {
                                  emails: [...role.emails, newRoleEmail]
                                })
                                setNewRoleEmail('')
                              }
                            }}
                            className="flex-1 min-w-[200px]"
                          >
                            <Input
                              type="email"
                              placeholder="Add email..."
                              value={newRoleEmail}
                              onChange={(e) => setNewRoleEmail(e.target.value)}
                              className="h-6 text-xs"
                            />
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Role */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Add New Role</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-sm">Role Type</Label>
                    <select
                      value={newRoleId}
                      onChange={(e) => {
                        setNewRoleId(e.target.value)
                        const role = roles.find(r => r.id === e.target.value)
                        if (role) setNewRoleDisplayName(role.name)
                      }}
                      className="w-full h-8 px-2 text-sm rounded border"
                    >
                      <option value="">Select a role...</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm">Display Name</Label>
                    <Input
                      value={newRoleDisplayName}
                      onChange={(e) => setNewRoleDisplayName(e.target.value)}
                      placeholder="Custom name (optional)"
                      className="h-8"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm">Initial Email</Label>
                    <Input
                      type="email"
                      value={newRoleEmail}
                      onChange={(e) => setNewRoleEmail(e.target.value)}
                      placeholder="Email address"
                      className="h-8"
                    />
                  </div>
                  <Button
                    onClick={handleAddRole}
                    disabled={!newRoleId || saving}
                    className="h-8"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Role
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Allowed Content Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={type.id}
                      checked={brand.settings.allowedContentTypes.includes(type.id)}
                      onChange={() => toggleContentType(type.id)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={type.id}>{type.name}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Configuration</CardTitle>
              <CardDescription>Configure the order and requirements for content approval roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {brand.roles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No roles configured yet. Add roles in the Role Management tab to configure your workflow.
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="roles">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-4"
                        >
                          {brand.roles.map((role, index) => (
                            <Draggable
                              key={role.id}
                              draggableId={role.id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab"
                                    >
                                      <GripVertical className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{role.displayName}</div>
                                      <div className="text-sm text-gray-500">{role.name}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={role.isCompulsory}
                                        onChange={(e) => handleUpdateRole(role.id, { isCompulsory: e.target.checked })}
                                        className="rounded border-gray-300"
                                      />
                                      <span className="text-sm">Required</span>
                                    </label>
                                    {role.isCompulsory && (
                                      <Badge variant="secondary">Required</Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Workflow Order</h3>
                  <p className="text-sm text-gray-500">
                    Drag and drop roles to set their order in the content approval workflow.
                    Toggle whether each role is required for content to progress through the workflow.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showIdentityDialog} onOpenChange={setShowIdentityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Brand Identity</DialogTitle>
            <DialogDescription>
              Enter up to 10 URLs to your brand's website pages. We'll analyse them to generate a brand identity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {urlInputs.map((input, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={input.url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder="Enter website URL..."
                  className={input.url && !input.isValid ? 'border-red-500' : ''}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUrlInput(index)}
                  disabled={urlInputs.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {urlInputs.length < 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addUrlInput}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add URL
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowIdentityDialog(false)
                setUrlInputs([{ url: '', isValid: false }])
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateIdentity}
              disabled={isGenerating || !urlInputs.some(input => input.isValid)}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showToneDialog} onOpenChange={setShowToneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Tone of Voice</DialogTitle>
            <DialogDescription>
              Enter up to 10 URLs to your brand's website pages. We'll analyse them to generate tone of voice guidelines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {urlInputs.map((input, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={input.url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder="Enter website URL..."
                  className={input.url && !input.isValid ? 'border-red-500' : ''}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUrlInput(index)}
                  disabled={urlInputs.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {urlInputs.length < 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addUrlInput}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add URL
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowToneDialog(false)
                setUrlInputs([{ url: '', isValid: false }])
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateTone}
              disabled={isGenerating || !urlInputs.some(input => input.isValid)}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 