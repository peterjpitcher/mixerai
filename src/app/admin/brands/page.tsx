'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Settings2, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Brand {
  id: string
  name: string
  slug: string
  settings: {
    brandIdentity: string
    toneOfVoice: string
    guardrails: string[]
    allowedContentTypes: string[]
  }
  created_at: string
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
        .order('created_at', { ascending: false })

      if (error) throw error

      setBrands(data || [])
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBrands.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No brands found
          </div>
        ) : (
          filteredBrands.map((brand) => (
            <Card key={brand.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{brand.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/brands/${brand.id}`)}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Content Types</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {brand.settings?.allowedContentTypes?.map((type) => (
                        <Badge key={type} variant="secondary">
                          {type}
                        </Badge>
                      )) || (
                        <span className="text-sm text-gray-400">No content types configured</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Guardrails</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {brand.settings?.guardrails?.length || 0} configured
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/admin/brands/${brand.id}`)}
                    >
                      Manage Brand
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Brand Dialog placeholder - to be implemented */}
      <Dialog open={showAddBrandDialog} onOpenChange={setShowAddBrandDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-500">Brand creation interface coming soon...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 