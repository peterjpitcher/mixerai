'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { SelectNative } from '@/components/ui/select-native'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  settings: z.object({
    tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'humorous']).default('professional'),
    brandIdentity: z.string().default(''),
    doNotSay: z.array(z.string()).default([]),
    workflowStages: z.array(z.string()).default(['draft', 'review', 'approved', 'published']),
  }).default({
    tone: 'professional',
    brandIdentity: '',
    doNotSay: [],
    workflowStages: ['draft', 'review', 'approved', 'published'],
  }),
})

type FormData = z.infer<typeof schema>

interface BrandFormProps {
  initialData?: FormData
  onSuccess?: () => void
}

export default function BrandForm({ initialData, onSuccess }: BrandFormProps) {
  const { supabase } = useSupabase()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      name: '',
      slug: '',
      status: 'pending',
      settings: {
        tone: 'professional',
        brandIdentity: '',
        doNotSay: [],
        workflowStages: ['draft', 'review', 'approved', 'published'],
      },
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      console.log('Submitting brand data:', data)
      setError(null)
      
      const { data: result, error: supabaseError } = initialData
        ? await supabase
            .from('brands')
            .update(data)
            .eq('id', initialData.id)
            .select()
        : await supabase
            .from('brands')
            .insert([data])
            .select()

      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        throw supabaseError
      }

      console.log('Brand saved successfully:', result)
      reset()
      onSuccess?.()
    } catch (err) {
      console.error('Error saving brand:', err)
      setError(err instanceof Error ? err.message : 'Failed to save brand')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="name">Brand Name</Label>
        <Input
          id="name"
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          {...register('slug')}
          className={errors.slug ? 'border-red-500' : ''}
        />
        {errors.slug && (
          <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="tone" className="block text-sm font-medium mb-1">Tone of Voice</label>
        <SelectNative
          id="tone"
          {...register('settings.tone')}
          className={errors.settings?.tone ? 'border-red-500' : ''}
        >
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="friendly">Friendly</option>
          <option value="formal">Formal</option>
          <option value="conversational">Conversational</option>
        </SelectNative>
        {errors.settings?.tone && (
          <p className="mt-1 text-sm text-red-500">{errors.settings.tone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="brandIdentity">Brand Identity</Label>
        <Textarea
          id="brandIdentity"
          {...register('settings.brandIdentity')}
          className={errors.settings?.brandIdentity ? 'border-red-500' : ''}
          placeholder="Describe your brand's identity, values, and personality..."
          rows={4}
        />
        {errors.settings?.brandIdentity && (
          <p className="mt-1 text-sm text-red-500">{errors.settings.brandIdentity.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initialData ? 'Update Brand' : 'Create Brand'}
      </Button>
    </form>
  )
} 