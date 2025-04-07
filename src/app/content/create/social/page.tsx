'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { SelectNative } from '@/components/ui/select-native'

interface SocialMetadata {
  title: string
  description: string
  brandId: string
  type: string
  platforms: string[]
  postType: string
  content: string
  hashtags: string[]
  mediaUrls: string[]
  seoTitle: string
  seoDescription: string
  recommendedSlug: string
  optimizationUrl?: string
  optimizationFeedback?: string
  platform: string
  contentSource: 'link' | 'freeform'
  url?: string
}

const platforms = [
  { id: 'twitter', name: 'Twitter', charLimit: 280 },
  { id: 'linkedin', name: 'LinkedIn', charLimit: 3000 },
  { id: 'facebook', name: 'Facebook', charLimit: 63206 },
  { id: 'instagram', name: 'Instagram', charLimit: 2200 }
]

const postTypes = [
  { id: 'product', name: 'Product Highlight' },
  { id: 'recipe', name: 'Recipe Share' },
  { id: 'tips', name: 'Tips & Tricks' },
  { id: 'announcement', name: 'Announcement' },
  { id: 'behind-scenes', name: 'Behind the Scenes' },
  { id: 'user-content', name: 'User-Generated Content' }
]

const platformLimits: Record<string, number> = {
  twitter: 280,
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
  tiktok: 2200,
  pinterest: 500
}

export default function CreateSocialPostPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<SocialMetadata>({
    title: searchParams.get('title') || '',
    description: '',
    brandId: searchParams.get('brandId') || '',
    type: 'social',
    platforms: [],
    postType: '',
    content: '',
    hashtags: [],
    mediaUrls: [],
    seoTitle: searchParams.get('seoTitle') || '',
    seoDescription: searchParams.get('seoDescription') || '',
    recommendedSlug: searchParams.get('recommendedSlug') || '',
    optimizationUrl: searchParams.get('url') || '',
    optimizationFeedback: searchParams.get('feedback') || '',
    platform: '',
    contentSource: 'freeform',
    url: searchParams.get('url') || ''
  })
  const [newHashtag, setNewHashtag] = useState('')
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [charCount, setCharCount] = useState(0)
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0])

  useEffect(() => {
    if (!metadata.brandId) {
      router.push('/content/create')
    }
  }, [metadata.brandId, router])

  useEffect(() => {
    setCharCount(metadata.content.length)
  }, [metadata.content])

  const handlePlatformToggle = (platformId: string) => {
    setMetadata(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }))
  }

  const addHashtag = () => {
    if (!newHashtag.trim()) return
    const hashtag = newHashtag.trim().startsWith('#') ? newHashtag.trim() : `#${newHashtag.trim()}`
    setMetadata(prev => ({
      ...prev,
      hashtags: prev.hashtags.includes(hashtag) ? prev.hashtags : [...prev.hashtags, hashtag]
    }))
    setNewHashtag('')
  }

  const removeHashtag = (hashtag: string) => {
    setMetadata(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(h => h !== hashtag)
    }))
  }

  const addMediaUrl = () => {
    if (!newMediaUrl.trim()) return
    setMetadata(prev => ({
      ...prev,
      mediaUrls: [...prev.mediaUrls, newMediaUrl.trim()]
    }))
    setNewMediaUrl('')
  }

  const removeMediaUrl = (url: string) => {
    setMetadata(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter(u => u !== url)
    }))
  }

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
          action: 'generateSocialContent',
          metadata
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to generate social content')
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
            platforms: metadata.platforms,
            postType: metadata.postType,
            content: metadata.content,
            hashtags: metadata.hashtags,
            mediaUrls: metadata.mediaUrls,
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
      console.error('Error generating social content:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate social content')
    } finally {
      setLoading(false)
    }
  }

  const isValid = () => {
    return metadata.title &&
           metadata.description &&
           metadata.platforms.length > 0 &&
           metadata.postType &&
           metadata.content &&
           charCount <= selectedPlatform.charLimit
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create Social Post Content</h1>

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
              <Label>Post Title</Label>
              <Input
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Post Type</label>
              <SelectNative
                value={metadata.postType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetadata(prev => ({ ...prev, postType: e.target.value }))}
                className="w-full"
              >
                <option value="">Select a post type</option>
                <option value="text">Text Post</option>
                <option value="image">Image Post</option>
                <option value="video">Video Post</option>
                <option value="link">Link Share</option>
                <option value="poll">Poll</option>
                <option value="carousel">Carousel</option>
                <option value="story">Story</option>
                <option value="reel">Reel</option>
              </SelectNative>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter post description"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platforms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {platforms.map(platform => (
                <div
                  key={platform.id}
                  className={`p-4 border rounded cursor-pointer transition-colors ${
                    metadata.platforms.includes(platform.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                  onClick={() => handlePlatformToggle(platform.id)}
                >
                  <div className="font-medium">{platform.name}</div>
                  <div className="text-sm text-gray-500">Max {platform.charLimit} characters</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <SelectNative
                value={metadata.platform}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetadata(prev => ({ ...prev, platform: e.target.value }))}
                className="w-full"
              >
                <option value="">Select a platform</option>
                <option value="twitter">Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="pinterest">Pinterest</option>
              </SelectNative>
              <p className={`text-sm mt-1 ${charCount > platformLimits[metadata.platform] ? 'text-red-500' : 'text-gray-500'}`}>
                {charCount}/{platformLimits[metadata.platform] || '∞'} characters
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Post Content</Label>
                <span className={`text-sm ${
                  charCount > selectedPlatform.charLimit ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {charCount}/{selectedPlatform.charLimit}
                </span>
              </div>
              <Textarea
                value={metadata.content}
                onChange={(e) => setMetadata(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your post content"
                rows={6}
              />
            </div>

            <div>
              <Label>Hashtags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  placeholder="Add a hashtag"
                  onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                />
                <Button onClick={addHashtag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.hashtags.map(hashtag => (
                  <div
                    key={hashtag}
                    className="flex items-center gap-1 bg-secondary/20 px-2 py-1 rounded"
                  >
                    <span>{hashtag}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHashtag(hashtag)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Media URLs</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="Add a media URL"
                  onKeyPress={(e) => e.key === 'Enter' && addMediaUrl()}
                />
                <Button onClick={addMediaUrl}>Add</Button>
              </div>
              <div className="space-y-2">
                {metadata.mediaUrls.map(url => (
                  <div
                    key={url}
                    className="flex items-center gap-2 bg-secondary/20 p-2 rounded"
                  >
                    <span className="flex-1 truncate">{url}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMediaUrl(url)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
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
              'Generate Social Content'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 