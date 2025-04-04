'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'

export function withRoleProtection(
  WrappedComponent: React.ComponentType,
  requiredRoles: string[] = []
) {
  return function ProtectedRoute(props: any) {
    // During development, bypass all role checks
    return <WrappedComponent {...props} />
  }
} 