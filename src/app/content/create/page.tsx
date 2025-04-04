'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Wand2, FileText, Package2, Mail, Share2, ChefHat, Loader2 } from 'lucide-react'
import { generateKeywords, generateDescription, generateArticleIdeas } from '@/lib/openai'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { FeedbackDialog } from './components/FeedbackDialog'
import { CustomSuggestionDialog } from './components/CustomSuggestionDialog'

interface ContentType {
  id: string
  title: string
  description: string
  icon: any
  href: string
  requiresOptimization?: boolean
}

const contentTypes: ContentType[] = [
  {
    id: 'article',
    title: 'Article',
    description: 'Create long-form content like blog posts, guides, and tutorials',
    icon: FileText,
    href: '/content/create/article',
    requiresOptimization: true
  },
  {
    id: 'product',
    title: 'Product',
    description: 'Create product listings with detailed specifications and inventory management',
    icon: Package2,
    href: '/content/create/product',
    requiresOptimization: true
  },
  {
    id: 'recipe',
    title: 'Recipe',
    description: 'Create detailed recipes with ingredients, instructions, and cooking tips',
    icon: ChefHat,
    href: '/content/create/recipe',
    requiresOptimization: true
  },
  {
    id: 'email',
    title: 'Email',
    description: 'Create email marketing campaigns and newsletters',
    icon: Mail,
    href: '/content/create/email'
  },
  {
    id: 'social',
    title: 'Social Post',
    description: 'Create social media content for various platforms',
    icon: Share2,
    href: '/content/create/social'
  }
]

const articleTypes = [
  { id: 'how-to', name: 'How To Guide', description: 'Step-by-step instructions and tutorials' },
  { id: 'ingredient-focus', name: 'Ingredient Focus', description: 'Deep dives into specific ingredients' },
  { id: 'lifestyle', name: 'Lifestyle', description: 'Food culture and lifestyle content' },
  { id: 'seasonal', name: 'Seasonal', description: 'Holiday and seasonal content' },
  { id: 'health', name: 'Health & Nutrition', description: 'Health benefits and nutritional information' },
  { id: 'tips', name: 'Tips & Tricks', description: 'Expert advice and kitchen hacks' }
]

interface ContentMetadata {
  title: string
  description: string
  brandId: string
  type: string
  primaryKeyword: string
  secondaryKeywords: string[]
  articleType?: string
  customTitle?: string
  generatedTitles?: string[]
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

interface SEOAnalysis {
  recommendations: string[];
  keywords: string[];
  metaDescription: string;
  titleSuggestions: string[];
}

interface EditableSEOAnalysis {
  recommendations: string[];
  keywords: string[];
  currentKeywords: string[];
  selectedRecommendations: boolean[];
  selectedKeywords: boolean[];
}

interface Brand {
  id: string
  name: string
  allowedContentTypes: string[]
}

interface TitleGenerationInput {
  topic?: string
  audience?: string
}

export default function CreateContentPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [metadata, setMetadata] = useState<ContentMetadata>({
    title: '',
    description: '',
    brandId: '',
    type: '',
    primaryKeyword: '',
    secondaryKeywords: [],
    articleType: ''
  })
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([])
  const [titleInput, setTitleInput] = useState<TitleGenerationInput>({})
  const [customTitle, setCustomTitle] = useState('')

  const updateMetadata = useCallback((updates: Partial<ContentMetadata>) => {
    setMetadata(prev => ({ ...prev, ...updates }))
  }, [])

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name')

      if (error) throw error
      setBrands(data.map(brand => ({
        id: brand.id,
        name: brand.name,
        allowedContentTypes: contentTypes.map(type => type.id)
      })))

      // If user has only one brand, auto-select it and move to next step
      if (data.length === 1) {
        setSelectedBrand(data[0].id)
        setCurrentStep(2)
      }
    } catch (err) {
      console.error('Error loading brands:', err)
      setError('Failed to load brands')
    }
  }

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId)
    setCurrentStep(2)
  }

  const handleTypeSelect = (type: ContentType) => {
    setSelectedType(type.id)
    router.push(type.href)
  }

  const handleTitleSelect = (title: string) => {
    updateMetadata({ title })
    router.push(`/content/create/article?title=${encodeURIComponent(title)}&brandId=${selectedBrand}`)
  }

  const handleCustomTitle = () => {
    if (!customTitle) return
    updateMetadata({ title: customTitle })
    router.push(`/content/create/article?title=${encodeURIComponent(customTitle)}&brandId=${selectedBrand}`)
  }

  const handleGenerateArticleTitles = async (input?: TitleGenerationInput) => {
    try {
      setLoading(true)
      setError(null)
      const selectedBrand = brands.find(b => b.id === metadata.brandId)
      if (!selectedBrand) throw new Error('Please select a brand first')

      const customSuggestion = input?.topic && input?.audience
        ? `Topic: ${input.topic}, Target Audience: ${input.audience}`
        : input?.topic || input?.audience || undefined

      const titles = await generateArticleIdeas(
        selectedBrand.name,
        metadata.type,
        metadata.articleType || '',
        customSuggestion
      )
      setGeneratedTitles(titles.slice(0, 5))
      updateMetadata({ generatedTitles: titles.slice(0, 5) })
    } catch (err) {
      console.error('Error generating article titles:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate article titles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Get the type from the URL query parameters
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')
    if (type && contentTypes.some(ct => ct.id === type)) {
      updateMetadata({ type })
    }
    loadBrands()
  }, [updateMetadata])

  const handleGenerateArticleIdeas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const selectedBrand = brands.find(b => b.id === metadata.brandId)
      if (!selectedBrand) throw new Error('Please select a brand first')

      const ideas = await generateArticleIdeas(selectedBrand.name, metadata.type, metadata.articleType)
      setGeneratedContent(ideas[0] || '')
    } catch (err) {
      console.error('Error generating article ideas:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate article ideas')
    } finally {
      setLoading(false)
    }
  }, [brands, metadata.brandId, metadata.type, metadata.articleType])

  const handleArticleTypeSelect = async (type: string) => {
    updateMetadata({ 
      type: 'article',
      articleType: type,
      brandId: selectedBrand,
      cycleType: 'new'
    })
    setShowArticleTypeDialog(false)
    setShowTitleHelpDialog(true)
  }

  const handleTitleHelpChoice = (needsHelp: boolean) => {
    setNeedsHelp(needsHelp)
    updateMetadata({ needsHelp })
    
    if (!needsHelp) {
      setShowTitleHelpDialog(false)
      // Navigate to article creation with the custom title
      if (customTitle) {
        router.push(`/content/create/article?title=${encodeURIComponent(customTitle)}&brandId=${selectedBrand}&articleType=${metadata.articleType}`)
      }
    } else {
      handleGenerateArticleTitles()
    }
  }

  useEffect(() => {
    if (metadata.brandId) {
      loadBrandApprovalStages()
    }
  }, [metadata.brandId])

  useEffect(() => {
    if (seoAnalysis && !editableSeoAnalysis) {
      // Process recommendations to remove headings and bullet points
      const flattenedRecommendations = seoAnalysis.recommendations
        .filter(rec => !rec.endsWith(':') && rec.trim() !== '') // Remove headings and blank lines
        .map(rec => rec.replace(/^[•\-\*]\s*/, '')) // Remove bullet points
        .slice(0, 10); // Limit to top 10 recommendations

      // Combine current and suggested keywords for selection
      const allKeywords = Array.from(new Set([
        ...(seoAnalysis.keywords || []),
        metadata.primaryKeyword,
        ...(metadata.secondaryKeywords || [])
      ])).filter(Boolean);

      setEditableSeoAnalysis({
        recommendations: flattenedRecommendations,
        keywords: allKeywords,
        currentKeywords: [metadata.primaryKeyword, ...(metadata.secondaryKeywords || [])].filter(Boolean),
        selectedRecommendations: new Array(Math.min(flattenedRecommendations.length, 10)).fill(false),
        selectedKeywords: allKeywords.map(keyword => 
          [metadata.primaryKeyword, ...(metadata.secondaryKeywords || [])].includes(keyword)
        )
      })
    }
  }, [seoAnalysis, metadata.primaryKeyword, metadata.secondaryKeywords])

  const loadBrandApprovalStages = async () => {
    try {
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('approval_stages')
        .eq('id', metadata.brandId)
        .single()

      if (brandError) throw brandError
      setBrandApprovalStages(brand.approval_stages || [])
    } catch (err) {
      console.error('Error loading brand approval stages:', err)
      setError('Failed to load brand approval stages')
    }
  }

  const handleOptimizationChoice = (isOptimizing: boolean) => {
    setIsOptimizing(isOptimizing)
    if (!isOptimizing) {
      // For new article creation, show the article type dialog
      if (selectedType === 'article') {
        setShowArticleTypeDialog(true)
      } else {
        // For other content types, proceed to their creation pages
        router.push(`${contentTypes.find(t => t.id === selectedType)?.href}`)
      }
    } else {
      setCurrentStep(4)
    }
  }

  const handleOptimize = () => {
    if (!optimizationUrl) return
    router.push(`${contentTypes.find(t => t.id === selectedType)?.href}?optimize=true&url=${encodeURIComponent(optimizationUrl)}`)
  }

  const handleGeneratePrimaryKeyword = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await generateKeywords(metadata.title, metadata.description)
      updateMetadata({
        primaryKeyword: result.primary,
        secondaryKeywords: metadata.secondaryKeywords || []
      })
    } catch (err) {
      console.error('Error generating primary keyword:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate primary keyword')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSecondaryKeywords = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await generateKeywords(metadata.title, metadata.description)
      updateMetadata({
        secondaryKeywords: result.secondary
      })
    } catch (err) {
      console.error('Error generating secondary keywords:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate secondary keywords')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDescription = async () => {
    try {
      setLoading(true)
      setError(null)
      const description = await generateDescription(metadata.title, metadata.primaryKeyword)
      updateMetadata({
        description,
        secondaryKeywords: metadata.secondaryKeywords || []
      })
    } catch (err) {
      console.error('Error generating description:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate description')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateContent = async () => {
    try {
      setLoading(true)
      setError(null)

      const cycleId = generateCycleId()

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateContent',
          title: metadata.title,
          description: metadata.description,
          primaryKeyword: metadata.primaryKeyword,
          secondaryKeywords: metadata.secondaryKeywords,
          type: metadata.type
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to generate content')
      }

      const { content } = await response.json()
      setGeneratedContent(content)
      setShowPreview(true)

      // Save content to the database with only the fields that exist in the schema
      const { data, error: saveError } = await supabase
        .from('content')
        .insert({
          title: metadata.title,
          description: metadata.description,
          brand_id: metadata.brandId,
          content_type: metadata.type,
          primary_keyword: metadata.primaryKeyword,
          secondary_keywords: metadata.secondaryKeywords,
          content: content,
          status: 'draft',
          cycle_id: cycleId,
          cycle_type: metadata.cycleType,
          optimization_url: metadata.optimizationUrl,
          optimization_feedback: metadata.optimizationFeedback
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

      // Navigate to the content page
      router.push(`/content/${data.id}`)
    } catch (err) {
      console.error('Error generating content:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerationFeedback = async (feedback: string) => {
    try {
      setLoading(true)
      setError(null)

      // First, save the feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('content_feedback')
        .insert({
          content: generatedContent,
          feedback,
          metadata: {
            title: metadata.title,
            description: metadata.description,
            primaryKeyword: metadata.primaryKeyword,
            secondaryKeywords: metadata.secondaryKeywords,
            type: metadata.type
          }
        })
        .select()
        .single()

      if (feedbackError) throw feedbackError

      // Then generate new content with the feedback
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateContent',
          title: metadata.title,
          description: metadata.description,
          primaryKeyword: metadata.primaryKeyword,
          secondaryKeywords: metadata.secondaryKeywords,
          type: metadata.type,
          previousFeedback: feedback // Include feedback for improvement
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to generate content')
      }

      const { content } = await response.json()
      setGeneratedContent(content)
      setShowFeedbackDialog(false)
    } catch (err) {
      console.error('Error handling regeneration:', err)
      setError(err instanceof Error ? err.message : 'Failed to handle regeneration')
    } finally {
      setLoading(false)
    }
  }

  const generateCycleId = () => {
    const timestamp = new Date().getTime()
    const random = Math.floor(Math.random() * 1000)
    return `${metadata.type.toLowerCase()}-${metadata.cycleType}-${timestamp}-${random}`
  }

  const handleOptimizeArticle = async () => {
    try {
      setLoading(true)
      setError(null)

      // Call the AI endpoint to analyze the article
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyzeArticle',
          url: metadata.optimizationUrl,
          feedback: metadata.optimizationFeedback,
          includeSeoAnalysis: true
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to analyze article')
      }

      const { title, description, primaryKeyword, secondaryKeywords, content, seoAnalysis } = await response.json()

      // First update the SEO analysis
      setSeoAnalysis(seoAnalysis)

      // Then update metadata
      updateMetadata({
        title: title || metadata.title,
        description: description || metadata.description,
        primaryKeyword: primaryKeyword || metadata.primaryKeyword,
        secondaryKeywords: secondaryKeywords || metadata.secondaryKeywords || [],
        cycleType: 'optimization'
      })

      // Store the original content for comparison
      setGeneratedContent(content || '')

      // Show SEO dialog before proceeding
      setShowSeoDialog(true)
      setShowOptimizationDialog(false)
    } catch (err) {
      console.error('Error analyzing article:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze article')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndStartApprovals = async () => {
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
          content_type: metadata.type,
          primary_keyword: metadata.primaryKeyword,
          secondary_keywords: metadata.secondaryKeywords,
          content: generatedContent,
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

      // Navigate to the content page
      router.push(`/content/${data.id}`)
    } catch (err) {
      console.error('Error saving content:', err)
      setError(err instanceof Error ? err.message : 'Failed to save content')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <Card
                key={brand.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleBrandSelect(brand.id)}
              >
                <CardHeader>
                  <CardTitle>{brand.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentTypes.map((type) => (
              <Card
                key={type.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleTypeSelect(type)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {type.icon && <type.icon className="h-5 w-5" />}
                    {type.title}
                  </CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  const handleCustomSuggestion = async (suggestion: string) => {
    try {
      setLoading(true)
      setError(null)
      const selectedBrand = brands.find(b => b.id === metadata.brandId)
      if (!selectedBrand) throw new Error('Please select a brand first')

      setMetadata({ ...metadata, customSuggestion: suggestion })
      const ideas = await generateArticleIdeas(selectedBrand.name, metadata.type, 'custom', suggestion)
      setGeneratedContent(ideas[0] || '')
      setShowCustomSuggestion(false)
    } catch (err) {
      console.error('Error generating custom article ideas:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate article ideas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Content</h1>
        <p className="text-gray-500">Follow the steps to create or optimize your content</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      <div className="relative mb-8">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${(currentStep / 4) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span className={currentStep >= 1 ? 'text-primary' : ''}>Brand</span>
          <span className={currentStep >= 2 ? 'text-primary' : ''}>Content Type</span>
          <span className={currentStep >= 3 ? 'text-primary' : ''}>Create/Optimize</span>
          <span className={currentStep >= 4 ? 'text-primary' : ''}>Details</span>
        </div>
      </div>

      {renderStep()}

      {currentStep > 1 && (
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      )}

      <Dialog open={showArticleTypeDialog} onOpenChange={setShowArticleTypeDialog}>
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">What type of article would you like to create?</DialogTitle>
            <DialogDescription className="text-gray-600">
              Select the type of article that best matches your content goals
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {articleTypes.map((type) => (
              <Card
                key={type.id}
                className="cursor-pointer transition-colors hover:border-primary/50 bg-white"
                onClick={() => handleArticleTypeSelect(type.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">{type.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTitleHelpDialog} onOpenChange={setShowTitleHelpDialog}>
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Do you have an article title already?</DialogTitle>
            <DialogDescription className="text-gray-600">
              I can help you generate some title ideas based on your article type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!needsHelp ? (
              <div className="space-y-4">
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter your article title"
                  className="bg-white text-gray-900"
                />
                <Button 
                  className="w-full" 
                  onClick={handleCustomTitle}
                  disabled={!customTitle}
                >
                  Continue with this title
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleTitleHelpChoice(true)}
                >
                  I'd like help with the title
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Topic (optional)</label>
                    <Input
                      value={titleInput.topic || ''}
                      onChange={(e) => setTitleInput({ ...titleInput, topic: e.target.value })}
                      placeholder="e.g. summer grilling, healthy snacks"
                      className="bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Target Audience (optional)</label>
                    <Input
                      value={titleInput.audience || ''}
                      onChange={(e) => setTitleInput({ ...titleInput, audience: e.target.value })}
                      placeholder="e.g. busy parents, health enthusiasts"
                      className="bg-white text-gray-900"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : generatedTitles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      {generatedTitles.map((title, index) => (
                        <button
                          key={index}
                          onClick={() => handleTitleSelect(title)}
                          className="w-full text-left px-4 py-3 rounded-lg border bg-white text-gray-900 hover:border-primary transition-colors text-sm"
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                    <div className="flex space-x-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleGenerateArticleTitles(titleInput)}
                        type="button"
                      >
                        Generate More Titles
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setTitleInput({})}
                        type="button"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleGenerateArticleTitles(titleInput)}
                  >
                    Generate Title Ideas
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 