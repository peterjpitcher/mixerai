'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { MetadataResult } from '@/types/metadata'
import BulkMetadataResults from './BulkMetadataResults'

const formSchema = z.object({
  urls: z.string().min(1, 'Please enter at least one URL'),
  brandId: z.string().min(1, 'Please select a brand')
})

type FormData = z.infer<typeof formSchema>

interface Brand {
  id: string
  name: string
}

export default function BulkMetadataForm() {
  const { supabase } = useSupabase()
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<MetadataResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urls: '',
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
    setResults([])

    try {
      // Split URLs by newline and filter out empty lines
      const urls = data.urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      if (urls.length === 0) {
        throw new Error('Please enter at least one valid URL')
      }

      const response = await fetch('/api/generate-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brandId: data.brandId,
          urls,
          isBulk: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate metadata')
      }

      const responseData = await response.json()
      setResults(responseData.results)
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
            name="urls"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URLs (one per line)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                    className="min-h-[200px] font-mono"
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

      {results.length > 0 && <BulkMetadataResults results={results} />}
    </div>
  )
} 