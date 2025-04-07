'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, FileText, Zap, TrendingUp } from 'lucide-react'

interface ContentStats {
  total: number
  drafts: number
  published: number
  inReview: number
}

interface ContentType {
  type: string
  count: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [stats, setStats] = useState<ContentStats>({
    total: 0,
    drafts: 0,
    published: 0,
    inReview: 0
  })
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      // Get content stats
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .select('status, content_type')

      if (contentError) throw contentError

      // Calculate stats
      const stats = {
        total: contentData.length,
        drafts: contentData.filter(c => c.status === 'draft').length,
        published: contentData.filter(c => c.status === 'published').length,
        inReview: contentData.filter(c => c.status === 'in_review').length
      }
      setStats(stats)

      // Calculate content type distribution
      const typeCount = contentData.reduce((acc: { [key: string]: number }, curr) => {
        acc[curr.content_type] = (acc[curr.content_type] || 0) + 1
        return acc
      }, {})

      setContentTypes(
        Object.entries(typeCount).map(([type, count]) => ({
          type,
          count: count as number
        }))
      )
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Create Article',
      description: 'Write a new article with AI assistance',
      icon: FileText,
      href: '/content/create?type=article'
    },
    {
      title: 'Create Product',
      description: 'Add a new product listing',
      icon: PlusCircle,
      href: '/content/create?type=website-product'
    },
    {
      title: 'Optimize Content',
      description: 'Improve existing content',
      icon: Zap,
      href: '/content/create'
    },
    {
      title: 'View Analytics',
      description: 'Check content performance',
      icon: TrendingUp,
      href: '/analytics'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome to your content management dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Pieces of content</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-muted-foreground">Live content</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inReview}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.drafts}</div>
            <p className="text-xs text-muted-foreground">Work in progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Card key={action.title} className="cursor-pointer hover:bg-accent" onClick={() => router.push(action.href)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{action.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {contentTypes.map((type) => (
              <div key={type.type} className="flex items-center">
                <div className="w-40 text-sm">{type.type}</div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(type.count / stats.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="w-12 text-right text-sm">{type.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
