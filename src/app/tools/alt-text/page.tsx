'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload } from 'lucide-react'
import Image from 'next/image'

export default function AltTextGenerationPage() {
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [generatedAltText, setGeneratedAltText] = useState<{
    shortDescription: string
    longDescription: string
    keywords: string[]
    context: string
  } | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateAltText = async () => {
    try {
      setLoading(true)
      // TODO: Implement alt text generation logic
      // This will be implemented in a future update
      setGeneratedAltText({
        shortDescription: 'A person walking on a beach at sunset',
        longDescription: 'A silhouetted figure walks along a sandy beach as the sun sets over the ocean, casting orange and purple hues across the sky and reflecting off the calm water.',
        keywords: ['beach', 'sunset', 'silhouette', 'ocean', 'walking'],
        context: 'Travel and lifestyle photography showing peaceful, serene moments in nature.'
      })
    } catch (error) {
      console.error('Error generating alt text:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Alt Text Generation</h1>
        <p className="text-gray-500">Generate descriptive alt text for your images</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
          <CardDescription>Upload an image or provide a URL to generate alt text</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 mb-2 text-gray-500" />
                    <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  </div>
                </label>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-500">OR</span>
              </div>
              <Input
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            {imageUrl && (
              <div className="mt-4">
                <Image
                  src={imageUrl}
                  alt={typeof generatedAltText === 'string' ? generatedAltText : 'Image preview'}
                  width={400}
                  height={300}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            )}
            <Button
              onClick={handleGenerateAltText}
              disabled={!imageUrl || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                'Generate Alt Text'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedAltText && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Alt Text</CardTitle>
            <CardDescription>Copy and use these descriptions for your image</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Short Description (Alt Text)</label>
                <Input value={generatedAltText.shortDescription} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Long Description (For detailed accessibility)</label>
                <Textarea value={generatedAltText.longDescription} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Keywords</label>
                <Input value={generatedAltText.keywords.join(', ')} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Context</label>
                <Input value={generatedAltText.context} readOnly />
              </div>
              <Button
                onClick={() => {
                  const altText = `
Short Description: ${generatedAltText.shortDescription}
Long Description: ${generatedAltText.longDescription}
Keywords: ${generatedAltText.keywords.join(', ')}
Context: ${generatedAltText.context}
                  `.trim()
                  navigator.clipboard.writeText(altText)
                }}
                variant="outline"
                className="w-full"
              >
                Copy All Text
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 