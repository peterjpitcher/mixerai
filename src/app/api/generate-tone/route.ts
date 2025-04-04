import { NextResponse } from 'next/server'
import OpenAI from 'openai'

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
  defaultQuery: { 'api-version': '2023-05-15' },
  defaultHeaders: { 'api-key': process.env.OPENAI_API_KEY }
})

export async function POST(request: Request) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a brand voice expert. Your task is to analyze the provided content and generate a clear tone of voice guide that defines how the brand communicates. Focus on personality traits, language style, and communication principles. Provide your response in plain text format without any markdown, HTML, or other formatting. Write in clear, flowing paragraphs without bullet points, numbered lists, or special characters."
          },
          {
            role: "user",
            content: `Please analyze this content and generate a tone of voice guide in plain text: ${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })

      // Clean any potential markdown or special characters from the response
      const generatedTone = completion.choices[0].message.content
        ?.replace(/[#*_`-]/g, '') // Remove markdown characters
        .replace(/\n+/g, ' ') // Replace multiple newlines with single space
        .trim()

      return NextResponse.json({ generatedTone })
    } catch (error: unknown) {
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