'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectNative } from '@/components/ui/select-native'
import { InvitationPreview } from '@/components/InvitationPreview'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  roleId: z.string().uuid('Please select a role'),
  brandIds: z.array(z.string().uuid()).min(1, 'Please select at least one brand'),
})

type FormData = {
  email: string
  roleId: string
  roleName: string
  brandIds: string[]
}

interface Role {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

export default function InvitationForm() {
  const { supabase } = useSupabase()
  const [roles, setRoles] = useState<Role[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    loadRolesAndBrands()
  }, [])

  async function loadRolesAndBrands() {
    try {
      const [rolesResult, brandsResult] = await Promise.all([
        supabase.from('roles').select('id, name'),
        supabase.from('brands').select('id, name'),
      ])

      if (rolesResult.error) throw rolesResult.error
      if (brandsResult.error) throw brandsResult.error

      setRoles(rolesResult.data)
      setBrands(brandsResult.data)
    } catch (error) {
      console.error('Error loading roles and brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('/api/edge/create-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      reset()
      setSelectedRole(null)
    } catch (error) {
      console.error('Error creating invitation:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className="mt-1"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="roleId">Role</Label>
        <Controller
          name="roleId"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <label htmlFor="roleId" className="block text-sm font-medium">Role</label>
              <SelectNative
                id="roleId"
                value={field.value}
                onChange={(e) => {
                  const value = e.target.value
                  field.onChange(value)
                  const selectedRole = roles.find((role) => role.id === value)
                  if (selectedRole) {
                    setValue('roleName', selectedRole.name)
                  }
                }}
                className={errors.roleId ? 'border-red-500' : ''}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </SelectNative>
              {errors.roleId && (
                <p className="text-sm text-red-500">{errors.roleId.message}</p>
              )}
            </div>
          )}
        />
      </div>

      <div>
        <Label htmlFor="brandIds">Brands</Label>
        <Controller
          name="brandIds"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <SelectNative
              id="brandIds"
              multiple
              value={field.value}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const options = e.target.options
                const value = []
                for (let i = 0; i < options.length; i++) {
                  if (options[i].selected) {
                    value.push(options[i].value)
                  }
                }
                field.onChange(value)
              }}
              className="mt-1"
              size={4}
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </SelectNative>
          )}
        />
        {errors.brandIds && (
          <p className="mt-1 text-sm text-red-500">{errors.brandIds.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Invitation...
            </>
          ) : (
            'Send Invitation'
          )}
        </Button>

        {selectedRole && (
          <InvitationPreview
            email={control._formValues.email || 'example@email.com'}
            role={control._formValues.roleName || ''}
          />
        )}
      </div>
    </form>
  )
} 