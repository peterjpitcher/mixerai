'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, ArrowLeft } from 'lucide-react'

interface ContentDetails {
  id: string
  title: string
  description: string
  content: string
  brand_id: string
  content_type: string
  status: 'draft' | 'review' | 'approved' | 'published'
  keywords: string[]
  created_at: string
  updated_at: string
  brand_name?: string
}

export default function ContentEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [content, setContent] = useState<ContentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadContent()
  }, [params.id])

  const loadContent = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          brands (
            name
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      setContent({
        ...data,
        brand_name: data.brands.name,
        keywords: data.keywords || []
      })
    } catch (err) {
      console.error('Error loading content:', err)
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!content) return

    try {
      setSaving(true)
      setError(null)

      // Update the content
      const { error: contentError } = await supabase
        .from('content')
        .update({
          content: content.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', content.id)

      if (contentError) throw contentError

      // Reload content
      await loadContent()
    } catch (err) {
      console.error('Error saving content:', err)
      setError(err instanceof Error ? err.message : 'Failed to save content')
    } finally {
      setSaving(false)
    }
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

  if (!content) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-yellow-500/10 p-4 text-sm text-yellow-500">
          Content not found
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/content')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Button>
          <h1 className="text-3xl font-bold">Edit Content</h1>
          <p className="text-gray-500">
            Last updated {new Date(content.updated_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!saving && <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={content.content}
              onChange={(e) => setContent({ ...content, content: e.target.value })}
              placeholder="Write your content here"
              rows={20}
              className="font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 