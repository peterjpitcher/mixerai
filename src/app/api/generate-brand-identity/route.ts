import { NextResponse } from 'next/server'
import { JSDOM } from 'jsdom'
import OpenAI from 'openai'
import { isValidUrl } from '@/lib/scraper'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

if (!process.env.OPENAI_BASE_URL) {
  throw new Error('Missing OPENAI_BASE_URL environment variable')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': process.env.OPENAI_API_KEY },
})

async function extractContentFromUrl(url: string): Promise<string> {
  try {
    // Validate URL before fetching
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL format')
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow',
      cache: 'no-cache'
    })
    
    if (response.status === 404) {
      throw new Error(`Page not found: ${url}`)
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status}): ${response.statusText}`)
    }

    const html = await response.text()
    
    // Check if we actually got HTML content
    if (!html || html.trim().length === 0) {
      throw new Error('Received empty response from server')
    }

    // Create JSDOM instance with CSS and JavaScript disabled
    const dom = new JSDOM(html, {
      runScripts: 'outside-only',
      resources: 'usable',
      pretendToBeVisual: true,
      includeNodeLocations: false,
      storageQuota: 0,
      contentType: 'text/html',
      virtualConsole: new (require('jsdom').VirtualConsole)(),
      cookieJar: undefined,
      beforeParse(window) {
        // Disable resource loading
        window.document.implementation.createHTMLDocument = () => {
          throw new Error('Resource loading disabled')
        }
      }
    })
    
    const doc = dom.window.document

    // Remove script, style, and other non-content elements
    const elementsToRemove = [
      'script',
      'style',
      'link',
      'nav',
      'header',
      'footer',
      'iframe',
      'noscript',
      'aside',
      'meta',
      '[role="complementary"]',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]'
    ]

    elementsToRemove.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove())
    })

    // Try to find the main content using common selectors
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.main-content',
      '#main-content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      '[class*="content"]',
      '[id*="content"]',
      '.post',
      '.article',
      '.entry'
    ]

    let content = ''
    
    // Try each selector until we find content
    for (const selector of selectors) {
      try {
        const elements = doc.querySelectorAll(selector)
        if (elements.length > 0) {
          content = Array.from(elements)
            .map(element => element.textContent || '')
            .join('\n')
          if (content.trim().length > 50) {
            break
          }
        }
      } catch (error) {
        console.warn(`Error using selector "${selector}":`, error)
        continue
      }
    }

    // If no content found with selectors, get text from body
    if (!content || content.trim().length < 50) {
      try {
        // Get all paragraphs and headings
        const textElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6')
        content = Array.from(textElements)
          .map(el => el.textContent || '')
          .filter(text => text.trim().length > 0)
          .join('\n')
      } catch (error) {
        console.warn('Error extracting text from body:', error)
      }
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .replace(/[^\S\r\n]+/g, ' ') // Replace multiple spaces (but not newlines) with single space
      .trim()

    if (!content || content.length < 50) {
      throw new Error('Could not extract meaningful content from the page')
    }

    return content
  } catch (error: unknown) {
    console.error('Error extracting content from URL:', url, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to extract content from ${url}: ${errorMessage}`)
  }
}

export async function POST(request: Request) {
  try {
    const { urls, language, country } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { message: 'At least one valid URL is required' },
        { status: 400 }
      )
    }

    if (!language || !country) {
      return NextResponse.json(
        { message: 'Language and country are required' },
        { status: 400 }
      )
    }

    // Generate brand identity
    const brandIdentityCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a brand identity expert. Create a comprehensive brand identity description for a ${language} brand in ${country}. 

Format the response with clear sections using markdown headers:

# Brand Identity
## Core Values & Mission
[Describe the fundamental principles and mission]

## Brand Personality
[Describe the brand's character traits and emotional attributes]

## Target Audience
[Describe the primary audience and their characteristics]

## Brand Promise
[Describe what the brand commits to delivering]

Keep each section concise and impactful. Use professional language and avoid generic statements.`
        },
        {
          role: "user",
          content: `Please analyze these URLs and create a structured brand identity description: ${urls.join(', ')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    // Generate tone of voice
    const toneOfVoiceCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a tone of voice expert. Create a detailed tone of voice guide for a ${language} brand in ${country}. 

Format the response with clear sections using markdown headers:

# Tone of Voice Guide
## Overall Communication Style
[Describe the general tone and approach]

## Language Characteristics
[List specific language preferences and style choices]

## Writing Guidelines
- [Guideline 1]
- [Guideline 2]
- [Guideline 3]

## Key Phrases & Vocabulary
- Preferred terms: [List terms]
- Terms to avoid: [List terms]

Keep guidelines specific and actionable. Focus on practical application.`
        },
        {
          role: "user",
          content: `Based on this brand identity, create a structured tone of voice guide: ${brandIdentityCompletion.choices[0].message.content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    // Generate content guardrails
    const guardrailsCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a content compliance expert. Create a clear list of content restrictions and guardrails for a ${language} brand in ${country}. 

Format your response as a numbered list of specific, actionable restrictions. Each restriction should:
1. Start with a clear action verb (Avoid, Do not, Never, etc.)
2. Be specific and unambiguous
3. Include an example if helpful

Example format:
1. Avoid technical jargon that could confuse beginners. Example: Instead of "API endpoints", say "connection points"
2. Never make unsubstantiated health claims about products
3. Do not use aggressive or pushy sales language

Focus on what content should NOT include. Be specific to the brand's industry and values.`
        },
        {
          role: "user",
          content: `Based on this brand identity and tone of voice, create a numbered list of content guardrails: ${brandIdentityCompletion.choices[0].message.content}\n\n${toneOfVoiceCompletion.choices[0].message.content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    // Parse guardrails into an array, keeping the numbering
    const guardrails = guardrailsCompletion.choices[0].message.content
      ?.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.trim())
      .filter(line => /^\d+\./.test(line)) // Only keep numbered lines
      .map(line => line.replace(/^\d+\.\s*/, '').trim()) || []

    return NextResponse.json({
      brandIdentity: brandIdentityCompletion.choices[0].message.content,
      toneOfVoice: toneOfVoiceCompletion.choices[0].message.content,
      guardrails
    })
  } catch (error) {
    console.error('Error generating brand identity:', error)
    return NextResponse.json(
      { message: 'Failed to generate brand identity' },
      { status: 500 }
    )
  }
} 