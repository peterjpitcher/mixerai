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

interface EmailMetadata {
  title: string
  description: string
  brandId: string
  subject: string
  previewText: string
  fromName: string
  fromEmail: string
  replyTo: string
  segments: string[]
  template: string
  content: {
    header: string
    body: string
    footer: string
  }
  callToAction: {
    text: string
    url: string
  }
  scheduledDate?: string
  testEmails: string[]
  trackingParameters: {
    utm_source: string
    utm_medium: string
    utm_campaign: string
    utm_content?: string
  }
}

const emailTemplates = [
  'newsletter',
  'promotional',
  'announcement',
  'welcome',
  'product-update',
  'event-invitation',
  'survey',
  'custom'
]

const defaultTrackingParams = {
  utm_source: 'email',
  utm_medium: 'email',
  utm_campaign: '',
  utm_content: ''
}

export default function CreateEmailPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [metadata, setMetadata] = useState<EmailMetadata>({
    title: '',
    description: '',
    brandId: '',
    subject: '',
    previewText: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    segments: [],
    template: 'newsletter',
    content: {
      header: '',
      body: '',
      footer: ''
    },
    callToAction: {
      text: '',
      url: ''
    },
    testEmails: [],
    trackingParameters: defaultTrackingParams
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

  const handleSaveEmail = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('content')
        .insert({
          title: metadata.title,
          description: metadata.description,
          brand_id: metadata.brandId,
          content_type: 'email',
          subject: metadata.subject,
          preview_text: metadata.previewText,
          from_name: metadata.fromName,
          from_email: metadata.fromEmail,
          reply_to: metadata.replyTo,
          segments: metadata.segments,
          template: metadata.template,
          content: metadata.content,
          call_to_action: metadata.callToAction,
          scheduled_date: metadata.scheduledDate,
          test_emails: metadata.testEmails,
          tracking_parameters: metadata.trackingParameters,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/content/${data.id}`)
    } catch (err) {
      console.error('Error saving email:', err)
      setError('Failed to save email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Email</CardTitle>
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
              placeholder="Internal description of this email"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject Line</label>
              <Input
                value={metadata.subject}
                onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preview Text</label>
              <Input
                value={metadata.previewText}
                onChange={(e) => setMetadata({ ...metadata, previewText: e.target.value })}
                placeholder="Preview text shown in inbox"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From Name</label>
              <Input
                value={metadata.fromName}
                onChange={(e) => setMetadata({ ...metadata, fromName: e.target.value })}
                placeholder="Sender name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From Email</label>
              <Input
                type="email"
                value={metadata.fromEmail}
                onChange={(e) => setMetadata({ ...metadata, fromEmail: e.target.value })}
                placeholder="sender@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reply-To</label>
              <Input
                type="email"
                value={metadata.replyTo}
                onChange={(e) => setMetadata({ ...metadata, replyTo: e.target.value })}
                placeholder="replies@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Template</label>
            <Select
              value={metadata.template}
              onChange={(e) => setMetadata({ ...metadata, template: e.target.value })}
              className="w-full"
            >
              {emailTemplates.map((template) => (
                <option key={template} value={template}>
                  {template.charAt(0).toUpperCase() + template.slice(1).replace('-', ' ')}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email Content</label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Header</label>
                <Textarea
                  value={metadata.content.header}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    content: { ...metadata.content, header: e.target.value }
                  })}
                  placeholder="Email header content"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Body</label>
                <Textarea
                  value={metadata.content.body}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    content: { ...metadata.content, body: e.target.value }
                  })}
                  placeholder="Main email content"
                  rows={6}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Footer</label>
                <Textarea
                  value={metadata.content.footer}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    content: { ...metadata.content, footer: e.target.value }
                  })}
                  placeholder="Email footer content"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Call to Action Text</label>
              <Input
                value={metadata.callToAction.text}
                onChange={(e) => setMetadata({
                  ...metadata,
                  callToAction: { ...metadata.callToAction, text: e.target.value }
                })}
                placeholder="Button text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Call to Action URL</label>
              <Input
                value={metadata.callToAction.url}
                onChange={(e) => setMetadata({
                  ...metadata,
                  callToAction: { ...metadata.callToAction, url: e.target.value }
                })}
                placeholder="https://example.com/landing-page"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Segments</label>
            <Textarea
              value={metadata.segments.join('\n')}
              onChange={(e) => setMetadata({
                ...metadata,
                segments: e.target.value.split('\n').map(s => s.trim()).filter(s => s)
              })}
              placeholder="Enter recipient segments (one per line)"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Test Email Addresses</label>
            <Textarea
              value={metadata.testEmails.join('\n')}
              onChange={(e) => setMetadata({
                ...metadata,
                testEmails: e.target.value.split('\n').map(e => e.trim()).filter(e => e)
              })}
              placeholder="Enter test email addresses (one per line)"
              rows={2}
            />
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
                  placeholder="e.g. hero-banner"
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
              onClick={handleSaveEmail}
              disabled={loading || !metadata.title || !metadata.brandId || !metadata.subject}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Email
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