'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowLeft, ArrowRight, Plus, Trash } from 'lucide-react'

interface SocialMetadata {
  title: string
  description: string
  brandId: string
  platform: string
  content: string
  hashtags: string[]
  mentions: string[]
  mediaUrls: string[]
  scheduledDate?: string
  linkUrl?: string
  linkTitle?: string
  callToAction: string
  targetAudience: string
  campaignName: string
  postType: string
  tone: string
  trackingParameters: {
    utm_source: string
    utm_medium: string
    utm_campaign: string
    utm_content?: string
  }
}

const socialPlatforms = [
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'tiktok',
  'pinterest'
]

const postTypes = [
  'image',
  'carousel',
  'video',
  'story',
  'reel',
  'link',
  'text'
]

const toneOptions = [
  'casual',
  'professional',
  'friendly',
  'humorous',
  'inspirational',
  'educational'
]

export default function CreateSocialPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [metadata, setMetadata] = useState<SocialMetadata>({
    title: '',
    description: '',
    brandId: '',
    platform: '',
    content: '',
    hashtags: [],
    mentions: [],
    mediaUrls: [],
    callToAction: '',
    targetAudience: '',
    campaignName: '',
    postType: 'image',
    tone: 'casual',
    trackingParameters: {
      utm_source: 'social',
      utm_medium: '',
      utm_campaign: '',
      utm_content: ''
    }
  })

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

  const handleSaveSocialPost = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('content')
        .insert({
          title: metadata.title,
          description: metadata.description,
          brand_id: metadata.brandId,
          content_type: 'social',
          platform: metadata.platform,
          content: metadata.content,
          hashtags: metadata.hashtags,
          mentions: metadata.mentions,
          media_urls: metadata.mediaUrls,
          scheduled_date: metadata.scheduledDate,
          link_url: metadata.linkUrl,
          link_title: metadata.linkTitle,
          call_to_action: metadata.callToAction,
          target_audience: metadata.targetAudience,
          campaign_name: metadata.campaignName,
          post_type: metadata.postType,
          tone: metadata.tone,
          tracking_parameters: metadata.trackingParameters,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/content/${data.id}`)
    } catch (err) {
      console.error('Error saving social post:', err)
      setError('Failed to save social post')
    } finally {
      setLoading(false)
    }
  }

  const addMediaUrl = () => {
    setMetadata({
      ...metadata,
      mediaUrls: [...metadata.mediaUrls, '']
    })
  }

  const removeMediaUrl = (index: number) => {
    setMetadata({
      ...metadata,
      mediaUrls: metadata.mediaUrls.filter((_, i) => i !== index)
    })
  }

  const updateMediaUrl = (index: number, value: string) => {
    const newMediaUrls = [...metadata.mediaUrls]
    newMediaUrls[index] = value
    setMetadata({ ...metadata, mediaUrls: newMediaUrls })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Social Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <Select
              value={metadata.brandId}
              onChange={(e) => setMetadata({ ...metadata, brandId: e.target.value })}
              className="w-full"
            >
              <option value="">Select a brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Internal Title</label>
            <Input
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              placeholder="Internal reference title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              placeholder="Internal description of this post"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <Select
                value={metadata.platform}
                onChange={(e) => setMetadata({ ...metadata, platform: e.target.value })}
                className="w-full"
              >
                <option value="">Select platform</option>
                {socialPlatforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Post Type</label>
              <Select
                value={metadata.postType}
                onChange={(e) => setMetadata({ ...metadata, postType: e.target.value })}
                className="w-full"
              >
                {postTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Post Content</label>
            <Textarea
              value={metadata.content}
              onChange={(e) => setMetadata({ ...metadata, content: e.target.value })}
              placeholder="Enter your post content"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hashtags</label>
              <Textarea
                value={metadata.hashtags.join('\n')}
                onChange={(e) => setMetadata({
                  ...metadata,
                  hashtags: e.target.value.split('\n').map(h => h.trim().replace(/^#/, '')).filter(h => h)
                })}
                placeholder="Enter hashtags (one per line, without #)"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mentions</label>
              <Textarea
                value={metadata.mentions.join('\n')}
                onChange={(e) => setMetadata({
                  ...metadata,
                  mentions: e.target.value.split('\n').map(m => m.trim().replace(/^@/, '')).filter(m => m)
                })}
                placeholder="Enter mentions (one per line, without @)"
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Media URLs</label>
            <div className="space-y-2">
              {metadata.mediaUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => updateMediaUrl(index, e.target.value)}
                    placeholder="Enter media URL"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeMediaUrl(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addMediaUrl}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Media URL
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Link URL</label>
              <Input
                value={metadata.linkUrl || ''}
                onChange={(e) => setMetadata({ ...metadata, linkUrl: e.target.value })}
                placeholder="https://example.com/landing-page"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link Title</label>
              <Input
                value={metadata.linkTitle || ''}
                onChange={(e) => setMetadata({ ...metadata, linkTitle: e.target.value })}
                placeholder="Link display text"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Call to Action</label>
              <Input
                value={metadata.callToAction}
                onChange={(e) => setMetadata({ ...metadata, callToAction: e.target.value })}
                placeholder="What should users do?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Audience</label>
              <Input
                value={metadata.targetAudience}
                onChange={(e) => setMetadata({ ...metadata, targetAudience: e.target.value })}
                placeholder="Who is this post for?"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Name</label>
              <Input
                value={metadata.campaignName}
                onChange={(e) => setMetadata({ ...metadata, campaignName: e.target.value })}
                placeholder="Campaign identifier"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tone</label>
              <Select
                value={metadata.tone}
                onChange={(e) => setMetadata({ ...metadata, tone: e.target.value })}
                className="w-full"
              >
                {toneOptions.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scheduled Date (optional)</label>
            <Input
              type="datetime-local"
              value={metadata.scheduledDate || ''}
              onChange={(e) => setMetadata({ ...metadata, scheduledDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tracking Parameters</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Campaign Name</label>
                <Input
                  value={metadata.trackingParameters.utm_campaign}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    trackingParameters: {
                      ...metadata.trackingParameters,
                      utm_campaign: e.target.value
                    }
                  })}
                  placeholder="e.g. summer-sale-2024"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Content Identifier</label>
                <Input
                  value={metadata.trackingParameters.utm_content}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    trackingParameters: {
                      ...metadata.trackingParameters,
                      utm_content: e.target.value
                    }
                  })}
                  placeholder="e.g. hero-post"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveSocialPost}
              disabled={loading || !metadata.title || !metadata.brandId || !metadata.platform || !metadata.content}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Post
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 