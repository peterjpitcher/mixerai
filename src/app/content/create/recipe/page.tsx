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

interface RecipeMetadata {
  title: string
  description: string
  brandId: string
  type: string
  recipeType: string
  servings: number
  prepTime: number
  cookTime: number
  totalTime: number
  difficulty: string
  ingredients: string[]
  instructions: string[]
  tips: string[]
  variations: string[]
  seoTitle: string
  seoDescription: string
  recommendedSlug: string
  optimizationUrl?: string
  optimizationFeedback?: string
  cuisine: string
  contentSource: 'link' | 'freeform'
  dietaryRestrictions: string
}

const recipeTypes = [
  { id: 'main-course', name: 'Main Course' },
  { id: 'appetizer', name: 'Appetizer' },
  { id: 'dessert', name: 'Dessert' },
  { id: 'snack', name: 'Snack' },
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'side-dish', name: 'Side Dish' },
  { id: 'beverage', name: 'Beverage' }
]

const difficultyLevels = [
  { id: 'easy', name: 'Easy' },
  { id: 'medium', name: 'Medium' },
  { id: 'hard', name: 'Hard' }
]

export default function CreateRecipePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<RecipeMetadata>({
    title: searchParams.get('title') || '',
    description: '',
    brandId: searchParams.get('brandId') || '',
    type: 'recipe',
    recipeType: '',
    servings: 4,
    prepTime: 0,
    cookTime: 0,
    totalTime: 0,
    difficulty: 'medium',
    ingredients: [],
    instructions: [],
    tips: [],
    variations: [],
    seoTitle: searchParams.get('seoTitle') || '',
    seoDescription: searchParams.get('seoDescription') || '',
    recommendedSlug: searchParams.get('recommendedSlug') || '',
    optimizationUrl: searchParams.get('url') || '',
    optimizationFeedback: searchParams.get('feedback') || '',
    cuisine: '',
    contentSource: 'freeform',
    dietaryRestrictions: ''
  })
  const [newIngredient, setNewIngredient] = useState('')
  const [newInstruction, setNewInstruction] = useState('')
  const [newTip, setNewTip] = useState('')
  const [newVariation, setNewVariation] = useState('')

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
          action: 'generateRecipeContent',
          metadata
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to generate recipe content')
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
            recipeType: metadata.recipeType,
          servings: metadata.servings,
            prepTime: metadata.prepTime,
            cookTime: metadata.cookTime,
            totalTime: metadata.totalTime,
          difficulty: metadata.difficulty,
          ingredients: metadata.ingredients,
          instructions: metadata.instructions,
          tips: metadata.tips,
            variations: metadata.variations,
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
      console.error('Error generating recipe content:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate recipe content')
    } finally {
      setLoading(false)
    }
  }

  const addItem = (field: keyof RecipeMetadata, value: string, setter: (value: string) => void) => {
    if (!value.trim()) return
    setMetadata(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()]
    }))
    setter('')
  }

  const removeItem = (field: keyof RecipeMetadata, index: number) => {
    setMetadata(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  const isValid = () => {
    return metadata.title &&
           metadata.description &&
           metadata.recipeType &&
           metadata.ingredients.length > 0 &&
           metadata.instructions.length > 0
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create Recipe Content</h1>

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
              <Label>Recipe Name</Label>
              <Input
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter recipe name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Recipe Type</label>
              <SelectNative
                value={metadata.recipeType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetadata(prev => ({ ...prev, recipeType: e.target.value }))}
                className="w-full"
              >
                <option value="">Select a recipe type</option>
                <option value="appetizer">Appetizer</option>
                <option value="main">Main Course</option>
                <option value="dessert">Dessert</option>
                <option value="snack">Snack</option>
                <option value="drink">Beverage</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="side">Side Dish</option>
                <option value="other">Other</option>
              </SelectNative>
            </div>

            <div>
              <Label>Description</Label>
                  <Textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter recipe description"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipe Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Servings</Label>
                <Input
                  type="number"
                  min="1"
                  value={metadata.servings}
                  onChange={(e) => setMetadata(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label>Prep Time (mins)</Label>
                <Input
                  type="number"
                  min="0"
                  value={metadata.prepTime}
                  onChange={(e) => setMetadata(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Cook Time (mins)</Label>
                <Input
                  type="number"
                  min="0"
                  value={metadata.cookTime}
                  onChange={(e) => setMetadata(prev => ({ ...prev, cookTime: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Difficulty</Label>
                <SelectNative
                  value={metadata.difficulty}
                  onChange={(e) => setMetadata(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full"
                >
                  {difficultyLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </SelectNative>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add an ingredient"
                onKeyPress={(e) => e.key === 'Enter' && addItem('ingredients', newIngredient, setNewIngredient)}
              />
              <Button onClick={() => addItem('ingredients', newIngredient, setNewIngredient)}>Add</Button>
          </div>
            <div className="space-y-2">
              {metadata.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-2 bg-secondary/20 p-2 rounded">
                  <span className="flex-1">{ingredient}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeItem('ingredients', index)}>×</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                placeholder="Add an instruction"
                onKeyPress={(e) => e.key === 'Enter' && addItem('instructions', newInstruction, setNewInstruction)}
              />
              <Button onClick={() => addItem('instructions', newInstruction, setNewInstruction)}>Add</Button>
          </div>
            <div className="space-y-2">
              {metadata.instructions.map((instruction, index) => (
                <div key={index} className="flex items-center gap-2 bg-secondary/20 p-2 rounded">
                  <span className="flex-1">{index + 1}. {instruction}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeItem('instructions', index)}>×</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips & Variations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
          <div>
              <Label>Tips</Label>
              <div className="flex gap-2">
            <Input
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  placeholder="Add a tip"
                  onKeyPress={(e) => e.key === 'Enter' && addItem('tips', newTip, setNewTip)}
                />
                <Button onClick={() => addItem('tips', newTip, setNewTip)}>Add</Button>
              </div>
              <div className="mt-2 space-y-2">
                {metadata.tips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-2 bg-secondary/20 p-2 rounded">
                    <span className="flex-1">{tip}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem('tips', index)}>×</Button>
                  </div>
                ))}
              </div>
          </div>

          <div>
              <Label>Variations</Label>
              <div className="flex gap-2">
                <Input
                  value={newVariation}
                  onChange={(e) => setNewVariation(e.target.value)}
                  placeholder="Add a variation"
                  onKeyPress={(e) => e.key === 'Enter' && addItem('variations', newVariation, setNewVariation)}
                />
                <Button onClick={() => addItem('variations', newVariation, setNewVariation)}>Add</Button>
              </div>
              <div className="mt-2 space-y-2">
                {metadata.variations.map((variation, index) => (
                  <div key={index} className="flex items-center gap-2 bg-secondary/20 p-2 rounded">
                    <span className="flex-1">{variation}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem('variations', index)}>×</Button>
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

        <Card>
          <CardHeader>
            <CardTitle>Content Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Source</label>
              <SelectNative
                value={metadata.contentSource}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetadata(prev => ({ ...prev, contentSource: e.target.value as 'link' | 'freeform' }))}
                className="w-full mb-4"
              >
                <option value="freeform">Freeform Text</option>
                <option value="link">URL Link</option>
              </SelectNative>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dietary Restrictions</label>
              <SelectNative
                value={metadata.dietaryRestrictions}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetadata(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
                className="w-full"
              >
                <option value="">Select dietary restrictions</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten-free">Gluten-Free</option>
                <option value="dairy-free">Dairy-Free</option>
                <option value="nut-free">Nut-Free</option>
                <option value="none">None</option>
              </SelectNative>
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
              'Generate Recipe Content'
              )}
            </Button>
          </div>
      </div>
    </div>
  )
} 