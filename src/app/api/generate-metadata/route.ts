import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { GenerateMetadataRequest, GenerateMetadataResponse, MetadataResult } from '@/types/metadata'
import { decode } from 'html-entities'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

// Rate limiting helper
const delay = async (ms: number) => {
  console.log(`Starting delay of ${ms}ms...`)
  try {
    await new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        console.log(`Delay of ${ms}ms completed`)
        resolve(true)
      }, ms)
      // Ensure the timeout is cleared if the promise is rejected
      timeoutId.unref?.()
    })
  } catch (error) {
    console.error('Error in delay:', error)
  }
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Function to extract text content from HTML
function extractTextContent(html: string): string {
  // Remove script and style elements
  const withoutScripts = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  const withoutStyles = withoutScripts.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  
  // Remove HTML tags but keep their content
  const textContent = withoutStyles
    .replace(/<[^>]+>/g, ' ') // Replace tags with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()

  return textContent
}

export async function POST(request: Request) {
  console.log('Starting metadata generation process...')
  
  // Create SSE response stream
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Create the response first
  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })

  const sendProgress = async (message: string, progress: number, result?: MetadataResult) => {
    try {
      console.log('Preparing progress update:', { message, progress, hasResult: !!result })
      const data = JSON.stringify({
        message,
        progress,
        result
      })
      console.log('Encoded data length:', encoder.encode(data).length)
      
      // Write the SSE format with explicit event type
      const sseData = `event: progress\ndata: ${data}\n\n`
      console.log('Writing SSE data...')
      await writer.write(encoder.encode(sseData))
      console.log('SSE data written successfully')
    } catch (error) {
      console.error('Error in sendProgress:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      // Don't throw here, just log the error and continue
    }
  }

  // Start processing in the background
  (async () => {
    try {
      // Get the request body
      const body = await request.json() as GenerateMetadataRequest
      const { brandId, urls, isBulk = false } = body
      console.log(`Received request for ${urls.length} URLs, brandId: ${brandId}`)

      if (!process.env.OPENAI_API_KEY) {
        console.error('OpenAI API key is not configured')
        throw new Error('OpenAI API key is not configured')
      }

      // Validate request
      if (!brandId || !urls || urls.length === 0) {
        console.log('Invalid request: Missing required fields')
        await writer.close()
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Initialize Supabase client
      const supabase = createRouteHandlerClient({ cookies })

      // Get brand information
      console.log('Fetching brand information...', { brandId })
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('settings')
        .eq('id', brandId)
        .single()

      if (brandError) {
        console.error('Error fetching brand:', {
          error: brandError,
          message: brandError.message,
          details: brandError.details,
          hint: brandError.hint,
          code: brandError.code
        })
        await writer.close()
        return new Response(
          JSON.stringify({ error: 'Brand not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (!brand) {
        console.error('Brand not found:', { brandId })
        await writer.close()
        return new Response(
          JSON.stringify({ error: 'Brand not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      console.log('Brand found:', { 
        brandId,
        hasSettings: Boolean(brand.settings),
        settingsKeys: brand.settings ? Object.keys(brand.settings) : []
      })
      console.log('Starting URL processing...')

      // Process each URL with rate limiting
      const results: MetadataResult[] = []
      const totalUrls = urls.length

      console.log('Starting URL processing loop:', { totalUrls, urls })
      
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        const progress = Math.round(((i + 1) / totalUrls) * 100)
        console.log(`\nProcessing URL ${i + 1}/${totalUrls}: ${url}`)

        try {
          // Send initial progress update
          console.log('Sending initial progress update...')
          await sendProgress(`Processing ${i + 1} of ${totalUrls}: ${url}`, progress)
          console.log('Initial progress update sent')
          
          // Add delay between requests to prevent rate limiting
          console.log('Adding delay before processing...')
          await delay(500)
          console.log('Delay completed')

          // Fetch the page content with timeout
          console.log('Fetching page content...')
          let response: Response
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => {
              controller.abort()
              console.log('Fetch request timed out after 30 seconds')
            }, 30000) // 30 second timeout
            
            console.log(`Starting fetch request for URL: ${url}`)
            try {
              response = await Promise.race([
                fetch(url, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                  },
                  signal: controller.signal
                }),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error('Fetch timeout')), 30000)
                )
              ]) as Response
            } catch (fetchError: any) {
              console.error('Fetch operation failed:', {
                error: fetchError,
                message: fetchError.message,
                type: fetchError.type,
                name: fetchError.name,
                url: url
              })
              throw new Error(`Fetch failed: ${fetchError.message}`)
            }
            
            console.log('Fetch request completed with status:', response.status)
            
            clearTimeout(timeoutId)
            
            if (!response.ok) {
              console.error('Fetch request failed with status:', {
                status: response.status,
                statusText: response.statusText,
                url: url
              })
              throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
            }
          } catch (error: any) {
            console.error('Error during fetch operation:', {
              error: error,
              message: error.message,
              type: error.type,
              name: error.name,
              url: url
            })
            throw new Error(`Failed to fetch URL: ${error.message || 'Unknown error'}`)
          }

          console.log('Starting to read response text...')
          let html: string
          try {
            html = await response.text()
            console.log('Successfully read HTML content, length:', html.length)
          } catch (textError) {
            console.error('Error getting response text:', textError)
            throw new Error('Failed to get page content')
          }

          console.log('Starting text content extraction...')
          const textContent = extractTextContent(html)
          console.log(`Successfully extracted ${textContent.length} characters of text content`)

          // Get existing metadata for context
          console.log('Starting metadata extraction...')
          const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
          const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i) || 
                                 html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i)
          const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i) ||
                              html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/i)
          const ogDescriptionMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i) ||
                                   html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"[^>]*>/i)

          // Clean and decode existing metadata
          const existingTitle = decode(titleMatch?.[1]?.trim() || '')
          const existingDescription = decode(descriptionMatch?.[1]?.trim() || '')
          const existingOgTitle = decode(ogTitleMatch?.[1]?.trim() || '')
          const existingOgDescription = decode(ogDescriptionMatch?.[1]?.trim() || '')

          console.log('Existing metadata found:', {
            title: existingTitle || 'none',
            description: existingDescription || 'none',
            ogTitle: existingOgTitle || 'none',
            ogDescription: existingOgDescription || 'none'
          })

          await sendProgress(`Generating metadata for ${url}...`, progress)

          // Generate metadata using OpenAI
          console.log('Starting OpenAI API call preparation...')
          let completion
          try {
            const messages: ChatCompletionMessageParam[] = [
              {
                role: "system",
                content: `You are a metadata generation expert. Given a webpage's content, generate SEO-optimized metadata that accurately represents the page while maintaining the brand's voice and style. The metadata should be concise, informative, and engaging.

Format your response as a JSON object with these fields:
{
  "title": "SEO-optimized page title (max 60 chars)",
  "description": "Compelling meta description (max 160 chars)",
  "ogTitle": "Engaging social media title (max 60 chars)",
  "ogDescription": "Social media optimized description (max 200 chars)"
}

Consider any existing metadata as context but generate fresh, optimized versions.`
              },
              {
                role: "user",
                content: `URL: ${url}

Existing metadata:
Title: ${existingTitle}
Description: ${existingDescription}
OG Title: ${existingOgTitle}
OG Description: ${existingOgDescription}

Page content:
${textContent.slice(0, 1500)}` // Send first 1500 chars for context
              }
            ]

            console.log('OpenAI request configuration:', {
              model: "gpt-4o",
              messageCount: messages.length,
              contentLength: messages[1].content.length,
              responseFormat: { type: "json_object" }
            })

            console.log('Making OpenAI API request...')
            const startTime = Date.now()
            
            completion = await openai.chat.completions.create({
              model: "gpt-4o",
              messages,
              response_format: { type: "json_object" }
            })

            const endTime = Date.now()
            console.log(`OpenAI API request completed in ${endTime - startTime}ms`)
            console.log('OpenAI response structure:', {
              id: completion.id,
              model: completion.model,
              choicesLength: completion?.choices?.length,
              firstChoiceRole: completion?.choices?.[0]?.message?.role,
              hasContent: Boolean(completion?.choices?.[0]?.message?.content),
              contentLength: completion?.choices?.[0]?.message?.content?.length
            })
          } catch (error: any) {
            console.error('OpenAI API error details:', {
              name: error.name,
              message: error.message,
              type: error.type,
              code: error.code,
              param: error.param,
              stack: error.stack,
              status: error.status,
              headers: error.response?.headers,
              requestId: error.response?.headers?.get('x-request-id')
            })
            throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`)
          }

          if (!completion?.choices?.[0]?.message?.content) {
            console.error('Invalid OpenAI response structure:', JSON.stringify(completion, null, 2))
            throw new Error('No content received from OpenAI')
          }

          console.log('Parsing OpenAI response content...')
          let generatedMetadata
          try {
            generatedMetadata = JSON.parse(completion.choices[0].message.content)
            console.log('Successfully parsed metadata:', generatedMetadata)
          } catch (parseError) {
            console.error('Failed to parse OpenAI response:', {
              error: parseError,
              content: completion.choices[0].message.content
            })
            throw new Error('Failed to parse OpenAI response')
          }

          // Generate metadata using brand context
          console.log('Building final metadata object...')
          const metadata: MetadataResult = {
            url,
            pageTitle: generatedMetadata.title || existingTitle || url.split('/').pop() || 'Untitled Page',
            metaDescription: generatedMetadata.description || existingDescription || 'No description available',
            ogTitle: generatedMetadata.ogTitle || generatedMetadata.title || existingOgTitle || 'Untitled Page',
            ogDescription: generatedMetadata.ogDescription || generatedMetadata.description || existingOgDescription || 'No description available',
            status: 'success',
            error: null
          }

          console.log('Final metadata object created:', metadata)
          results.push(metadata)
          
          console.log('Attempting to send progress update...')
          try {
            await sendProgress(`Processed ${i + 1} of ${totalUrls}`, progress, metadata)
            console.log('Progress update sent successfully')
          } catch (progressError) {
            console.error('Error sending progress update:', progressError)
            // Continue processing even if progress update fails
          }
        } catch (error) {
          console.error(`Error processing URL ${url}:`, error)
          const errorMetadata: MetadataResult = {
            url,
            pageTitle: '',
            metaDescription: '',
            ogTitle: '',
            ogDescription: '',
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to generate metadata'
          }
          results.push(errorMetadata)
          await sendProgress(`Error processing ${i + 1} of ${totalUrls}: ${url}`, progress, errorMetadata)
        }
      }

      console.log('All URLs processed, attempting to close stream...')
      try {
        await sendProgress('Processing complete', 100)
        console.log('Final progress update sent')
        await writer.close()
        console.log('Stream closed successfully')
      } catch (closeError) {
        console.error('Error during stream closure:', closeError)
        throw closeError
      }

    } catch (error) {
      console.error('Fatal error in generate-metadata:', error)
      try {
        await sendProgress('Error occurred', 0)
        await writer.close()
      } catch (closeError) {
        console.error('Error closing writer:', closeError)
      }
    }
  })()

  // Return the response immediately
  return response
} 