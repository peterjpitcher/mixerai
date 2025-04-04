import { JSDOM } from 'jsdom'

export async function extractContentFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const html = await response.text()
    
    // Parse HTML using JSDOM
    const dom = new JSDOM(html)
    const document = dom.window.document
    
    // Remove unwanted elements
    const elementsToRemove = document.querySelectorAll(
      'script, style, nav, header, footer, iframe, .ad, .advertisement, .social-share, .comments'
    )
    elementsToRemove.forEach((element: Element) => element.remove())
    
    // Extract title
    const title = document.querySelector('h1')?.textContent || document.title
    
    // Extract main content
    // Try common content selectors
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      'main'
    ]
    
    let content = ''
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector)
      if (element) {
        content = element.textContent || ''
        break
      }
    }
    
    // If no content found through selectors, get body text
    if (!content) {
      content = document.body.textContent || ''
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim()
    
    return `Title: ${title}\n\nContent: ${content}`
  } catch (error) {
    console.error('Error extracting content:', error)
    throw new Error('Failed to extract content from URL')
  }
} 