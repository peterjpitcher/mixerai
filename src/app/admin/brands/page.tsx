'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Settings2, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import BrandWizard from '@/components/BrandWizard'

interface Brand {
  id: string
  name: string
  logo_url: string | null
  website_url: string
  language: string
  country: string
  settings: {
    brandIdentity: string
    toneOfVoice: string
    guardrails: string[]
    keywords: string[]
    allowedContentTypes: string[]
    workflowStages: string[]
    customAgencies: Array<{
      id: string
      name: string
      isCustom: boolean
    }>
    styleGuide: {
      communicationStyle: string
      languagePreferences: string
      formalityLevel: string
      writingStyle: string
    }
  }
  created_at: string | null
  updated_at: string | null
  user_id: string | null
}

export default function BrandsPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddBrandDialog, setShowAddBrandDialog] = useState(false)

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name')

      if (error) throw error

      const defaultSettings = {
        brandIdentity: "",
        toneOfVoice: "",
        guardrails: [],
        keywords: [],
        allowedContentTypes: [],
        workflowStages: ["draft", "review", "approved", "published"],
        customAgencies: [],
        styleGuide: {
          communicationStyle: "",
          languagePreferences: "",
          formalityLevel: "",
          writingStyle: ""
        }
      }

      setBrands((data || []).map(brand => ({
        ...brand,
        settings: {
          ...defaultSettings,
          ...(brand.settings as any || {})
        }
      })))
    } catch (err) {
      console.error('Error loading brands:', err)
      setError(err instanceof Error ? err.message : 'Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBrandCreated = () => {
    setShowAddBrandDialog(false)
    loadBrands()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Brand Management</h1>
          <p className="text-gray-500">Manage your brands and their settings</p>
        </div>
        <Button onClick={() => setShowAddBrandDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBrands.map((brand) => (
          <Card key={brand.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                {brand.logo_url ? (
                  <div className="h-10 w-10 relative">
                    <img
                      src={brand.logo_url}
                      alt={`${brand.name} logo`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-400">
                      {brand.name.charAt(0)}
                    </span>
                  </div>
                )}
                <CardTitle className="text-xl font-bold">{brand.name}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/brands/${brand.id}`)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {brand.settings.allowedContentTypes?.map((type) => (
                    <Badge key={type} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {brand.settings.brandIdentity || 'No brand identity set'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddBrandDialog} onOpenChange={setShowAddBrandDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
            <DialogDescription>
              Create a new brand to manage its content, settings, and workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <BrandWizard onComplete={handleBrandCreated} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 