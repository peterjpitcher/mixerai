'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export default function MetadataGenerationPage() {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('')
  const [generatedMetadata, setGeneratedMetadata] = useState<{
    title: string
    description: string
    keywords: string[]
    ogImage: string
    ogTitle: string
    ogDescription: string
  } | null>(null)

  const handleGenerateMetadata = async () => {
    try {
      setLoading(true)
      // TODO: Implement metadata generation logic
      // This will be implemented in a future update
      setGeneratedMetadata({
        title: 'Sample Title',
        description: 'Sample description for the page...',
        keywords: ['sample', 'keywords'],
        ogImage: 'https://example.com/image.jpg',
        ogTitle: 'Sample OG Title',
        ogDescription: 'Sample OG description'
      })
    } catch (error) {
      console.error('Error generating metadata:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Metadata Generation</h1>
        <p className="text-gray-500">Generate optimized metadata for your content</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate Metadata</CardTitle>
          <CardDescription>Enter a URL or paste your content to generate optimized metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Enter URL or paste content"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerateMetadata}
              disabled={!url.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Metadata'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedMetadata && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Metadata</CardTitle>
            <CardDescription>Copy and use these optimized metadata tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input value={generatedMetadata.title} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea value={generatedMetadata.description} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Keywords</label>
                <Input value={generatedMetadata.keywords.join(', ')} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Open Graph Title</label>
                <Input value={generatedMetadata.ogTitle} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Open Graph Description</label>
                <Textarea value={generatedMetadata.ogDescription} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Open Graph Image</label>
                <Input value={generatedMetadata.ogImage} readOnly />
              </div>
              <Button
                onClick={() => {
                  const metadata = `
<title>${generatedMetadata.title}</title>
<meta name="description" content="${generatedMetadata.description}" />
<meta name="keywords" content="${generatedMetadata.keywords.join(', ')}" />
<meta property="og:title" content="${generatedMetadata.ogTitle}" />
<meta property="og:description" content="${generatedMetadata.ogDescription}" />
<meta property="og:image" content="${generatedMetadata.ogImage}" />
                  `.trim()
                  navigator.clipboard.writeText(metadata)
                }}
                variant="outline"
                className="w-full"
              >
                Copy All Metadata
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 