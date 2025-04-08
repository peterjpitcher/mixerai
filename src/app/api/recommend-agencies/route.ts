import { NextResponse } from 'next/server'
import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

if (!process.env.AZURE_OPENAI_ENDPOINT) {
  throw new Error('Missing AZURE_OPENAI_ENDPOINT environment variable')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': process.env.OPENAI_API_KEY }
})

interface Agency {
  name: string
  priority?: number
}

export async function POST(request: Request) {
  try {
    const { brandName, brandIdentity, toneOfVoice, language, country } = await request.json()

    if (!brandIdentity || !toneOfVoice || !language || !country) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate agency recommendations
    const recommendationCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in regulatory compliance and content moderation. Based on the brand information provided, recommend relevant regulatory bodies and content moderation agencies that this brand should consider for their content validation process.

Your response should be in JSON format with the following structure:
{
  "agencies": [
    {
      "id": "unique-id",
      "name": "Agency Name",
      "priority": 1,
      "description": "Brief explanation of why this agency is relevant"
    }
  ]
}

Priority Levels:
1 - Critical/Mandatory: Regulatory bodies that are legally required or essential for the brand's operation
2 - Important: Highly recommended agencies based on industry standards and best practices
3 - Optional: Additional agencies that could provide value but aren't essential

Guidelines:
1. Sort agencies by priority (1 to 3)
2. Include 2-3 agencies for each priority level
3. Focus on the most relevant agencies for the brand's specific needs
4. Consider:
   - The brand's industry and content type
   - Regional regulations in ${country}
   - Language-specific requirements for ${language}
   - Content moderation needs based on the tone of voice
   - Industry-specific regulatory bodies

Brand Information:
Name: ${brandName}
Brand Identity: ${brandIdentity}
Tone of Voice: ${toneOfVoice}
Country: ${country}
Language: ${language}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    })

    const response = recommendationCompletion.choices[0].message.content

    if (!response) {
      return NextResponse.json(
        { message: 'Failed to generate agency recommendations' },
        { status: 500 }
      )
    }

    try {
      const parsedResponse = JSON.parse(response)
      
      // Sort agencies by priority if they exist
      if (parsedResponse.agencies && Array.isArray(parsedResponse.agencies)) {
        parsedResponse.agencies.sort((a: Agency, b: Agency) => (a.priority || 3) - (b.priority || 3))
      }
      
      return NextResponse.json(parsedResponse)
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      return NextResponse.json(
        { message: 'Failed to parse agency recommendations' },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('Error in recommend-agencies:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { message: `Failed to generate agency recommendations: ${errorMessage}` },
      { status: 500 }
    )
  }
} 