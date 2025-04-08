'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import BulkMetadataResults from './BulkMetadataResults'
import { MetadataResult } from '@/types/metadata'

const formSchema = z.object({
  urls: z.string().min(1, 'URLs are required'),
  brandId: z.string().min(1, 'Brand is required')
})

type FormData = z.infer<typeof formSchema>

export default function BulkMetadataForm() {
  const { supabase } = useSupabase()
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<MetadataResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState('')

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
    setProgress(0)
    setCurrentMessage('')

    try {
      const urls = data.urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      // Create EventSource for progress updates
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
        throw new Error('Failed to start metadata generation')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to create stream reader')
      }

      const decoder = new TextDecoder()
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const eventData = JSON.parse(line.slice(6))
                setProgress(eventData.progress)
                setCurrentMessage(eventData.message)
                if (eventData.result) {
                  setResults(prev => [...prev, eventData.result])
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing stream:', error)
          setError('Error processing URLs')
        } finally {
          reader.releaseLock()
          setIsLoading(false)
        }
      }

      processStream()
    } catch (err) {
      console.error('Error generating metadata:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands.map(brand => (
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
                    placeholder="https://example.com/page1&#10;https://example.com/page2"
                    {...field}
                    rows={10}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <Alert variant="destructive">
              <p className="text-sm">{error}</p>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Metadata
          </Button>
        </form>
      </Form>

      {(results.length > 0 || isLoading) && (
        <BulkMetadataResults 
          results={results}
          isProcessing={isLoading}
          progress={progress}
          currentMessage={currentMessage}
        />
      )}
    </div>
  )
} 