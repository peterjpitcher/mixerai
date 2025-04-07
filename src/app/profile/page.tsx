'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { withRoleProtection } from '@/components/auth/withRoleProtection'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  title: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

function ProfilePage() {
  const { user, userLoading, supabase } = useSupabase()
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.user_metadata?.full_name || '',
      title: user?.user_metadata?.title || '',
      phone: user?.user_metadata?.phone || '',
      bio: user?.user_metadata?.bio || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          title: data.title,
          phone: data.phone,
          bio: data.bio,
        },
      })

      if (error) throw error

      setUpdateSuccess(true)
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-400">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-white">Profile Settings</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-gray-400">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-lg bg-gray-800 px-4 py-2 text-white opacity-50"
            />
          </div>

          <div>
            <label htmlFor="full_name" className="mb-2 block text-sm text-gray-400">
              Full Name *
            </label>
            <input
              {...register('full_name')}
              type="text"
              id="full_name"
              className="w-full rounded-lg bg-gray-800 px-4 py-2 text-white"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="mb-2 block text-sm text-gray-400">
              Title
            </label>
            <input
              {...register('title')}
              type="text"
              id="title"
              className="w-full rounded-lg bg-gray-800 px-4 py-2 text-white"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm text-gray-400">
              Phone
            </label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className="w-full rounded-lg bg-gray-800 px-4 py-2 text-white"
            />
          </div>

          <div>
            <label htmlFor="bio" className="mb-2 block text-sm text-gray-400">
              Bio
            </label>
            <textarea
              {...register('bio')}
              id="bio"
              rows={4}
              className="w-full rounded-lg bg-gray-800 px-4 py-2 text-white"
            />
            {errors.bio && <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>}
          </div>

          {updateError && <p className="text-sm text-red-500">{updateError}</p>}
          {updateSuccess && (
            <p className="text-sm text-green-500">Profile updated successfully!</p>
          )}

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Protect the profile page - all authenticated users can access it
export default withRoleProtection(ProfilePage, []) 