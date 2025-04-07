'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Invitation = {
  id: string
  email: string
  brand_id: string
  brand_name: string
  role_name: string
  created_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'declined'
  invited_by_email?: string
}

export default function InvitationsPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const { toast } = useToast()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminStatus()
    fetchInvitations()
  }, [])

  const checkAdminStatus = async () => {
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    setIsAdmin(profile?.role === 'admin')
  }

  const fetchInvitations = async () => {
    try {
      if (!user) return

      console.log('Fetching invitations for user:', user.email)

      let query = supabase
        .from('invitations_with_status')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isAdmin) {
        // Regular users see invitations they created or are for them
        query = query.or(`email.eq.${user.email},invited_by_email.eq.${user.email}`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Fetched invitations:', data)

      setInvitations(data?.map(inv => ({
        ...inv,
        brand_name: inv.brand_name || 'Unknown Brand'
      })) || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load invitations.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInvitation = async (invitationId: string, accept: boolean) => {
    try {
      setActionLoading(invitationId)

      const { error } = await supabase
        .rpc('handle_invitation', {
          invitation_id: invitationId,
          accept_invitation: accept
        })

      if (error) throw error

      toast({
        title: 'Success',
        description: `Invitation ${accept ? 'accepted' : 'declined'} successfully.`,
      })

      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    } catch (error) {
      console.error('Error handling invitation:', error)
      toast({
        title: 'Error',
        description: `Failed to ${accept ? 'accept' : 'decline'} invitation.`,
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>You have no pending invitations</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Invitations</h1>
        {isAdmin && (
          <Button onClick={() => router.push('/admin/invitations/new')}>
            Send New Invitation
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                {isAdmin && <TableHead>Invited By</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>{invitation.brand_name}</TableCell>
                  <TableCell>{invitation.role_name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      invitation.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : invitation.status === 'accepted'
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {invitation.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(invitation.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invitation.expires_at).toLocaleDateString()}</TableCell>
                  {isAdmin && <TableCell>{invitation.invited_by_email}</TableCell>}
                  <TableCell className="text-right">
                    {invitation.status === 'pending' && (
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvitation(invitation.id, false)}
                          disabled={actionLoading === invitation.id}
                        >
                          {actionLoading === invitation.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleInvitation(invitation.id, true)}
                          disabled={actionLoading === invitation.id}
                        >
                          {actionLoading === invitation.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Accept
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 