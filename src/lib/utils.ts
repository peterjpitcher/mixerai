import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import fetch from 'node-fetch'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts text content from a list of URLs
 * @param urls Array of URLs to extract content from
 * @returns Combined text content from all URLs
 */
export async function extractContentFromUrls(urls: string[]): Promise<string> {
  // This function should only be called on the server side
  if (typeof window !== 'undefined') {
    throw new Error('extractContentFromUrls should only be called on the server side')
  }

  try {
    // Import cheerio dynamically only on server-side
    const cheerio = await import('cheerio')
    
    const contents = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; MixerAI/1.0; +https://mixer.ai)'
            }
          })
          
          if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
          }

          const html = await response.text()
          const $ = cheerio.load(html)

          // Remove unwanted elements
          $('script, style, iframe, img, svg, noscript').remove()
          
          // Get text from body, removing excess whitespace
          const text = $('body')
            .text()
            .replace(/\s+/g, ' ')
            .trim()
          
          return text
        } catch (error) {
          console.error(`Error fetching content from ${url}:`, error)
          return ''
        }
      })
    )
    
    // Combine all content with double newlines between each piece
    const combinedContent = contents.filter(Boolean).join('\n\n')
    
    // Limit content length to avoid token limits
    return combinedContent.slice(0, 8000)
  } catch (error) {
    console.error('Error extracting content from URLs:', error)
    return ''
  }
}