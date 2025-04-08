import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractContentFromUrls } from '@/lib/utils'

interface BrandIdentityResponse {
  brandIdentity: string;
  toneOfVoice: string;
  guardrails: string[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const { urls, language = 'en', country = 'US' } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { message: 'At least one URL is required' },
        { status: 400 }
      )
    }

    // Extract content from URLs
    let websiteContent = ''
    try {
      websiteContent = await extractContentFromUrls(urls)
    } catch (error) {
      console.error('Error extracting content from URLs:', error)
      websiteContent = 'Failed to extract content from URLs'
    }

    // Generate brand identity
    const brandIdentityCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a brand identity expert. Create a comprehensive brand identity analysis that MUST be written in ${language} and specifically tailored for the ${country} market. This is a strict requirement - do not generate content in any other language.

Your response MUST be in JSON format with the following structure:
{
  "brandIdentity": "A comprehensive description of the brand's identity, values, and mission in ${language}",
  "toneOfVoice": "A detailed description of how the brand should communicate in ${language}, including style and emotional resonance, specifically for the ${country} market",
  "guardrails": [
    "List of specific content restrictions",
    "Each guardrail must be 6 words or less",
    "Maximum of 10 guardrails total"
  ]
}

Requirements:
1. All content MUST be in ${language} only
2. All content MUST be specifically adapted for ${country} cultural context
3. Each guardrail MUST be 6 words or less
4. Include no more than 10 guardrails total
5. Make guardrails clear, actionable, and specific

Base your analysis on this content from their website:
${websiteContent}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })

    const response = brandIdentityCompletion.choices[0].message.content

    if (!response) {
      return NextResponse.json(
        { message: 'Failed to generate brand identity' },
        { status: 500 }
      )
    }

    try {
      const parsedResponse = JSON.parse(response) as BrandIdentityResponse
      
      // Validate guardrails
      if (Array.isArray(parsedResponse.guardrails)) {
        // Ensure no more than 10 guardrails
        parsedResponse.guardrails = parsedResponse.guardrails.slice(0, 10)
        
        // Ensure each guardrail is 6 words or less
        parsedResponse.guardrails = parsedResponse.guardrails.map((guardrail: string) => {
          const words = guardrail.trim().split(/\s+/)
          if (words.length > 6) {
            return words.slice(0, 6).join(' ')
          }
          return guardrail
        })
      }

      return NextResponse.json(parsedResponse)
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      return NextResponse.json(
        { message: 'Failed to parse brand identity response' },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('Error in generate-brand-identity:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { message: `Failed to generate brand identity: ${errorMessage}` },
      { status: 500 }
    )
  }
} 