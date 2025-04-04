import { NextResponse } from 'next/server'
import { parse, HTMLElement } from 'node-html-parser'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Fetch the content server-side
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandAIBot/1.0; +http://example.com)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()

    // Parse HTML and extract text content
    const root = parse(html)

    // Remove unwanted elements
    root.querySelectorAll('script, style, noscript, iframe').forEach((el: HTMLElement) => el.remove())

    // Get text content and clean it up
    const content = root.textContent
      .replace(/\s+/g, ' ')
      .trim()

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error fetching URL content:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch URL content' },
      { status: 500 }
    )
  }
} 