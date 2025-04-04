import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractContentFromUrl } from '@/lib/scraper'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing environment variable: OPENAI_API_KEY')
}

if (!process.env.OPENAI_BASE_URL) {
  throw new Error('Missing environment variable: OPENAI_BASE_URL')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': process.env.OPENAI_API_KEY },
})

// Add type guard and types
type ContentType = 'article' | 'social' | 'email' | 'product'

interface GenerateContentBody {
  action: string;
  title?: string;
  description?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  type?: string;
  previousFeedback?: string;
  url?: string;
  feedback?: string;
  includeSeoAnalysis?: boolean;
}

function isValidContentType(type: unknown): type is ContentType {
  return typeof type === 'string' && ['article', 'social', 'email', 'product'].includes(type.toLowerCase())
}

function isGenerateContentBody(body: any): body is GenerateContentBody {
  return typeof body === 'object' && 
         typeof body.action === 'string' &&
         (!body.title || typeof body.title === 'string') &&
         (!body.description || typeof body.description === 'string') &&
         (!body.primaryKeyword || typeof body.primaryKeyword === 'string') &&
         (!body.secondaryKeywords || Array.isArray(body.secondaryKeywords)) &&
         (!body.type || typeof body.type === 'string') &&
         (!body.previousFeedback || typeof body.previousFeedback === 'string') &&
         (!body.url || typeof body.url === 'string') &&
         (!body.feedback || typeof body.feedback === 'string') &&
         (!body.includeSeoAnalysis || typeof body.includeSeoAnalysis === 'boolean')
}

interface ArticleAnalysis {
  recommendations: string[];
  currentKeywords: {
    primary: string;
    secondary: string[];
  };
  title?: string;
  description?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action } = body

    // Validate content type if it's a content generation request
    if (action === 'generateContent') {
      const { type } = body
      if (!type || typeof type !== 'string') {
        return NextResponse.json({ error: 'Content type is required and must be a string' }, { status: 400 })
      }
    }

    console.log('Received request:', body)

    switch (action) {
      case 'analyzeArticle': {
        if (!isGenerateContentBody(body)) {
          return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
        }

        const { url, feedback, includeSeoAnalysis } = body
        
        console.log('Analyzing article:', { url, feedback, includeSeoAnalysis })
        
        if (!url) {
          return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        try {
          // Extract content from the URL
          const articleContent = await extractContentFromUrl(url)
          
          if (!articleContent) {
            throw new Error('Failed to extract content from URL')
          }

          // Use OpenAI to analyze the content
          const analysisResponse = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: `You are an expert SEO content analyst specializing in recipe and cooking content optimization.
Your task is to analyze the provided article and provide:
1. A comprehensive content-focused SEO analysis with actionable recommendations for improving the written content only
2. Extract the most relevant keywords from the existing content, categorizing them into primary and secondary keywords
Do not make recommendations about technical aspects, images, videos, schema, or any non-content elements.`
              },
              {
                role: "user",
                content: `Please analyze this article and provide:
1. Content-specific SEO recommendations focusing only on how to improve the written content
2. The current primary keyword (most prominent topic/keyword in the content)
3. Current secondary keywords (supporting keywords found in the content)

Format your response in JSON:
{
  "recommendations": [
    "Content Structure Recommendations...",
    "Keyword Usage Recommendations...",
    "Content Enhancement Recommendations..."
  ],
  "currentKeywords": {
    "primary": "main keyword found",
    "secondary": ["supporting keyword 1", "supporting keyword 2", ...]
  },
  "title": "extracted title",
  "description": "extracted description"
}

Article content:
${articleContent}`
              }
            ],
            response_format: { type: "json_object" }
          })

          if (!analysisResponse.choices[0].message.content) {
            throw new Error('No content in OpenAI response')
          }

          const analysis = JSON.parse(analysisResponse.choices[0].message.content) as ArticleAnalysis

          if (includeSeoAnalysis) {
            // Generate optimized keyword suggestions based on current content
            const keywordResponse = await openai.chat.completions.create({
              model: "gpt-4-turbo-preview",
              messages: [
                {
                  role: "system",
                  content: "You are an SEO keyword optimization expert. Analyze the current keywords and suggest optimized variations that would improve the content's search visibility while maintaining relevance to the topic."
                },
                {
                  role: "user",
                  content: `Based on these current keywords:
Primary: ${analysis.currentKeywords.primary}
Secondary: ${analysis.currentKeywords.secondary.join(', ')}

Suggest optimized keyword variations that would improve SEO while staying relevant to the topic.
Format as JSON:
{
  "primary": "optimized main keyword",
  "secondary": ["optimized keyword 1", "optimized keyword 2", ...]
}`
                }
              ],
              response_format: { type: "json_object" }
            })

            if (!keywordResponse.choices[0].message.content) {
              throw new Error('No content in OpenAI keyword response')
            }

            const keywordSuggestions = JSON.parse(keywordResponse.choices[0].message.content) as {
              primary: string;
              secondary: string[];
            }

            const seoAnalysis = {
              recommendations: [
                "1. Content Structure Improvements:",
                ...analysis.recommendations.filter((rec: string) => rec.startsWith('•')).map((rec: string) => rec.trim()),
                "",
                "2. Keyword Usage Optimization:",
                "• Incorporate the suggested primary keyword more prominently in the first paragraph",
                "• Use secondary keywords naturally throughout the content",
                "• Include keyword variations in subheadings",
                "• Ensure proper keyword density without overstuffing",
                "",
                "3. Content Enhancement Suggestions:",
                "• Expand sections that need more detail",
                "• Add clear transitions between topics",
                "• Include more specific examples",
                "• Improve content flow and readability"
              ],
              currentKeywords: analysis.currentKeywords,
              suggestedKeywords: keywordSuggestions
            }

            return NextResponse.json({
              title: analysis.title || 'Sample Title',
              description: analysis.description || 'Sample Description',
              primaryKeyword: keywordSuggestions.primary,
              secondaryKeywords: keywordSuggestions.secondary,
              content: articleContent,
              seoAnalysis
            })
          }

          return NextResponse.json({
            title: analysis.title || 'Sample Title',
            description: analysis.description || 'Sample Description',
            primaryKeyword: analysis.currentKeywords.primary,
            secondaryKeywords: analysis.currentKeywords.secondary,
            content: articleContent
          })
        } catch (error) {
          console.error('Error analyzing article:', error)
          return NextResponse.json({ error: 'Failed to analyze article' }, { status: 500 })
        }
      }

      case 'generateKeywords': {
        const { title, description } = body
        console.log('Generating keywords for:', { title, description })
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an SEO expert who helps generate relevant keywords for content.'
            },
            {
              role: 'user',
              content: `Generate a primary keyword and up to 5 secondary keywords for the following content:

Title: ${title}
Description: ${description}

The primary keyword should be the main focus of the content and highly relevant for SEO.
The secondary keywords should support the primary keyword and help with content optimization.

Format your response as JSON:
{
  "primary": "main keyword",
  "secondary": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`
            }
          ],
          response_format: { type: 'json_object' }
        })

        console.log('OpenAI response:', response)

        if (!response.choices[0].message.content) {
          throw new Error('No content in OpenAI response')
        }

        const result = JSON.parse(response.choices[0].message.content)
        return NextResponse.json(result)
      }

      case 'generateDescription': {
        const { title, primaryKeyword } = body
        console.log('Generating description for:', { title, primaryKeyword })
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an SEO expert who writes compelling content descriptions.'
            },
            {
              role: 'user',
              content: `Write a compelling SEO-optimized description for the following content:

Title: ${title}
Primary Keyword: ${primaryKeyword}

The description should:
- Be 2-3 sentences long
- Naturally incorporate the primary keyword
- Be engaging and clear
- Maintain a professional tone
- Focus on value proposition`
            }
          ]
        })

        console.log('OpenAI response:', response)

        if (!response.choices[0].message.content) {
          throw new Error('No content in OpenAI response')
        }

        return NextResponse.json({ description: response.choices[0].message.content.trim() })
      }

      case 'generateArticleIdeas': {
        const { brand, topic, articleType, customSuggestion } = body
        console.log('Generating article ideas for:', { brand, topic, articleType, customSuggestion })
        
        let promptInstructions = ''
        if (customSuggestion) {
          // If we have a custom suggestion with topic and audience, use that
          promptInstructions = `Focus on the following requirements: ${customSuggestion}`
        } else {
          switch (articleType) {
            case 'recipe':
              promptInstructions = 'Focus on recipe ideas, cooking instructions, and meal suggestions.'
              break
            case 'cooking-tips':
              promptInstructions = 'Focus on cooking techniques, kitchen hacks, and culinary advice.'
              break
            case 'meal-planning':
              promptInstructions = 'Focus on meal prep guides, weekly menu plans, and batch cooking ideas.'
              break
            case 'ingredient-spotlight':
              promptInstructions = 'Focus on ingredient features, usage tips, and recipe variations.'
              break
            case 'seasonal':
              promptInstructions = 'Focus on seasonal recipes, holiday menus, and special occasions.'
              break
            case 'lifestyle':
              promptInstructions = 'Focus on food culture, entertaining tips, and dining trends.'
              break
            case 'health':
              promptInstructions = 'Focus on nutritional content, healthy cooking tips, and dietary information.'
              break
            case 'custom':
              promptInstructions = `Focus on the following user request: ${customSuggestion}`
              break
            default:
              promptInstructions = 'Include a mix of recipe and cooking-related content.'
          }
        }

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a food content strategist who generates engaging recipe and cooking-related content ideas.'
            },
            {
              role: 'user',
              content: `Generate 10 creative and engaging food-related content ideas for ${brand}.

Requirements:
- Each idea should be a clear, compelling title
- Maintain the brand's professional tone
- Focus on providing practical value to home cooks
- Consider seasonal ingredients and current food trends
${promptInstructions}

Format your response as JSON:
{
  "ideas": [
    "Title 1",
    "Title 2",
    "Title 3",
    // etc...
  ]
}`
            }
          ],
          response_format: { type: 'json_object' }
        })

        console.log('OpenAI response:', response)

        if (!response.choices[0].message.content) {
          throw new Error('No content in OpenAI response')
        }

        const result = JSON.parse(response.choices[0].message.content)
        return NextResponse.json({ ideas: result.ideas })
      }

      case 'generateContent': {
        if (!isGenerateContentBody(body)) {
          return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
        }

        const { title, description, primaryKeyword, secondaryKeywords = [], type, previousFeedback } = body
        
        console.log('Generating content for:', { title, description, primaryKeyword, secondaryKeywords, type, previousFeedback })
        
        if (!isValidContentType(type)) {
          return NextResponse.json({ error: 'Invalid or missing content type' }, { status: 400 })
        }

        let systemPrompt = `You are an expert food content writer who specializes in creating engaging, practical content for home cooks.
Your task is to generate content that is both informative and engaging, while naturally incorporating SEO keywords.
${previousFeedback ? 'You must address the previous feedback and improve the content accordingly.' : ''}`.trim()

        let contentFormat = ''
        let feedbackContext = previousFeedback ? `
Previous feedback to address:
${previousFeedback}

Instructions for improvement:
- Carefully consider the feedback above
- Ensure the new content directly addresses these points
- Maintain the same topic and keywords while improving the content
- Keep the tone friendly and approachable for home cooks` : ''
        
        const contentType = type.toLowerCase() as ContentType

        switch (contentType) {
          case 'article':
            systemPrompt += ' Write a comprehensive, engaging article that follows SEO best practices and provides value to home cooks.'
            contentFormat = 'Write a well-structured article with appropriate headings (using markdown ## for h2 and ### for h3).'
            break
          case 'social':
            systemPrompt += ' Write engaging social media content that drives engagement and inspires cooking.'
            contentFormat = 'Write a social media post with appropriate hashtags and call-to-action.'
            break
          case 'email':
            systemPrompt += ' Write compelling email marketing content that drives conversions and shares cooking inspiration.'
            contentFormat = 'Write an email with a subject line, body content, and clear call-to-action.'
            break
          case 'product':
            systemPrompt += ' Write persuasive product descriptions that highlight culinary benefits and features.'
            contentFormat = 'Write a product description that highlights key features, benefits, and includes a compelling call-to-action.'
            break
          default:
            return NextResponse.json({ error: `Invalid content type: ${contentType}` }, { status: 400 })
        }

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `${systemPrompt} ${contentFormat}`
            },
            {
              role: 'user',
              content: `Title: ${title}
Description: ${description}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords.join(', ')}
Content Type: ${type}${feedbackContext}

Writing Guidelines:
1. Focus on providing practical, valuable information for home cooks
2. Use clear, engaging language that inspires cooking confidence
3. Naturally incorporate the keywords while maintaining readability
4. Include specific, actionable tips and techniques
5. Consider seasonal relevance and ingredient availability
6. Make the content approachable for all skill levels

Please write the content following these guidelines and addressing any previous feedback.`
            }
          ]
        })

        console.log('OpenAI response:', response)

        if (!response.choices[0]?.message?.content) {
          throw new Error('No content in OpenAI response')
        }

        return NextResponse.json({ content: response.choices[0].message.content.trim() })
      }

      default:
        console.error('Invalid action:', action)
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 