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

interface RecipeMetadata {
  title: string
  description: string
  brandId: string
  servings: number
  prepTime: number
  cookTime: number
  totalTime?: number
  difficulty: 'easy' | 'medium' | 'hard'
  cuisine: string
  course: string
  dietaryInfo: string[]
  ingredients: Array<{
    amount: string
    unit: string
    item: string
    notes?: string
  }>
  instructions: Array<{
    step: number
    text: string
  }>
  tips: string[]
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbohydrates?: number
    fat?: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
  equipment: string[]
  images: Array<{
    url: string
    alt: string
    caption?: string
  }>
  videoUrl?: string
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
  }
  status: 'draft' | 'review' | 'published'
}

const difficultyLevels = ['easy', 'medium', 'hard']

const cuisineTypes = [
  'American',
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'French',
  'Mediterranean',
  'Thai',
  'Other'
]

const courseTypes = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Appetizer',
  'Side Dish',
  'Dessert',
  'Snack',
  'Drink'
]

const dietaryTags = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Low-Carb',
  'Keto',
  'Paleo',
  'Halal',
  'Kosher'
]

export default function CreateRecipePage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [metadata, setMetadata] = useState<RecipeMetadata>({
    title: '',
    description: '',
    brandId: '',
    servings: 4,
    prepTime: 0,
    cookTime: 0,
    difficulty: 'medium',
    cuisine: '',
    course: '',
    dietaryInfo: [],
    ingredients: [],
    instructions: [],
    tips: [],
    equipment: [],
    images: [],
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    },
    status: 'draft'
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

  const handleSaveRecipe = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('content')
        .insert({
          title: metadata.title,
          description: metadata.description,
          brand_id: metadata.brandId,
          content_type: 'recipe',
          servings: metadata.servings,
          prep_time: metadata.prepTime,
          cook_time: metadata.cookTime,
          total_time: metadata.totalTime,
          difficulty: metadata.difficulty,
          cuisine: metadata.cuisine,
          course: metadata.course,
          dietary_info: metadata.dietaryInfo,
          ingredients: metadata.ingredients,
          instructions: metadata.instructions,
          tips: metadata.tips,
          nutritional_info: metadata.nutritionalInfo,
          equipment: metadata.equipment,
          images: metadata.images,
          video_url: metadata.videoUrl,
          seo: metadata.seo,
          status: metadata.status
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/content/${data.id}`)
    } catch (err) {
      console.error('Error saving recipe:', err)
      setError('Failed to save recipe')
    } finally {
      setLoading(false)
    }
  }

  const addIngredient = () => {
    setMetadata({
      ...metadata,
      ingredients: [...metadata.ingredients, { amount: '', unit: '', item: '' }]
    })
  }

  const removeIngredient = (index: number) => {
    setMetadata({
      ...metadata,
      ingredients: metadata.ingredients.filter((_, i) => i !== index)
    })
  }

  const updateIngredient = (index: number, field: keyof RecipeMetadata['ingredients'][0], value: string) => {
    const newIngredients = [...metadata.ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setMetadata({ ...metadata, ingredients: newIngredients })
  }

  const addInstruction = () => {
    const nextStep = metadata.instructions.length + 1
    setMetadata({
      ...metadata,
      instructions: [...metadata.instructions, { step: nextStep, text: '' }]
    })
  }

  const removeInstruction = (index: number) => {
    const newInstructions = metadata.instructions
      .filter((_, i) => i !== index)
      .map((instruction, i) => ({ ...instruction, step: i + 1 }))
    setMetadata({ ...metadata, instructions: newInstructions })
  }

  const updateInstruction = (index: number, text: string) => {
    const newInstructions = [...metadata.instructions]
    newInstructions[index] = { ...newInstructions[index], text }
    setMetadata({ ...metadata, instructions: newInstructions })
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

  const updateImage = (index: number, field: keyof RecipeMetadata['images'][0], value: string) => {
    const newImages = [...metadata.images]
    newImages[index] = { ...newImages[index], [field]: value }
    setMetadata({ ...metadata, images: newImages })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Recipe</CardTitle>
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
            <label className="block text-sm font-medium mb-1">Recipe Title</label>
            <Input
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              placeholder="Enter recipe name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              placeholder="Brief description of the recipe"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Servings</label>
              <Input
                type="number"
                min="1"
                value={metadata.servings}
                onChange={(e) => setMetadata({ ...metadata, servings: parseInt(e.target.value) })}
                placeholder="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prep Time (mins)</label>
              <Input
                type="number"
                min="0"
                value={metadata.prepTime}
                onChange={(e) => setMetadata({ ...metadata, prepTime: parseInt(e.target.value) })}
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cook Time (mins)</label>
              <Input
                type="number"
                min="0"
                value={metadata.cookTime}
                onChange={(e) => setMetadata({ ...metadata, cookTime: parseInt(e.target.value) })}
                placeholder="45"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <Select
                value={metadata.difficulty}
                onChange={(e) => setMetadata({ ...metadata, difficulty: e.target.value as RecipeMetadata['difficulty'] })}
                className="w-full"
              >
                {difficultyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cuisine</label>
              <Select
                value={metadata.cuisine}
                onChange={(e) => setMetadata({ ...metadata, cuisine: e.target.value })}
                className="w-full"
              >
                <option value="">Select cuisine</option>
                {cuisineTypes.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Course</label>
              <Select
                value={metadata.course}
                onChange={(e) => setMetadata({ ...metadata, course: e.target.value })}
                className="w-full"
              >
                <option value="">Select course</option>
                {courseTypes.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dietary Information</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {dietaryTags.map((tag) => (
                <label key={tag} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={metadata.dietaryInfo.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMetadata({
                          ...metadata,
                          dietaryInfo: [...metadata.dietaryInfo, tag]
                        })
                      } else {
                        setMetadata({
                          ...metadata,
                          dietaryInfo: metadata.dietaryInfo.filter(t => t !== tag)
                        })
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ingredients</label>
            <div className="space-y-2">
              {metadata.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={ingredient.amount}
                    onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="w-24"
                  />
                  <Input
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    placeholder="Unit"
                    className="w-24"
                  />
                  <Input
                    value={ingredient.item}
                    onChange={(e) => updateIngredient(index, 'item', e.target.value)}
                    placeholder="Ingredient"
                    className="flex-1"
                  />
                  <Input
                    value={ingredient.notes || ''}
                    onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                    placeholder="Notes (optional)"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addIngredient}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Ingredient
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Instructions</label>
            <div className="space-y-2">
              {metadata.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-none w-12 h-12 flex items-center justify-center bg-primary/10 rounded-lg">
                    <span className="text-lg font-medium">{instruction.step}</span>
                  </div>
                  <Textarea
                    value={instruction.text}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder="Instruction step"
                    className="flex-1"
                    rows={2}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeInstruction(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addInstruction}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Instruction
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cooking Tips</label>
            <div className="space-y-2">
              {metadata.tips.map((tip, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={tip}
                    onChange={(e) => {
                      const newTips = [...metadata.tips]
                      newTips[index] = e.target.value
                      setMetadata({ ...metadata, tips: newTips })
                    }}
                    placeholder="Cooking tip"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setMetadata({
                        ...metadata,
                        tips: metadata.tips.filter((_, i) => i !== index)
                      })
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setMetadata({ ...metadata, tips: [...metadata.tips, ''] })}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tip
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nutritional Information (optional)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Calories</label>
                <Input
                  type="number"
                  min="0"
                  value={metadata.nutritionalInfo?.calories || ''}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    nutritionalInfo: {
                      ...metadata.nutritionalInfo,
                      calories: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                  placeholder="kcal"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Protein (g)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={metadata.nutritionalInfo?.protein || ''}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    nutritionalInfo: {
                      ...metadata.nutritionalInfo,
                      protein: e.target.value ? parseFloat(e.target.value) : undefined
                    }
                  })}
                  placeholder="g"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Carbohydrates (g)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={metadata.nutritionalInfo?.carbohydrates || ''}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    nutritionalInfo: {
                      ...metadata.nutritionalInfo,
                      carbohydrates: e.target.value ? parseFloat(e.target.value) : undefined
                    }
                  })}
                  placeholder="g"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fat (g)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={metadata.nutritionalInfo?.fat || ''}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    nutritionalInfo: {
                      ...metadata.nutritionalInfo,
                      fat: e.target.value ? parseFloat(e.target.value) : undefined
                    }
                  })}
                  placeholder="g"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Required Equipment</label>
            <div className="space-y-2">
              {metadata.equipment.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newEquipment = [...metadata.equipment]
                      newEquipment[index] = e.target.value
                      setMetadata({ ...metadata, equipment: newEquipment })
                    }}
                    placeholder="Equipment item"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setMetadata({
                        ...metadata,
                        equipment: metadata.equipment.filter((_, i) => i !== index)
                      })
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setMetadata({ ...metadata, equipment: [...metadata.equipment, ''] })}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Images</label>
            <div className="space-y-2">
              {metadata.images.map((image, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={image.url}
                      onChange={(e) => updateImage(index, 'url', e.target.value)}
                      placeholder="Image URL"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeImage(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={image.alt}
                    onChange={(e) => updateImage(index, 'alt', e.target.value)}
                    placeholder="Alt text"
                  />
                  <Input
                    value={image.caption || ''}
                    onChange={(e) => updateImage(index, 'caption', e.target.value)}
                    placeholder="Caption (optional)"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addImage}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Image
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Video URL (optional)</label>
            <Input
              value={metadata.videoUrl || ''}
              onChange={(e) => setMetadata({ ...metadata, videoUrl: e.target.value })}
              placeholder="https://example.com/video"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SEO</label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta Title</label>
                <Input
                  value={metadata.seo.metaTitle}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    seo: {
                      ...metadata.seo,
                      metaTitle: e.target.value
                    }
                  })}
                  placeholder="SEO title"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta Description</label>
                <Textarea
                  value={metadata.seo.metaDescription}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    seo: {
                      ...metadata.seo,
                      metaDescription: e.target.value
                    }
                  })}
                  placeholder="SEO description"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Keywords</label>
                <Textarea
                  value={metadata.seo.keywords.join(', ')}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    seo: {
                      ...metadata.seo,
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    }
                  })}
                  placeholder="Comma-separated keywords"
                  rows={2}
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
              onClick={handleSaveRecipe}
              disabled={loading || !metadata.title || !metadata.brandId || metadata.ingredients.length === 0 || metadata.instructions.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Recipe
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