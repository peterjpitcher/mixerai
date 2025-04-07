import { NextResponse } from 'next/server'
import OpenAI from 'openai'

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
  defaultHeaders: { 'api-key': process.env.OPENAI_API_KEY }
})

export async function POST(req: Request) {
  try {
    const { brandName, brandIdentity, toneOfVoice, language, country } = await req.json()

    if (!brandIdentity || !toneOfVoice) {
      return NextResponse.json(
        { error: 'Brand identity and tone of voice are required' },
        { status: 400 }
      )
    }

    // Generate agency recommendations
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert in regulatory compliance who helps companies identify relevant regulatory bodies and agencies based on their brand identity and industry. You analyze a brand's identity and tone of voice to recommend appropriate regulatory bodies.

Your recommendations should be comprehensive and include:
1. Food safety and quality regulators (e.g. FDA, AAFCO for pet food)
2. Advertising and marketing regulators (e.g. FTC, ASA)
3. Consumer protection agencies
4. Industry-specific bodies (e.g. Pet Food Institute)
5. Data protection and privacy regulators
6. Environmental and sustainability bodies
7. Trade and commerce regulators
8. Quality assurance organizations
9. Health and safety regulators
10. Professional standards bodies

For each category that applies to the brand, provide at least one relevant agency. Consider:
- The brand's specific industry and products
- Their target market and geographical presence
- Marketing and advertising practices
- Digital presence and data handling
- Supply chain and manufacturing
- Quality and safety standards
- Environmental impact
- Consumer protection requirements

Format your response as a JSON array of objects with 'id' and 'name' properties. The id should be a kebab-case version of the name.`
        },
        {
          role: 'user',
          content: `Please recommend relevant regulatory bodies and agencies for this brand:

Brand Name: ${brandName || 'Unknown'}
Country: ${country || 'Unknown'}
Language: ${language || 'Unknown'}

Brand Identity:
${brandIdentity}

Tone of Voice:
${toneOfVoice}

Example response format:
{
  "agencies": [
    {
      "id": "fda-cvm",
      "name": "FDA Center for Veterinary Medicine"
    },
    {
      "id": "aafco",
      "name": "Association of American Feed Control Officials"
    }
  ]
}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    return NextResponse.json({
      agencies: result.agencies || []
    })

  } catch (error) {
    console.error('Error recommending agencies:', error)

    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Authentication error. Please check your OpenAI API key.' },
          { status: 401 }
        )
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to recommend agencies' },
      { status: 500 }
    )
  }
} 