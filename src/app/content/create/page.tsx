'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
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
import { useToast } from '@/components/ui/use-toast'
import { SEOOpportunitiesDialog } from './components/SEOOpportunitiesDialog'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ContentType {
  id: string
  title: string
  description: string
  icon: any
  href: string
  requiresOptimization?: boolean
  disabled?: boolean
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
    title: 'Product (Coming Soon)',
    description: 'Create product listings with detailed specifications and inventory management',
    icon: Package2,
    href: '#',
    requiresOptimization: true,
    disabled: true
  },
  {
    id: 'recipe',
    title: 'Recipe (Coming Soon)',
    description: 'Create detailed recipes with ingredients, instructions, and cooking tips',
    icon: ChefHat,
    href: '#',
    requiresOptimization: true,
    disabled: true
  },
  {
    id: 'email',
    title: 'Email (Coming Soon)',
    description: 'Create email marketing campaigns and newsletters',
    icon: Mail,
    href: '#',
    disabled: true
  },
  {
    id: 'social',
    title: 'Social Post (Coming Soon)',
    description: 'Create social media content for various platforms',
    icon: Share2,
    href: '#',
    disabled: true
  }
]

const articleTypes = [
  { 
    id: 'how-to', 
    name: 'How To Guide', 
    description: 'Step-by-step instructions and tutorials',
    examples: ['How to use product X', 'Guide to perfect cooking with Y', 'Tips for better baking with Z']
  },
  { 
    id: 'ingredient-focus', 
    name: 'Ingredient Focus', 
    description: 'Deep dives into specific ingredients',
    examples: ['All about ingredient X', 'Ways to use Y in cooking', 'Understanding Z in recipes']
  },
  { 
    id: 'lifestyle', 
    name: 'Lifestyle', 
    description: 'Food culture and lifestyle content',
    examples: ['Entertaining with X', 'Healthy living with Y', 'Family meals with Z']
  },
  { 
    id: 'seasonal', 
    name: 'Seasonal', 
    description: 'Holiday and seasonal content',
    examples: ['Summer recipes with X', 'Holiday entertaining with Y', 'Spring cooking with Z']
  },
  { 
    id: 'health', 
    name: 'Health & Nutrition', 
    description: 'Health benefits and nutritional information',
    examples: ['Health benefits of X', 'Wellness tips with Y', 'Healthy cooking with Z']
  },
  { 
    id: 'tips', 
    name: 'Tips & Tricks', 
    description: 'Expert advice and kitchen hacks',
    examples: ['Pro tips for using X', 'Kitchen hacks with Y', 'Cooking secrets with Z']
  }
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
  needsHelp?: boolean
  cycleType?: string
  optimizationUrl?: string
  optimizationFeedback?: string
  customSuggestion?: string
  seoTitle?: string
  seoDescription?: string
  recommendedSlug?: string
  targetAudience?: string
  wordCount?: number
  tone?: string
  format?: string
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
  logo_url: string | null
  settings: {
    brandIdentity?: string
    toneOfVoice?: string
    guardrails?: string[]
    keywords?: string[]
    styleGuide?: {
      writingStyle?: string
      audience?: string
    }
  }
}

interface TitleGenerationInput {
  topic?: string
  audience?: string
}

interface ArticleMetadata {
  title: string
  description: string
  brandId: string
  type: string
  primaryKeyword: string
  secondaryKeywords: string[]
  articleType?: string
  customTitle?: string
  generatedTitles?: string[]
  seoTitle?: string
  seoDescription?: string
  recommendedSlug?: string
}

interface SEOOpportunity {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'content' | 'technical' | 'keywords' | 'structure'
}

interface ContentAnalysis {
  title: string
  description: string
  primaryKeyword: string
  secondaryKeywords: string[]
  content: string
  opportunities: SEOOpportunity[]
  currentHtml: string
  seoAnalysis: {
    title: string
    metaDescription: string
    recommendedSlug: string
  }
}

export default function CreateContentPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [showArticleTypeDialog, setShowArticleTypeDialog] = useState(false)
  const [showTitleHelpDialog, setShowTitleHelpDialog] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [showSeoDialog, setShowSeoDialog] = useState(false)
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false)
  const [showCustomSuggestion, setShowCustomSuggestion] = useState(false)
  const [needsHelp, setNeedsHelp] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationUrl, setOptimizationUrl] = useState('')
  const [brandApprovalStages, setBrandApprovalStages] = useState<string[]>([])
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null)
  const [editableSeoAnalysis, setEditableSeoAnalysis] = useState<EditableSEOAnalysis | null>(null)
  const [metadata, setMetadata] = useState<ContentMetadata>({
    title: '',
    description: '',
    brandId: '',
    type: '',
    primaryKeyword: '',
    secondaryKeywords: [],
    articleType: '',
    seoTitle: '',
    seoDescription: '',
    recommendedSlug: ''
  })
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([])
  const [titleInput, setTitleInput] = useState<TitleGenerationInput>({})
  const [customTitle, setCustomTitle] = useState('')
  const [optimizationFeedback, setOptimizationFeedback] = useState('')
  const [showNewOrOptimizeDialog, setShowNewOrOptimizeDialog] = useState(false)
  const [showSEOOpportunities, setShowSEOOpportunities] = useState(false)
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null)

  const updateMetadata = useCallback((updates: Partial<ContentMetadata>) => {
    setMetadata(prev => ({ ...prev, ...updates }))
  }, [])

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, logo_url, settings')
        .order('name')

      if (error) throw error
      setBrands(data.map((brand: any) => ({
        id: brand.id,
        name: brand.name,
        logo_url: brand.logo_url,
        settings: brand.settings
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
    
    if (type.requiresOptimization) {
      // Show dialog to choose between new content and optimization
      setShowNewOrOptimizeDialog(true)
    } else {
    router.push(type.href)
    }
  }

  const handleNewOrOptimizeChoice = (isOptimizing: boolean) => {
    setShowNewOrOptimizeDialog(false)
    
    if (isOptimizing) {
      setIsOptimizing(true)
      setShowOptimizationDialog(true)
    } else {
      setIsOptimizing(false)
      if (selectedType === 'article') {
        setShowArticleTypeDialog(true)
      } else {
        router.push(contentTypes.find(t => t.id === selectedType)?.href || '')
      }
    }
  }

  const handleArticleTypeSelect = async (type: string) => {
    updateMetadata({ 
      type: 'article',
      articleType: type,
      brandId: selectedBrand
    })
    setShowArticleTypeDialog(false)
    setShowTitleHelpDialog(true)
  }

  const handleTitleHelpChoice = (needsHelp: boolean) => {
    setNeedsHelp(needsHelp)
    updateMetadata({ needsHelp })
    
    if (!needsHelp) {
      setShowTitleHelpDialog(false)
      if (customTitle) {
        // Generate SEO metadata for custom title
        generateSEOMetadata(customTitle)
        router.push(`/content/create/article?${new URLSearchParams({
          title: customTitle,
          brandId: selectedBrand,
          articleType: metadata.articleType || '',
          type: 'article'
        }).toString()}`)
      }
    } else {
      handleGenerateArticleTitles()
    }
  }

  const generateSEOMetadata = async (title: string) => {
    try {
      setLoading(true)
      setError(null)

      // Call your AI endpoint to generate SEO metadata
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateSEOMetadata',
          title,
          type: 'article',
          articleType: metadata.articleType
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate SEO metadata')
      }

      const { seoTitle, seoDescription, recommendedSlug } = await response.json()
      updateMetadata({
        seoTitle,
        seoDescription,
        recommendedSlug
      })
    } catch (err) {
      console.error('Error generating SEO metadata:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate SEO metadata')
    } finally {
      setLoading(false)
    }
  }

  const handleTitleSelect = async (title: string) => {
    // Generate SEO metadata for selected title
    await generateSEOMetadata(title)
    
    // Navigate to article creation with all parameters
    router.push(`/content/create/article?${new URLSearchParams({
      title,
      brandId: selectedBrand,
      articleType: metadata.articleType || '',
      type: 'article',
      seoTitle: metadata.seoTitle || '',
      seoDescription: metadata.seoDescription || '',
      recommendedSlug: metadata.recommendedSlug || ''
    }).toString()}`)
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
        customSuggestion,
        {
          tone: selectedBrand.settings?.toneOfVoice,
          style: selectedBrand.settings?.styleGuide?.writingStyle,
          audience: selectedBrand.settings?.styleGuide?.audience,
          keywords: selectedBrand.settings?.keywords,
          guardrails: selectedBrand.settings?.guardrails,
          brandIdentity: selectedBrand.settings?.brandIdentity
        }
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

  const handleOptimize = async () => {
    if (!optimizationUrl) return

    try {
      setLoading(true)
      setError(null)

      // First, analyze the content and get optimization opportunities
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyzeArticle',
          url: optimizationUrl,
          feedback: optimizationFeedback,
          includeSeoAnalysis: true
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to analyze article')
      }

      const analysis: ContentAnalysis = await response.json()
      setContentAnalysis(analysis)
      
      // Show the SEO opportunities dialog
      setShowOptimizationDialog(false)
      setShowSEOOpportunities(true)

    } catch (err) {
      console.error('Error analyzing article:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze article')
      toast({
        title: 'Error',
        description: 'Failed to analyze article. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImplementOpportunities = async (selectedOpportunityIds: string[]) => {
    if (!contentAnalysis) return

    try {
      setLoading(true)
      
      // Get the selected opportunities
      const selectedOpportunities = contentAnalysis.opportunities
        .filter(o => selectedOpportunityIds.includes(o.id))

      // Call the AI to implement the selected opportunities
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'implementSEOOpportunities',
          currentHtml: contentAnalysis.currentHtml,
          opportunities: selectedOpportunities,
          url: optimizationUrl,
          feedback: optimizationFeedback
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to implement SEO opportunities')
      }

      const { optimizedContent } = await response.json()

      // Save the optimized content to the database
      const { data: savedContent, error: saveError } = await supabase
        .from('content')
        .insert({
          title: contentAnalysis.title,
          description: contentAnalysis.description,
          brand_id: selectedBrand,
          content_type: selectedType,
          primary_keyword: contentAnalysis.primaryKeyword,
          secondary_keywords: contentAnalysis.secondaryKeywords,
          content: optimizedContent,
          content_format: 'markdown',
          status: 'draft',
          optimization_url: optimizationUrl,
          optimization_feedback: optimizationFeedback,
          seo_title: contentAnalysis.seoAnalysis.title,
          seo_description: contentAnalysis.seoAnalysis.metaDescription,
          seo_slug: contentAnalysis.seoAnalysis.recommendedSlug,
          cycle_type: 'optimization'
        })
        .select()
        .single()

      if (saveError) {
        throw new Error(saveError.message)
      }

      // Show success message
      toast({
        title: 'Content Optimized',
        description: 'Your content has been optimized. You can now review and edit it.',
      })

      // Close the opportunities dialog
      setShowSEOOpportunities(false)

      // Navigate to the editor
      router.push(`/content/${savedContent.id}`)

    } catch (err) {
      console.error('Error implementing opportunities:', err)
      setError(err instanceof Error ? err.message : 'Failed to implement opportunities')
      toast({
        title: 'Error',
        description: 'Failed to implement opportunities. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSkipOptimization = async () => {
    if (!contentAnalysis) return

    try {
      setLoading(true)

      // Save the content directly without implementing opportunities
      const { data: savedContent, error: saveError } = await supabase
        .from('content')
        .insert({
          title: contentAnalysis.title,
          description: contentAnalysis.description,
          brand_id: selectedBrand,
          content_type: selectedType,
          primary_keyword: contentAnalysis.primaryKeyword,
          secondary_keywords: contentAnalysis.secondaryKeywords,
          content: contentAnalysis.content,
          content_format: 'markdown',
          status: 'draft',
          optimization_url: optimizationUrl,
          optimization_feedback: optimizationFeedback,
          seo_title: contentAnalysis.seoAnalysis.title,
          seo_description: contentAnalysis.seoAnalysis.metaDescription,
          seo_slug: contentAnalysis.seoAnalysis.recommendedSlug,
          cycle_type: 'optimization'
        })
        .select()
        .single()

      if (saveError) {
        throw new Error(saveError.message)
      }

      // Show success message
      toast({
        title: 'Content Saved',
        description: 'Your content has been saved without optimization. You can now review and edit it.',
      })

      // Close the opportunities dialog
      setShowSEOOpportunities(false)

      // Navigate to the editor
      router.push(`/content/${savedContent.id}`)

    } catch (err) {
      console.error('Error saving content:', err)
      setError(err instanceof Error ? err.message : 'Failed to save content')
      toast({
        title: 'Error',
        description: 'Failed to save content. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
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

  const handleSaveArticle = async () => {
    try {
      setLoading(true)
      setError(null)

      // Generate article content using AI
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateArticleContent',
          metadata: {
          title: metadata.title,
          description: metadata.description,
          primaryKeyword: metadata.primaryKeyword,
          secondaryKeywords: metadata.secondaryKeywords,
            targetAudience: metadata.targetAudience || '',
            wordCount: metadata.wordCount || 1000,
            tone: metadata.tone || 'professional',
            format: metadata.format || 'article',
            articleType: metadata.articleType,
            type: metadata.articleType
          }
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to generate article content')
      }

      const { content } = await response.json()

      // Save content to the database with only the fields that exist in the schema
      const { data, error: saveError } = await supabase
        .from('content')
        .insert({
          title: metadata.title,
          description: metadata.description,
          brand_id: metadata.brandId,
          content_type: 'article',
          primary_keyword: metadata.primaryKeyword,
          secondary_keywords: metadata.secondaryKeywords,
          content: content,
          status: 'draft',
          seo_title: metadata.seoTitle || metadata.title,
          seo_description: metadata.seoDescription || metadata.description,
          seo_slug: metadata.recommendedSlug || ''
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

      // Show success message
      toast({
        title: 'Article Created',
        description: 'Your article has been created and saved as a draft.',
      })

      // Navigate to the content editor page
      router.push(`/content/${data.id}`)
    } catch (err) {
      console.error('Error saving article:', err)
      setError(err instanceof Error ? err.message : 'Failed to save article')
      toast({
        title: 'Error',
        description: 'Failed to create article. Please try again.',
        variant: 'destructive'
      })
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
                  <div className="flex items-center gap-4">
                    {brand.logo_url ? (
                      <img 
                        src={brand.logo_url} 
                        alt={`${brand.name} logo`}
                        className="h-12 w-12 object-contain"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xl font-semibold text-primary">
                          {brand.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <CardTitle>{brand.name}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentTypes.map((contentType) => (
              <Card
                key={contentType.id}
                className={cn(
                  'relative overflow-hidden transition-all hover:shadow-lg',
                  contentType.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <contentType.icon className="h-5 w-5" />
                    <CardTitle>{contentType.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{contentType.description}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={contentType.disabled}
                    onClick={() => {
                      if (!contentType.disabled) {
                        if (contentType.id === 'article') {
                          setSelectedType(contentType.id)
                          setShowArticleTypeDialog(true)
                        } else {
                          router.push(contentType.href)
                        }
                      }
                    }}
                  >
                    {contentType.disabled ? 'Coming Soon' : 'Get Started'}
                  </Button>
                </CardFooter>
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

  const handleCustomTitle = async () => {
    if (!customTitle) return
    try {
      setLoading(true)
      // Generate SEO metadata for custom title
      await generateSEOMetadata(customTitle)
      router.push(`/content/create/article?${new URLSearchParams({
        title: customTitle,
        brandId: selectedBrand,
        articleType: metadata.articleType || '',
        type: 'article',
        seoTitle: metadata.seoTitle || '',
        seoDescription: metadata.seoDescription || '',
        recommendedSlug: metadata.recommendedSlug || ''
      }).toString()}`)
      setShowTitleHelpDialog(false)
    } catch (err) {
      console.error('Error handling custom title:', err)
      setError(err instanceof Error ? err.message : 'Failed to process custom title')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        {selectedBrand && brands.length > 0 && (
          <div className="flex items-center gap-4 mb-4">
            {brands.find(b => b.id === selectedBrand)?.logo_url ? (
              <img 
                src={brands.find(b => b.id === selectedBrand)?.logo_url || ''} 
                alt="Brand logo" 
                className="h-12 w-12 object-contain"
              />
            ) : (
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-semibold text-primary">
                  {brands.find(b => b.id === selectedBrand)?.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Selected Brand</p>
              <h2 className="text-lg font-semibold">{brands.find(b => b.id === selectedBrand)?.name}</h2>
            </div>
          </div>
        )}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>What type of content are you looking for?</DialogTitle>
            <DialogDescription>
              Select the type of article you'd like to create, and we'll help you generate relevant content.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {articleTypes.map((type) => (
              <Card
                key={type.id}
                className="cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => handleArticleTypeSelect(type.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500">
                    <p className="font-medium mb-1">Example uses:</p>
                    <ul className="list-disc list-inside">
                      {type.examples.map((example, i) => (
                        <li key={i}>{example}</li>
                      ))}
                    </ul>
                  </div>
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

      <Dialog open={showOptimizationDialog} onOpenChange={setShowOptimizationDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Optimize Existing Content</DialogTitle>
            <DialogDescription>
              Enter the URL of your existing content and any specific feedback for optimization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Content URL</Label>
              <Input
                value={optimizationUrl}
                onChange={(e) => setOptimizationUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Specific Feedback (Optional)</Label>
              <Textarea
                value={optimizationFeedback}
                onChange={(e) => setOptimizationFeedback(e.target.value)}
                placeholder="Any specific aspects you'd like to improve..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOptimizationDialog(false)
                setOptimizationUrl('')
                setOptimizationFeedback('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOptimize}
              disabled={!optimizationUrl || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Optimization'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewOrOptimizeDialog} onOpenChange={setShowNewOrOptimizeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New or Optimize Existing?</DialogTitle>
            <DialogDescription>
              Would you like to create new content or optimize existing content?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Card
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => handleNewOrOptimizeChoice(false)}
            >
              <CardHeader>
                <CardTitle className="text-lg">Create New Content</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Start fresh with new content creation using AI assistance
                </CardDescription>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => handleNewOrOptimizeChoice(true)}
            >
              <CardHeader>
                <CardTitle className="text-lg">Optimize Existing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Improve and optimize your existing content
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <SEOOpportunitiesDialog
        isOpen={showSEOOpportunities}
        onClose={() => setShowSEOOpportunities(false)}
        opportunities={contentAnalysis?.opportunities || []}
        loading={loading}
        onImplement={handleImplementOpportunities}
        onSkip={handleSkipOptimization}
      />
    </div>
  )
} 