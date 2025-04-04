'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { withRoleProtection } from '@/components/auth/withRoleProtection'

interface Invitation {
  id: string
  email: string
  status: string
  created_at: string
  accepted_at: string | null
  role_name: string
  brand_names: string[]
  invited_by_email: string
}

function InvitationListPage() {
  const { supabase } = useSupabase()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('invitation_details')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setInvitations(data || [])
    } catch (error) {
      console.error('Error loading invitations:', error)
      setError('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  const resendInvitation = async (email: string) => {
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email)
      if (error) throw error
      alert('Invitation resent successfully')
    } catch (error) {
      console.error('Error resending invitation:', error)
      alert('Failed to resend invitation')
    }
  }

  const revokeInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', id)

      if (error) throw error

      await loadInvitations()
      alert('Invitation revoked successfully')
    } catch (error) {
      console.error('Error revoking invitation:', error)
      alert('Failed to revoke invitation')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl font-bold text-white">Error</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Invitations</h1>
          <a
            href="/admin/invitations"
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
          >
            New Invitation
          </a>
        </div>

        <div className="overflow-x-auto rounded-lg bg-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-4 text-left text-sm font-semibold text-gray-400">
                  Email
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-400">
                  Role
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-400">
                  Brands
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-400">
                  Status
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-400">
                  Invited By
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-400">
                  Date
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr
                  key={invitation.id}
                  className="border-b border-gray-700 hover:bg-gray-700/50"
                >
                  <td className="p-4 text-white">{invitation.email}</td>
                  <td className="p-4 text-white">{invitation.role_name}</td>
                  <td className="p-4 text-white">
                    {invitation.brand_names.join(', ')}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        invitation.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : invitation.status === 'accepted'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}
                    >
                      {invitation.status}
                    </span>
                  </td>
                  <td className="p-4 text-white">
                    {invitation.invited_by_email}
                  </td>
                  <td className="p-4 text-white">
                    {new Date(invitation.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {invitation.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => resendInvitation(invitation.email)}
                          className="text-sm text-blue-500 hover:text-blue-400"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => revokeInvitation(invitation.id)}
                          className="text-sm text-red-500 hover:text-red-400"
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Only admins and brand approvers can access this page
export default withRoleProtection(InvitationListPage, ['admin', 'brand_approver']) 