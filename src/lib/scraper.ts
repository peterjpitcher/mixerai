import fetch from 'cross-fetch'

export async function extractContentFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Remove script and style elements
    doc.querySelectorAll('script, style').forEach(el => el.remove())

    // Try to find the main content
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.main-content',
      '#main-content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content'
    ]

    let content = ''
    for (const selector of selectors) {
      const element = doc.querySelector(selector)
      if (element) {
        content = element.textContent || ''
        break
      }
    }

    // If no content found with selectors, try to get the body content
    if (!content) {
      const body = doc.querySelector('body')
      content = body?.textContent || ''
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim()

    return content || 'No content found'
  } catch (error: unknown) {
    console.error('Error extracting content:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to extract content from URL: ${errorMessage}`)
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateUrls(urls: string[]): string[] {
  return urls.filter(url => isValidUrl(url))
} 