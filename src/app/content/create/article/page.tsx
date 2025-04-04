'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowLeft, ArrowRight, Plus, Trash, Wand2 } from 'lucide-react'
import { generateKeywords, generateDescription } from '@/lib/openai'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface ArticleMetadata {
  title: string
  description: string
  brandId: string
  primaryKeyword: string
  secondaryKeywords: string[]
  targetAudience: string
  wordCount: number
  tone: string
  format: string
  category: string
  tags: string[]
  seo: {
    metaTitle: string
    metaDescription: string
    canonicalUrl?: string
    focusKeyphrase: string
  }
  references: Array<{
    title: string
    url: string
  }>
  images: Array<{
    url: string
    alt: string
    caption?: string
  }>
  publishDate?: string
  status: 'draft' | 'review' | 'scheduled' | 'published'
  articleType: string
}

const toneOptions = [
  'professional',
  'conversational',
  'educational',
  'humorous',
  'inspirational',
  'persuasive'
]

const formatOptions = [
  'how-to',
  'listicle',
  'guide',
  'opinion',
  'news',
  'case-study',
  'interview',
  'review'
]

const categoryOptions = [
  'Technology',
  'Business',
  'Health',
  'Lifestyle',
  'Food',
  'Travel',
  'Entertainment',
  'Education',
  'Other'
]

export default function CreateArticlePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatingPrimaryKeyword, setGeneratingPrimaryKeyword] = useState(false)
  const [generatingSecondaryKeywords, setGeneratingSecondaryKeywords] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [showPrimaryKeywordConfirm, setShowPrimaryKeywordConfirm] = useState(false)
  const [showSecondaryKeywordsConfirm, setShowSecondaryKeywordsConfirm] = useState(false)
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [metadata, setMetadata] = useState<ArticleMetadata>({
    title: searchParams?.get('title') || '',
    description: '',
    brandId: searchParams?.get('brandId') || '',
    primaryKeyword: '',
    secondaryKeywords: [],
    targetAudience: '',
    wordCount: 1000,
    tone: 'professional',
    format: 'how-to',
    category: '',
    tags: [],
    seo: {
      metaTitle: '',
      metaDescription: '',
      focusKeyphrase: ''
    },
    references: [],
    images: [],
    status: 'draft',
    articleType: searchParams?.get('articleType') || ''
  })

  useEffect(() => {
    // Check if we have all required parameters
    if (!metadata.title || !metadata.brandId || !metadata.articleType) {
      router.push('/content/create')
    }
  }, [metadata.title, metadata.brandId, metadata.articleType, router])

  useEffect(() => {
    if (metadata.brandId) {
      loadBrands()
    }
  }, [metadata.brandId])

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name')

      if (error) throw error
      setBrands(data || [])
    } catch (err) {
      console.error('Error loading brands:', err)
      setError('Failed to load brands')
    }
  }

  const handleGeneratePrimaryKeyword = async () => {
    try {
      setGeneratingPrimaryKeyword(true)
      setError(null)
      const result = await generateKeywords(metadata.title, metadata.articleType)
      setMetadata({
        ...metadata,
        primaryKeyword: result.primary
      })
    } catch (err) {
      console.error('Error generating primary keyword:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate primary keyword')
    } finally {
      setGeneratingPrimaryKeyword(false)
    }
  }

  const handleGenerateSecondaryKeywords = async () => {
    try {
      setGeneratingSecondaryKeywords(true)
      setError(null)
      const result = await generateKeywords(metadata.title, metadata.articleType)
      setMetadata({
        ...metadata,
        secondaryKeywords: result.secondary || []
      })
    } catch (err) {
      console.error('Error generating secondary keywords:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate secondary keywords')
    } finally {
      setGeneratingSecondaryKeywords(false)
    }
  }

  const handleGenerateDescription = async () => {
    try {
      setGeneratingDescription(true)
      setError(null)
      const description = await generateDescription(metadata.title, metadata.primaryKeyword)
      setMetadata({
        ...metadata,
        description
      })
    } catch (err) {
      console.error('Error generating description:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate description')
    } finally {
      setGeneratingDescription(false)
    }
  }

  const handleSaveArticle = async () => {
    try {
      setLoading(true)
      setError(null)

      // Save content to the database with only the fields that exist in the schema
      const { data, error: saveError } = await supabase
        .from('content')
        .insert({
          title: metadata.title,
          description: metadata.description,
          brand_id: metadata.brandId,
          content_type: 'article',
          primary_keyword: metadata.primaryKeyword,
          secondary_keywords: metadata.secondaryKeywords,
          content: '',
          status: 'draft'
        })
        .select('*')
        .single()

      if (saveError) {
        console.error('Database error:', saveError)
        throw new Error(saveError.message)
      }

      if (!data) {
        throw new Error('No data returned from insert')
      }

      // Navigate to the content editor
      router.push(`/content/${data.id}`)
    } catch (err) {
      console.error('Error saving article:', err)
      setError(err instanceof Error ? err.message : 'Failed to save article')
    } finally {
      setLoading(false)
    }
  }

  const addReference = () => {
    setMetadata({
      ...metadata,
      references: [...metadata.references, { title: '', url: '' }]
    })
  }

  const removeReference = (index: number) => {
    setMetadata({
      ...metadata,
      references: metadata.references.filter((_, i) => i !== index)
    })
  }

  const updateReference = (index: number, field: 'title' | 'url', value: string) => {
    const newReferences = [...metadata.references]
    newReferences[index] = { ...newReferences[index], [field]: value }
    setMetadata({ ...metadata, references: newReferences })
  }

  const addImage = () => {
    setMetadata({
      ...metadata,
      images: [...metadata.images, { url: '', alt: '' }]
    })
  }

  const removeImage = (index: number) => {
    setMetadata({
      ...metadata,
      images: metadata.images.filter((_, i) => i !== index)
    })
  }

  const updateImage = (index: number, field: 'url' | 'alt' | 'caption', value: string) => {
    const newImages = [...metadata.images]
    newImages[index] = { ...newImages[index], [field]: value }
    setMetadata({ ...metadata, images: newImages })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Article</CardTitle>
          <CardDescription>
            Add SEO details for your article
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Article Title</label>
            <Input
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              placeholder="Enter article title"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Primary Keyword</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (metadata.primaryKeyword) {
                    setShowPrimaryKeywordConfirm(true)
                  } else {
                    handleGeneratePrimaryKeyword()
                  }
                }}
                disabled={generatingPrimaryKeyword}
              >
                {generatingPrimaryKeyword ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Generate Primary Keyword
              </Button>
            </div>
            <Input
              value={metadata.primaryKeyword}
              onChange={(e) => setMetadata({ ...metadata, primaryKeyword: e.target.value })}
              placeholder="Main keyword for SEO"
              className="bg-white text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Secondary Keywords</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (metadata.secondaryKeywords.length > 0) {
                    setShowSecondaryKeywordsConfirm(true)
                  } else {
                    handleGenerateSecondaryKeywords()
                  }
                }}
                disabled={generatingSecondaryKeywords}
              >
                {generatingSecondaryKeywords ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Generate Secondary Keywords
              </Button>
            </div>
            <Textarea
              value={metadata.secondaryKeywords.join(', ')}
              onChange={(e) => setMetadata({
                ...metadata,
                secondaryKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
              })}
              placeholder="Additional keywords, separated by commas"
              rows={2}
              className="bg-white text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Description</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={generatingDescription || !metadata.primaryKeyword}
              >
                {generatingDescription ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Generate Description
              </Button>
            </div>
            <Textarea
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              placeholder="Brief description of the article"
              rows={3}
              className="bg-white text-gray-900"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleSaveArticle}
              disabled={loading || !metadata.title || !metadata.primaryKeyword || !metadata.description}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Continue to Editor'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showPrimaryKeywordConfirm} onOpenChange={setShowPrimaryKeywordConfirm}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Generate New Primary Keyword?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This will replace your existing primary keyword. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowPrimaryKeywordConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowPrimaryKeywordConfirm(false)
              handleGeneratePrimaryKeyword()
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSecondaryKeywordsConfirm} onOpenChange={setShowSecondaryKeywordsConfirm}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Generate New Secondary Keywords?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This will replace your existing secondary keywords. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSecondaryKeywordsConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowSecondaryKeywordsConfirm(false)
              handleGenerateSecondaryKeywords()
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 