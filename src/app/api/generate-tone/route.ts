import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractContentFromUrl } from '@/lib/scraper'

// Validate environment variables
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  throw new Error('OPENAI_API_KEY is not properly configured')
}

if (!process.env.OPENAI_BASE_URL) {
  throw new Error('OPENAI_BASE_URL is not configured')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': process.env.OPENAI_API_KEY }
})

export async function POST(request: Request) {
  try {
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'At least one URL is required' },
        { status: 400 }
      )
    }

    try {
      // Extract content from all URLs
      const contentPromises = urls.map(url => extractContentFromUrl(url))
      const contents = await Promise.all(contentPromises)
      const combinedContent = contents.filter(Boolean).join('\n\n')

      if (!combinedContent) {
        throw new Error('Failed to extract content from URLs')
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a brand voice expert. Analyze the provided content from the brand's website and generate a comprehensive tone of voice guide.

Your analysis should cover:

1. Overall Communication Style:
- Primary tone characteristics (e.g., professional, friendly, authoritative)
- Voice personality traits (e.g., confident, empathetic, innovative)
- Emotional resonance (e.g., inspiring, reassuring, energetic)

2. Language Specifics:
- Vocabulary preferences (e.g., simple vs. technical, industry terms)
- Sentence structure (e.g., concise vs. elaborate, active voice)
- Technical level (e.g., beginner-friendly vs. expert)
- Industry-specific terminology usage

3. Content Delivery:
- Formality level (e.g., casual, business casual, formal)
- Engagement approach (e.g., direct, conversational, educational)
- Storytelling style (e.g., narrative, factual, case studies)
- Persuasion techniques (e.g., logic, emotion, social proof)

4. Writing Guidelines:
- Sentence length preferences (e.g., mix of short and long)
- Paragraph structure (e.g., scannable, detailed)
- Use of literary devices (e.g., metaphors, analogies)
- Formatting preferences (e.g., bullets, subheadings)

Format your response as JSON with this structure:
{
  "generatedTone": "Write a detailed, actionable tone of voice guide that combines all the analyzed elements. Make it specific to the brand and avoid generic statements. Include examples where relevant.",
  "styleGuide": {
    "communicationStyle": "Describe the overall communication approach, personality, and emotional tone",
    "languagePreferences": "Detail vocabulary choices, sentence structures, and terminology guidelines",
    "formalityLevel": "Specify the balance between formal and informal communication",
    "writingStyle": "Outline specific writing techniques, formats, and presentation preferences"
  }
}

Ensure each field contains detailed, specific guidance based on the actual content analyzed.`
          },
          {
            role: "user",
            content: `Please analyze this content from the brand's website and generate a tone of voice guide: ${combinedContent}`
          }
        ],
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(completion.choices[0].message.content || '{}')
      return NextResponse.json(result)
    } catch (error) {
      console.error('OpenAI API Error:', error)
      
      if (error instanceof Error) {
        // Check if it's an authentication error
        if (error.message.includes('authentication')) {
          return NextResponse.json(
            { error: 'OpenAI API key is invalid or not properly configured' },
            { status: 401 }
          )
        }
        
        // Check if it's a rate limit error
        if (error.message.includes('rate limit')) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          )
        }
      }

      throw error // Re-throw for general error handling
    }
  } catch (error) {
    console.error('Error generating tone of voice:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate tone of voice',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 