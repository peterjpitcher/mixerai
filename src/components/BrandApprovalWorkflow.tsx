'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface BrandApprovalWorkflowProps {
  brandId: string
  status: 'pending' | 'approved' | 'rejected'
  onStatusChange: () => void
}

export default function BrandApprovalWorkflow({
  brandId,
  status,
  onStatusChange,
}: BrandApprovalWorkflowProps) {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStatus = async (newStatus: 'approved' | 'rejected') => {
    try {
      setLoading(true)
      setError(null)

      const { error: supabaseError } = await supabase
        .from('brands')
        .update({ status: newStatus })
        .eq('id', brandId)

      if (supabaseError) throw supabaseError

      onStatusChange()
    } catch (err) {
      console.error('Error updating brand status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update brand status')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'approved' || status === 'rejected') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm">
        {status === 'approved' ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-500">Approved</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">Rejected</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateStatus('approved')}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Approve
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => updateStatus('rejected')}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          Reject
        </Button>
      </div>
    </div>
  )
} 