import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { GenerateMetadataRequest, GenerateMetadataResponse, MetadataResult } from '@/types/metadata'

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json() as GenerateMetadataRequest
    const { brandId, urls, isBulk = false } = body

    // Validate request
    if (!brandId || !urls || urls.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Get brand information
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('settings, language, country')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Process each URL
    const results: MetadataResult[] = await Promise.all(
      urls.map(async (url) => {
        try {
          // Fetch the page content
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error('Failed to fetch URL')
          }
          const html = await response.text()

          // Extract existing metadata
          const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || ''
          const description = html.match(/<meta name="description" content="(.*?)"/i)?.[1] || ''
          const ogTitle = html.match(/<meta property="og:title" content="(.*?)"/i)?.[1] || ''
          const ogDescription = html.match(/<meta property="og:description" content="(.*?)"/i)?.[1] || ''

          // Generate metadata using brand context
          const metadata: MetadataResult = {
            url,
            pageTitle: title || 'Generated Title', // Replace with actual AI generation
            metaDescription: description || 'Generated Description', // Replace with actual AI generation
            ogTitle: ogTitle || title || 'Generated OG Title', // Replace with actual AI generation
            ogDescription: ogDescription || description || 'Generated OG Description', // Replace with actual AI generation
            language: brand.language,
            status: 'success',
            error: null
          }

          return metadata
        } catch (error) {
          return {
            url,
            pageTitle: '',
            metaDescription: '',
            ogTitle: '',
            ogDescription: '',
            language: brand.language,
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to generate metadata'
          }
        }
      })
    )

    const response: GenerateMetadataResponse = { results }
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error generating metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 