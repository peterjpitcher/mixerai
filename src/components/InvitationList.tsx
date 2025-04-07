'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Mail, X, RefreshCw, Filter, ChevronUp, ChevronDown } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  role: {
    id: string
    name: string
  }
  brand_ids: string[]
  invited_by: {
    email: string
  }
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  created_at: string
  expiry_date: string
}

interface SortConfig {
  field: keyof Pick<Invitation, 'email' | 'created_at' | 'status' | 'expiry_date'>
  direction: 'asc' | 'desc'
}

export default function InvitationList() {
  const { supabase } = useSupabase()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<Invitation['status'] | 'all'>('all')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'created_at', direction: 'desc' })

  useEffect(() => {
    loadInvitations()
    // Subscribe to changes
    const channel = supabase
      .channel('invitations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
        },
        () => {
          loadInvitations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const loadInvitations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('invitations_view')
      .select('*, role:roles(id, name), invited_by:profiles(email)')

    if (data && !error) {
      setInvitations(data as Invitation[])
    }
    setLoading(false)
  }

  const revokeInvitation = async (id: string) => {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', id)

    if (!error) {
      loadInvitations()
    }
  }

  const resendInvitation = async (id: string) => {
    const { error } = await supabase.functions.invoke('resend-invitation', {
      body: { invitationId: id }
    })

    if (!error) {
      // Show success message
    }
  }

  const handleSort = (field: SortConfig['field']) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const sortedAndFilteredInvitations = invitations
    .filter(inv => statusFilter === 'all' || inv.status === statusFilter)
    .sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1
      if (sortConfig.field === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction
      }
      return (a[sortConfig.field] > b[sortConfig.field] ? 1 : -1) * direction
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="revoked">Revoked</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <button
          onClick={loadInvitations}
          className="rounded-md bg-gray-700 px-3 py-1 text-sm text-gray-200 hover:bg-gray-600"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center space-x-1">
                  <span>Email</span>
                  {sortConfig.field === 'email' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Invited By
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {sortConfig.field === 'status' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {sortConfig.field === 'created_at' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('expiry_date')}
              >
                <div className="flex items-center space-x-1">
                  <span>Expires</span>
                  {sortConfig.field === 'expiry_date' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : sortedAndFilteredInvitations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                  No invitations found
                </td>
              </tr>
            ) : (
              sortedAndFilteredInvitations.map((invitation) => {
                const isExpiringSoon = invitation.status === 'pending' && 
                  new Date(invitation.expiry_date).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 // 24 hours

                return (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {invitation.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {invitation.role.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {invitation.invited_by.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        invitation.status === 'pending'
                          ? 'bg-yellow-800 text-yellow-200'
                          : invitation.status === 'accepted'
                          ? 'bg-green-800 text-green-200'
                          : invitation.status === 'expired'
                          ? 'bg-gray-800 text-gray-200'
                          : 'bg-red-800 text-red-200'
                      }`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invitation.status === 'pending' ? (
                        <span className={isExpiringSoon ? 'text-red-400' : 'text-gray-300'}>
                          {new Date(invitation.expiry_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {invitation.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => resendInvitation(invitation.id)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Resend invitation"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => revokeInvitation(invitation.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Revoke invitation"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 