'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { Loader2, ChevronRight, ChevronLeft, Save } from 'lucide-react'
import { SelectNative } from '@/components/ui/select-native'

const contentTypes = [
  { id: 'article', name: 'Editorial Article' },
  { id: 'recipe', name: 'Recipe' },
  { id: 'pdp', name: 'Product Description' },
  { id: 'category', name: 'Category Page' },
  { id: 'retailer_pdp', name: 'Retailer Product Description' },
] as const

const metadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  keywords: z.string().min(1, 'Keywords are required'),
  description: z.string().min(1, 'Description is required'),
  brandId: z.string().uuid('Please select a brand'),
})

type MetadataFormData = z.infer<typeof metadataSchema>

interface ContentCreationWizardProps {
  onComplete?: (data: any) => void
  onSaveDraft?: (data: any) => void
}

export default function ContentCreationWizard({
  onComplete,
  onSaveDraft,
}: ContentCreationWizardProps) {
  const { supabase, user, userPermissions } = useSupabase()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MetadataFormData>({
    resolver: zodResolver(metadataSchema),
  })

  // Fetch available brands for the user
  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name')

      if (error) throw error
      setBrands(data || [])
    } catch (error) {
      console.error('Error fetching brands:', error)
      setError('Failed to load brands')
    }
  }

  // Handle content type selection
  const handleContentTypeSelect = (type: string) => {
    setSelectedContentType(type)
    setCurrentStep(2)
  }

  // Handle metadata submission
  const onMetadataSubmit = async (data: MetadataFormData) => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Call AI generation endpoint
      setGeneratedContent('Sample generated content...')
      setCurrentStep(4)
    } catch (error) {
      console.error('Error generating content:', error)
      setError('Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  // Handle draft save
  const handleSaveDraft = async () => {
    if (onSaveDraft) {
      onSaveDraft({
        contentType: selectedContentType,
        metadata: watch(),
        generatedContent,
      })
    }
  }

  // Handle final submission
  const handleComplete = async () => {
    if (onComplete) {
      onComplete({
        contentType: selectedContentType,
        metadata: watch(),
        generatedContent,
      })
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      {/* Progress Indicator */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
          <div
            style={{ width: `${(currentStep / 5) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Select Type</span>
          <span>Metadata</span>
          <span>Assets</span>
          <span>Generate</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step 1: Content Type Selection */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleContentTypeSelect(type.id)}
              className="p-6 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">{type.name}</h3>
              <p className="text-sm text-gray-400">
                Create a new {type.name.toLowerCase()}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Metadata Input */}
      {currentStep === 2 && (
        <form onSubmit={handleSubmit(onMetadataSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                {...register('keywords')}
                className={errors.keywords ? 'border-red-500' : ''}
              />
              {errors.keywords && (
                <p className="mt-1 text-sm text-red-500">{errors.keywords.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                className={`w-full rounded-md border ${
                  errors.description ? 'border-red-500' : 'border-gray-700'
                } bg-gray-800 px-3 py-2 text-sm`}
                rows={4}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="brandId" className="block text-sm font-medium">Brand</label>
              <SelectNative
                id="brandId"
                {...register('brandId')}
                className={errors.brandId ? 'border-red-500' : ''}
              >
                <option value="">Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </SelectNative>
              {errors.brandId && (
                <p className="text-sm text-red-500">{errors.brandId.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4" />
                )}
                Next
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Step 3: Asset Upload (Optional) */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">
              Drag and drop files here, or click to select files
            </p>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(2)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => setCurrentStep(4)}>
              <ChevronRight className="mr-2 h-4 w-4" />
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Generated Content Preview */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Generated Content</h3>
            <div className="prose prose-invert max-w-none">
              {generatedContent}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(3)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Submit for Review'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 