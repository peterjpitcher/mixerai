'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Users, Building2, FileText, Bell, Plus, Settings, ChevronRight } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalBrands: number
  totalContent: number
  pendingApprovals: number
}

interface Activity {
  id: string
  type: 'content_created' | 'brand_created' | 'content_updated' | 'brand_updated'
  entityId: string
  entityTitle: string
  userId: string
  userEmail: string
  createdAt: string
}

interface ContentWithProfile {
  id: string
  title: string
  user_id: string
  created_at: string
  profiles: {
    email: string
  }
}

interface BrandWithProfile {
  id: string
  name: string
  user_id: string
  created_at: string
  profiles: {
    email: string
  }
}

export default function DashboardPage() {
  const { supabase } = useSupabase()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBrands: 0,
    totalContent: 0,
    pendingApprovals: 0
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    loadActivities()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        { count: usersCount },
        { count: brandsCount },
        { count: contentCount },
        { count: approvalsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('brands').select('*', { count: 'exact', head: true }),
        supabase.from('content').select('*', { count: 'exact', head: true }),
        supabase.from('brands').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ])

      setStats({
        totalUsers: usersCount || 0,
        totalBrands: brandsCount || 0,
        totalContent: contentCount || 0,
        pendingApprovals: approvalsCount || 0
      })
    } catch (err) {
      console.error('Error loading dashboard stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      const { data: contentActivities, error: contentError } = await supabase
        .from('content')
        .select(`
          id,
          title,
          user_id,
          created_at,
          profiles!inner (
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<ContentWithProfile[]>()

      if (contentError) throw contentError

      const { data: brandActivities, error: brandError } = await supabase
        .from('brands')
        .select(`
          id,
          name,
          user_id,
          created_at,
          profiles!inner (
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<BrandWithProfile[]>()

      if (brandError) throw brandError

      const activities: Activity[] = [
        ...(contentActivities || []).map(content => ({
          id: `content-${content.id}`,
          type: 'content_created' as const,
          entityId: content.id,
          entityTitle: content.title,
          userId: content.user_id,
          userEmail: content.profiles.email,
          createdAt: content.created_at
        })),
        ...(brandActivities || []).map(brand => ({
          id: `brand-${brand.id}`,
          type: 'brand_created' as const,
          entityId: brand.id,
          entityTitle: brand.name,
          userId: brand.user_id,
          userEmail: brand.profiles.email,
          createdAt: brand.created_at
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

      setActivities(activities)
    } catch (err) {
      console.error('Error loading activities:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Overview of your system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500">Active users in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBrands}</div>
            <p className="text-xs text-gray-500">Registered brands</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContent}</div>
            <p className="text-xs text-gray-500">Content pieces created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Bell className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-gray-500">Items needing approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {activity.type === 'content_created' && 'New content created:'}
                        {activity.type === 'brand_created' && 'New brand created:'}
                        {activity.type === 'content_updated' && 'Content updated:'}
                        {activity.type === 'brand_updated' && 'Brand updated:'}
                        {' '}
                        <Link
                          href={activity.type.startsWith('content') ? `/content/${activity.entityId}` : `/admin/brands/${activity.entityId}`}
                          className="text-blue-500 hover:underline"
                        >
                          {activity.entityTitle}
                        </Link>
                      </p>
                      <p className="text-xs text-gray-500">
                        by {activity.userEmail} • {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/content/create" className="block">
                <Button
                  className="w-full justify-between"
                  variant="outline"
                >
                  <div className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <h3 className="font-semibold">Create New Content</h3>
                      <p className="text-sm text-gray-500">Start creating new content for your brands</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/admin/brands" className="block">
                <Button
                  className="w-full justify-between"
                  variant="outline"
                >
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <h3 className="font-semibold">Manage Brands</h3>
                      <p className="text-sm text-gray-500">View and manage your brand settings</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/admin/settings" className="block">
                <Button
                  className="w-full justify-between"
                  variant="outline"
                >
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <h3 className="font-semibold">System Settings</h3>
                      <p className="text-sm text-gray-500">Configure system preferences and users</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 