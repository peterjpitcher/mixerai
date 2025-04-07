'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SelectNative } from '@/components/ui/select-native'
import { Loader2 } from 'lucide-react'

interface EmailMetadata {
  title: string
  description: string
  brandId: string
  type: string
  emailType: string
  subject: string
  previewText: string
  contentSource: 'link' | 'freeform'
  sourceUrl?: string
  sourceText?: string
  abTesting: boolean
  abVariations: {
    subject: string
    previewText: string
  }[]
  seoTitle: string
  seoDescription: string
  recommendedSlug: string
  optimizationUrl?: string
  optimizationFeedback?: string
}

const emailTypes = [
  { id: 'newsletter', name: 'Newsletter' },
  { id: 'promotional', name: 'Promotional' },
  { id: 'announcement', name: 'Announcement' },
  { id: 'welcome', name: 'Welcome Email' },
  { id: 'product-update', name: 'Product Update' },
  { id: 'event', name: 'Event Invitation' }
]

export default function CreateEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<EmailMetadata>({
    title: searchParams.get('title') || '',
    description: '',
    brandId: searchParams.get('brandId') || '',
    type: 'email',
    emailType: '',
    subject: '',
    previewText: '',
    contentSource: 'freeform',
    sourceUrl: '',
    sourceText: '',
    abTesting: false,
    abVariations: [],
    seoTitle: searchParams.get('seoTitle') || '',
    seoDescription: searchParams.get('seoDescription') || '',
    recommendedSlug: searchParams.get('recommendedSlug') || '',
    optimizationUrl: searchParams.get('url') || '',
    optimizationFeedback: searchParams.get('feedback') || ''
  })

  useEffect(() => {
    if (!metadata.brandId) {
      router.push('/content/create')
    }
  }, [metadata.brandId, router])

  const handleGenerateContent = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateEmailContent',
          metadata
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to generate email content')
      }

      const { content, seoMetadata } = await response.json()

      // Update SEO metadata if not already set
      if (!metadata.seoTitle || !metadata.seoDescription || !metadata.recommendedSlug) {
        setMetadata(prev => ({
          ...prev,
          seoTitle: prev.seoTitle || seoMetadata.title,
          seoDescription: prev.seoDescription || seoMetadata.description,
          recommendedSlug: prev.recommendedSlug || seoMetadata.slug
        }))
      }

      // Save to database
      const { data, error: saveError } = await supabase
        .from('content')
        .insert({
          title: metadata.title,
          description: metadata.description,
          brand_id: metadata.brandId,
          content_type: metadata.type,
          content: content,
          metadata: {
            emailType: metadata.emailType,
            subject: metadata.subject,
            previewText: metadata.previewText,
            contentSource: metadata.contentSource,
            sourceUrl: metadata.sourceUrl,
            sourceText: metadata.sourceText,
            abTesting: metadata.abTesting,
            abVariations: metadata.abVariations,
            seoTitle: metadata.seoTitle,
            seoDescription: metadata.seoDescription,
            recommendedSlug: metadata.recommendedSlug
          },
          status: 'draft',
          optimization_url: metadata.optimizationUrl,
          optimization_feedback: metadata.optimizationFeedback
        })
        .select()
        .single()

      if (saveError) throw saveError

      router.push(`/content/${data.id}`)
    } catch (err) {
      console.error('Error generating email content:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate email content')
    } finally {
      setLoading(false)
    }
  }

  const addAbVariation = () => {
    setMetadata(prev => ({
      ...prev,
      abVariations: [
        ...prev.abVariations,
        { subject: '', previewText: '' }
      ]
    }))
  }

  const updateAbVariation = (index: number, field: keyof EmailMetadata['abVariations'][0], value: string) => {
    setMetadata(prev => ({
      ...prev,
      abVariations: prev.abVariations.map((variation, i) => 
        i === index ? { ...variation, [field]: value } : variation
      )
    }))
  }

  const removeAbVariation = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      abVariations: prev.abVariations.filter((_, i) => i !== index)
    }))
  }

  const isValid = () => {
    return metadata.title &&
           metadata.description &&
           metadata.emailType &&
           metadata.subject &&
           metadata.previewText &&
           ((metadata.contentSource === 'link' && metadata.sourceUrl) ||
            (metadata.contentSource === 'freeform' && metadata.sourceText))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create Email Content</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email Title</Label>
              <Input
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter email title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Type</label>
              <SelectNative
                value={metadata.emailType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetadata(prev => ({ ...prev, emailType: e.target.value }))}
                className="w-full"
              >
                <option value="">Select an email type</option>
                <option value="welcome">Welcome Email</option>
                <option value="newsletter">Newsletter</option>
                <option value="promotional">Promotional</option>
                <option value="transactional">Transactional</option>
              </SelectNative>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter email description"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Subject Line</Label>
              <Input
                value={metadata.subject}
                onChange={(e) => setMetadata(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject line"
              />
            </div>

            <div>
              <Label>Preview Text</Label>
              <Input
                value={metadata.previewText}
                onChange={(e) => setMetadata(prev => ({ ...prev, previewText: e.target.value }))}
                placeholder="Enter preview text"
              />
            </div>

            <div>
              <Label>Content Source</Label>
              <SelectNative
                value={metadata.contentSource}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetadata(prev => ({ ...prev, contentSource: e.target.value as 'link' | 'freeform' }))}
                className="w-full mb-4"
              >
                <option value="freeform">Freeform Text</option>
                <option value="link">URL Link</option>
              </SelectNative>

              {metadata.contentSource === 'link' ? (
                <Input
                  value={metadata.sourceUrl}
                  onChange={(e) => setMetadata(prev => ({ ...prev, sourceUrl: e.target.value }))}
                  placeholder="Enter source URL"
                />
              ) : (
                <Textarea
                  value={metadata.sourceText}
                  onChange={(e) => setMetadata(prev => ({ ...prev, sourceText: e.target.value }))}
                  placeholder="Enter email content"
                  rows={8}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>A/B Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="abTesting"
                checked={metadata.abTesting}
                onChange={(e) => setMetadata(prev => ({ ...prev, abTesting: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="abTesting">Enable A/B Testing</Label>
            </div>

            {metadata.abTesting && (
              <div className="space-y-4">
                {metadata.abVariations.map((variation, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Variation {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAbVariation(index)}
                      >
                        ×
                      </Button>
                    </div>
                    <div>
                      <Label>Subject Line</Label>
                      <Input
                        value={variation.subject}
                        onChange={(e) => updateAbVariation(index, 'subject', e.target.value)}
                        placeholder="Enter subject line variation"
                      />
                    </div>
                    <div>
                      <Label>Preview Text</Label>
                      <Input
                        value={variation.previewText}
                        onChange={(e) => updateAbVariation(index, 'previewText', e.target.value)}
                        placeholder="Enter preview text variation"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addAbVariation}
                  className="w-full"
                >
                  Add Variation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>SEO Title</Label>
              <Input
                value={metadata.seoTitle}
                onChange={(e) => setMetadata(prev => ({ ...prev, seoTitle: e.target.value }))}
                placeholder="Enter SEO title"
              />
            </div>

            <div>
              <Label>SEO Description</Label>
              <Textarea
                value={metadata.seoDescription}
                onChange={(e) => setMetadata(prev => ({ ...prev, seoDescription: e.target.value }))}
                placeholder="Enter SEO description"
                rows={3}
              />
            </div>

            <div>
              <Label>URL Slug</Label>
              <Input
                value={metadata.recommendedSlug}
                onChange={(e) => setMetadata(prev => ({ ...prev, recommendedSlug: e.target.value }))}
                placeholder="Enter URL slug"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateContent}
            disabled={!isValid() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Email Content'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 