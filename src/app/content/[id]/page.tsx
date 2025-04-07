'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, RefreshCcw } from 'lucide-react'
import dynamic from 'next/dynamic'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkHtml from 'remark-html'
import remarkGfm from 'remark-gfm'

// Import TipTap editor with dynamic loading to avoid SSR issues
const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-gray-100 animate-pulse rounded-md">
      <div className="h-10 bg-gray-200 mb-4 rounded" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  )
})

interface ArticleData {
  id: string
  title: string
  description: string
  content: string
  brand_id: string
  primary_keyword: string
  secondary_keywords: string[]
  status: string
  content_format?: string
}

export default function ArticlePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [regenerateFeedback, setRegenerateFeedback] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadArticle = async () => {
      if (!params.id) {
        setError('Article ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('content')
          .select('*')
          .eq('id', params.id)
          .single()

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Article not found')
          } else {
            setError(fetchError.message)
          }
          return
        }

        if (!data) {
          setError('Article not found')
          return
        }

        // Ensure content is properly formatted as HTML
        if (data.content && !data.content.startsWith('<')) {
          // If content is not HTML, convert it
          const htmlContent = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkHtml)
            .process(data.content)
          
          data.content = String(htmlContent)
          data.content_format = 'html'
        }

        setArticle(data)
      } catch (err) {
        console.error('Error loading article:', err)
        setError(err instanceof Error ? err.message : 'Failed to load article')
      } finally {
        setLoading(false)
      }
    }

    loadArticle()
  }, [params.id, supabase])

  const handleContentChange = (newContent: string) => {
    if (article) {
      setArticle({ 
        ...article, 
        content: newContent,
        content_format: 'html'
      })
    }
  }

  const handleSave = async () => {
    if (!article) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('content')
        .update({ 
          content: article.content,
          content_format: 'html'
        })
        .eq('id', article.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Article saved successfully'
      })
    } catch (error) {
      console.error('Error saving article:', error)
      toast({
        title: 'Error',
        description: 'Failed to save article',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateClick = () => {
    setShowRegenerateDialog(true)
  }

  const handleRegenerateSubmit = async () => {
    if (!article || !regenerateFeedback.trim()) {
      toast({
        title: 'Feedback Required',
        description: 'Please provide feedback on what needs to be changed in the article.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsRegenerating(true)
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'regenerateArticleContent',
          metadata: {
            title: article.title,
            description: article.description,
            primaryKeyword: article.primary_keyword,
            secondaryKeywords: article.secondary_keywords,
            articleType: 'article',
            wordCount: article.content.split(' ').length
          },
          feedback: regenerateFeedback,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate content')
      }

      const { content } = await response.json()
      setArticle({ ...article, content })
      setShowRegenerateDialog(false)
      setRegenerateFeedback('')
      
      toast({
        title: 'Content Regenerated',
        description: 'The article has been regenerated based on your feedback.'
      })
    } catch (error) {
      console.error('Error regenerating content:', error)
      toast({
        title: 'Error',
        description: 'Failed to regenerate the article. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleSubmitToWorkflow = async () => {
    if (!article) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('content')
        .update({
          status: 'pending_approval',
          content: article.content
        })
        .eq('id', article.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Article submitted for approval'
      })
      
      router.push('/content')
    } catch (error) {
      console.error('Error submitting article:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit article for approval',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Card className="p-6">
          <div className="h-[600px] w-full bg-gray-100 animate-pulse rounded-md" />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <h1 className="text-2xl font-bold mb-4">{error}</h1>
            <Button onClick={() => router.push('/content')}>Back to Content</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <h1 className="text-2xl font-bold mb-4">Article not found</h1>
            <Button onClick={() => router.push('/content')}>Back to Content</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
          <p className="text-gray-600">{article.description}</p>
        </div>

        <div className="mb-6">
          <TiptapEditor
            content={article.content}
            onChange={handleContentChange}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Draft'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleRegenerateClick}
              disabled={isRegenerating}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Regenerate Content
            </Button>
          </div>
          
          <Button
            onClick={handleSubmitToWorkflow}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit for Approval'
            )}
          </Button>
        </div>
      </Card>

      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Article Content</DialogTitle>
            <DialogDescription>
              Please provide feedback on what needs to be changed in the article.
              Be specific about what you'd like to improve or modify.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            value={regenerateFeedback}
            onChange={(e) => setRegenerateFeedback(e.target.value)}
            placeholder="Enter your feedback here..."
            className="min-h-[150px]"
          />
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateDialog(false)}
              disabled={isRegenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateSubmit}
              disabled={isRegenerating || !regenerateFeedback.trim()}
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 