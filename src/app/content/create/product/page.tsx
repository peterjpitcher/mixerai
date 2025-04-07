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

interface ProductMetadata {
  title: string
  description: string
  brandId: string
  type: string
  category: string
  usps: string[]
  features: string[]
  ingredients: string[]
  nutritionalInfo: string
  allergens: string[]
  seoTitle: string
  seoDescription: string
  recommendedSlug: string
  optimizationUrl?: string
  optimizationFeedback?: string
}

const productCategories = [
  { id: 'food-beverage', name: 'Food & Beverage' },
  { id: 'snacks', name: 'Snacks & Confectionery' },
  { id: 'condiments', name: 'Condiments & Sauces' },
  { id: 'baking', name: 'Baking & Cooking' },
  { id: 'breakfast', name: 'Breakfast & Cereal' },
  { id: 'pantry', name: 'Pantry Staples' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'specialty', name: 'Specialty & Diet' }
]

export default function CreateProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<ProductMetadata>({
    title: searchParams.get('title') || '',
    description: '',
    brandId: searchParams.get('brandId') || '',
    type: 'product',
    category: '',
    usps: [],
    features: [],
    ingredients: [],
    nutritionalInfo: '',
    allergens: [],
    seoTitle: searchParams.get('seoTitle') || '',
    seoDescription: searchParams.get('seoDescription') || '',
    recommendedSlug: searchParams.get('recommendedSlug') || '',
    optimizationUrl: searchParams.get('url') || '',
    optimizationFeedback: searchParams.get('feedback') || ''
  })
  const [newUsp, setNewUsp] = useState('')
  const [newFeature, setNewFeature] = useState('')
  const [newIngredient, setNewIngredient] = useState('')
  const [newAllergen, setNewAllergen] = useState('')

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
          action: 'generateProductContent',
          metadata
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to generate product content')
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
          category: metadata.category,
          content: content,
          metadata: {
            usps: metadata.usps,
            features: metadata.features,
            ingredients: metadata.ingredients,
            nutritionalInfo: metadata.nutritionalInfo,
            allergens: metadata.allergens,
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
      console.error('Error generating product content:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate product content')
    } finally {
      setLoading(false)
    }
  }

  const addItem = (field: keyof ProductMetadata, value: string, setter: (value: string) => void) => {
    if (!value.trim()) return
    setMetadata(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()]
    }))
    setter('')
  }

  const removeItem = (field: keyof ProductMetadata, index: number) => {
    setMetadata(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  const isValid = () => {
    return metadata.title &&
           metadata.description &&
           metadata.category &&
           metadata.usps.length > 0 &&
           metadata.features.length > 0
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create Product Content</h1>

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
              <Label>Product Name</Label>
              <Input
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <SelectNative
                value={metadata.category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
                className="w-full"
              >
                <option value="">Select a category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="home">Home & Garden</option>
                <option value="beauty">Beauty & Personal Care</option>
                <option value="sports">Sports & Outdoors</option>
                <option value="toys">Toys & Games</option>
                <option value="books">Books & Media</option>
                <option value="food">Food & Beverages</option>
                <option value="health">Health & Wellness</option>
                <option value="automotive">Automotive</option>
                <option value="other">Other</option>
              </SelectNative>
            </div>

            <div>
              <Label>Product Description</Label>
              <Textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unique Selling Points (USPs)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newUsp}
                onChange={(e) => setNewUsp(e.target.value)}
                placeholder="Add a USP"
                onKeyPress={(e) => e.key === 'Enter' && addItem('usps', newUsp, setNewUsp)}
              />
              <Button onClick={() => addItem('usps', newUsp, setNewUsp)}>Add</Button>
            </div>
            <div className="space-y-2">
              {metadata.usps.map((usp, index) => (
                <div key={index} className="flex items-center gap-2 bg-secondary/20 p-2 rounded">
                  <span className="flex-1">{usp}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeItem('usps', index)}>×</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature"
                onKeyPress={(e) => e.key === 'Enter' && addItem('features', newFeature, setNewFeature)}
              />
              <Button onClick={() => addItem('features', newFeature, setNewFeature)}>Add</Button>
            </div>
            <div className="space-y-2">
              {metadata.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 bg-secondary/20 p-2 rounded">
                  <span className="flex-1">{feature}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeItem('features', index)}>×</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ingredients</Label>
              <div className="flex gap-2">
                <Input
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  placeholder="Add an ingredient"
                  onKeyPress={(e) => e.key === 'Enter' && addItem('ingredients', newIngredient, setNewIngredient)}
                />
                <Button onClick={() => addItem('ingredients', newIngredient, setNewIngredient)}>Add</Button>
              </div>
              <div className="mt-2 space-y-2">
                {metadata.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2 bg-secondary/20 p-2 rounded">
                    <span className="flex-1">{ingredient}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem('ingredients', index)}>×</Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Nutritional Information</Label>
              <Textarea
                value={metadata.nutritionalInfo}
                onChange={(e) => setMetadata(prev => ({ ...prev, nutritionalInfo: e.target.value }))}
                placeholder="Enter nutritional information"
                rows={4}
              />
            </div>

            <div>
              <Label>Allergens</Label>
              <div className="flex gap-2">
                <Input
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  placeholder="Add an allergen"
                  onKeyPress={(e) => e.key === 'Enter' && addItem('allergens', newAllergen, setNewAllergen)}
                />
                <Button onClick={() => addItem('allergens', newAllergen, setNewAllergen)}>Add</Button>
              </div>
              <div className="mt-2 space-y-2">
                {metadata.allergens.map((allergen, index) => (
                  <div key={index} className="flex items-center gap-2 bg-secondary/20 p-2 rounded">
                    <span className="flex-1">{allergen}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem('allergens', index)}>×</Button>
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
              'Generate Product Content'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 