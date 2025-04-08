'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { MetadataResult } from '@/types/metadata'

const formSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  brandId: z.string().min(1, 'Please select a brand')
})

type FormData = z.infer<typeof formSchema>

interface Brand {
  id: string
  name: string
}

export default function SingleMetadataForm() {
  const { supabase } = useSupabase()
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MetadataResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      brandId: ''
    }
  })

  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('Error fetching brands:', error)
        return
      }

      setBrands(data || [])
    }

    fetchBrands()
  }, [supabase])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/generate-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brandId: data.brandId,
          urls: [data.url],
          isBulk: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate metadata')
      }

      const responseData = await response.json()
      setResult(responseData.results[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com"
                    onChange={(e) => field.onChange(e.target.value)}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Metadata
          </Button>
        </form>
      </Form>

      {error && (
        <Alert variant="destructive">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {result && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="font-medium mb-1">Page Title</h3>
              <Input value={result.pageTitle} readOnly />
            </div>

            <div>
              <h3 className="font-medium mb-1">Meta Description</h3>
              <Input value={result.metaDescription} readOnly />
            </div>

            <div>
              <h3 className="font-medium mb-1">OG Title</h3>
              <Input value={result.ogTitle} readOnly />
            </div>

            <div>
              <h3 className="font-medium mb-1">OG Description</h3>
              <Input value={result.ogDescription} readOnly />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 