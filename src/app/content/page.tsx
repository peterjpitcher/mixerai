'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Loader2, Plus, Search } from 'lucide-react'

interface WorkflowStage {
  name: string
  isRequired: boolean
}

interface Content {
  id: string
  title: string
  brand_id: string
  brands: {
    name: string
    settings: {
      workflow: {
        stages: WorkflowStage[]
      }
    }
  }
  status: string
  content_type: string
  created_at: string
  updated_at: string
}

interface Brand {
  id: string
  name: string
  settings: {
    workflow: {
      stages: WorkflowStage[]
    }
  }
}

export default function ContentPage() {
  const { supabase } = useSupabase()
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [brands, setBrands] = useState<Brand[]>([])
  const [workflowStages, setWorkflowStages] = useState<Set<string>>(new Set())

  const loadContent = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('content')
        .select('*, brands!inner(name, settings)')
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      if (brandFilter) {
        query = query.eq('brand_id', brandFilter)
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setContent(data || [])
    } catch (err) {
      console.error('Error loading content:', err)
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, settings')
        .order('name')

      if (error) throw error
      setBrands(data || [])

      // Collect all unique workflow stages across all brands
      const stages = new Set<string>()
      data?.forEach((brand: Brand) => {
        brand.settings?.workflow?.stages?.forEach((stage: WorkflowStage) => {
          stages.add(stage.name)
        })
      })
      setWorkflowStages(stages)
    } catch (err) {
      console.error('Error loading brands:', err)
    }
  }

  useEffect(() => {
    loadContent()
    loadBrands()
  }, [])

  useEffect(() => {
    loadContent()
  }, [searchQuery, statusFilter, brandFilter])

  // Get the workflow stages for a specific brand
  const getBrandWorkflowStages = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId)
    return brand?.settings?.workflow?.stages || []
  }

  // Get status color based on position in workflow
  const getStatusColor = (status: string, brandId: string) => {
    const stages = getBrandWorkflowStages(brandId)
    const stageIndex = stages.findIndex(s => s.name === status)
    const totalStages = stages.length

    if (stageIndex === -1) return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300'
    if (stageIndex === totalStages - 1) return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
    if (stageIndex === 0) return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300'
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Content</h1>
        <Link href="/content/create" passHref>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">All Statuses</option>
                {Array.from(workflowStages).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left border-b dark:border-gray-700">
                <th className="py-3 px-4 font-medium">Title</th>
                <th className="py-3 px-4 font-medium">Brand</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Last Updated</th>
                <th className="py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {content.length === 0 ? (
                <tr className="text-gray-500 dark:text-gray-400">
                  <td colSpan={6} className="text-center py-8">
                    No content found
                  </td>
                </tr>
              ) : (
                content.map((item) => (
                  <tr key={item.id} className="border-b dark:border-gray-700 text-gray-900 dark:text-white">
                    <td className="py-3 px-4">{item.title}</td>
                    <td className="py-3 px-4">{item.brands?.name}</td>
                    <td className="py-3 px-4">
                      {item.content_type === 'article' && 'Article'}
                      {item.content_type === 'product' && 'Product'}
                      {item.content_type === 'recipe' && 'Recipe'}
                      {item.content_type === 'email' && 'Email'}
                      {item.content_type === 'social' && 'Social Post'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(item.status, item.brand_id)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/content/${item.id}`} passHref>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
} 