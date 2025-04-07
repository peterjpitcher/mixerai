import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractContentFromUrl } from '@/lib/scraper'
import { NodeHtmlMarkdown } from 'node-html-markdown'

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'generateArticleContent': {
        const { metadata } = body
        const {
          title,
          description,
          primaryKeyword,
          secondaryKeywords,
          targetAudience,
          wordCount,
          tone,
          format,
          articleType
        } = metadata

        const prompt = `Write a ${wordCount} word ${articleType} article titled "${title}".
        
Description: ${description}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords.join(', ')}
Target Audience: ${targetAudience}
Tone: ${tone}
Format: ${format}

Please write a well-structured, engaging article using the following formatting:

1. Use "## " for main section headings (H2)
2. Use "### " for subsection headings (H3)
3. Use "#### " for minor headings (H4)
4. Use regular text for paragraphs
5. Use "- " for bullet points
6. Use "1. " for numbered lists
7. Use **text** for bold emphasis
8. Use *text* for italic emphasis

Content Requirements:
1. Start with a compelling introduction paragraph
2. Include at least 3 main sections with H2 headings
3. Use H3 and H4 subheadings to break down complex sections
4. Naturally incorporate keywords throughout the content
5. Maintain consistent formatting throughout
6. End with a clear conclusion
7. Ensure proper spacing between sections
8. Keep paragraphs concise and readable

Example Structure:
## Main Section
Introduction paragraph...

### Subsection
Content with **bold** and *italic* text...

#### Minor Heading
Detailed information...

Please write the article following this structure and formatting while:
1. Following SEO best practices
2. Naturally incorporating the keywords
3. Maintaining the specified tone
4. Addressing the target audience effectively
5. Following the requested format
6. Providing valuable and accurate information`

        const completion = await openai.chat.completions.create({
              model: "gpt-4-turbo-preview",
              messages: [
                {
                  role: "system",
              content: "You are an expert content writer specialising in creating high-quality, engaging articles with proper rich text formatting and structure."
                },
                {
                  role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })

        const content = completion.choices[0].message.content

        if (!content) {
          throw new Error('No content generated')
        }

        return NextResponse.json({ content })
      }

      case 'generateKeywords': {
        const { title, articleType } = body
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are an SEO expert who helps generate relevant keywords for content."
            },
            {
              role: "user",
              content: `Generate a primary keyword and up to 5 secondary keywords for the following ${articleType} article:

Title: ${title}

The primary keyword should be the main focus of the content and highly relevant for SEO.
The secondary keywords should support the primary keyword and help with content optimization.

Format your response as JSON:
{
  "primary": "main keyword",
  "secondary": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`
            }
          ],
          response_format: { type: "json_object" }
        })

        const result = JSON.parse(completion.choices[0].message.content || '{}')
        return NextResponse.json(result)
      }

      case 'generateDescription': {
        const { title, primaryKeyword } = body
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are an SEO expert who writes compelling content descriptions."
            },
            {
              role: "user",
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

        const description = completion.choices[0].message.content?.trim()
        return NextResponse.json({ description })
      }

      case 'analyzeArticle': {
        const { url, feedback, brandIdentity } = body
        
        // Extract content from URL
        const htmlContent = await extractContentFromUrl(url)
        if (!htmlContent) {
          throw new Error('Failed to extract content from URL')
        }

        // Convert HTML to Markdown
        const nhm = new NodeHtmlMarkdown()
        const markdownContent = nhm.translate(htmlContent)

        // Analyze the content with AI
        const analysis = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert SEO analyst and content optimizer who understands the importance of maintaining brand voice and identity. 
              
              Brand Guidelines:
              ${brandIdentity?.tone ? `Tone of Voice: ${brandIdentity.tone}` : ''}
              ${brandIdentity?.style ? `Writing Style: ${brandIdentity.style}` : ''}
              ${brandIdentity?.audience ? `Target Audience: ${brandIdentity.audience}` : ''}
              ${brandIdentity?.keywords ? `Brand Keywords: ${brandIdentity.keywords.join(', ')}` : ''}
              ${brandIdentity?.guardrails ? `Content Guardrails: ${brandIdentity.guardrails}` : ''}
              
              Analyze the provided content and identify specific opportunities for improvement while maintaining brand consistency. Focus ONLY on:
              1. Content quality and readability
              2. Keyword usage and optimization
              3. Content structure and organization
              
              For each opportunity, provide:
              - A clear title
              - A detailed description of what to improve
              - The expected impact (high/medium/low)
              - The category (content/keywords/structure)
              
              Also extract/generate:
              - The current title
              - A meta description that matches brand tone
              - Primary keyword aligned with brand focus
              - Secondary keywords that support brand messaging
              - SEO-optimized title suggestions that maintain brand voice
              - Recommended URL slug
              
              Format your response as JSON with this exact structure:
              {
                "title": "current title",
                "metaDescription": "current or suggested meta description",
                "primaryKeyword": "main keyword",
                "secondaryKeywords": ["keyword1", "keyword2", "keyword3"],
                "seoTitle": "SEO-optimized title",
                "seoMetaDescription": "SEO-optimized meta description",
                "recommendedSlug": "recommended-url-slug",
                "opportunities": [
                  {
                    "id": "unique-id-1",
                    "title": "Clear opportunity title",
                    "description": "Detailed description of what to improve",
                    "impact": "high|medium|low",
                    "category": "content|keywords|structure"
                  }
                ]
              }`
            },
            {
              role: "user",
              content: `Analyze this content: ${markdownContent}
              ${feedback ? `Additional feedback to consider: ${feedback}` : ''}`
            }
          ],
          response_format: { type: "json_object" }
        })

        const result = JSON.parse(analysis.choices[0].message.content || '{}')
        
        // Ensure opportunities have IDs
        const opportunities = (result.opportunities || []).map((opp: any, index: number) => ({
          ...opp,
          id: opp.id || `opportunity-${index + 1}`
        }))

        return NextResponse.json({
          title: result.title || '',
          description: result.metaDescription || '',
          primaryKeyword: result.primaryKeyword || '',
          secondaryKeywords: result.secondaryKeywords || [],
          content: markdownContent,
          currentHtml: markdownContent,
          opportunities,
          seoAnalysis: {
            title: result.seoTitle || result.title || '',
            metaDescription: result.seoMetaDescription || result.metaDescription || '',
            recommendedSlug: result.recommendedSlug || ''
          }
        })
      }

      case 'implementSEOOpportunities': {
        const { 
          currentHtml, 
          opportunities, 
          title,
          description,
          primaryKeyword,
          secondaryKeywords,
          seoAnalysis 
        } = body

        // Implement the selected opportunities using AI
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert content optimizer. Your task is to improve the provided markdown content based on the selected optimization opportunities and metadata changes. 
              Maintain proper markdown formatting:
              1. Use "## " for main section headings (H2)
              2. Use "### " for subsection headings (H3)
              3. Use "#### " for minor headings (H4)
              4. Use regular text for paragraphs
              5. Use "- " for bullet points
              6. Use "1. " for numbered lists
              7. Use **text** for bold emphasis
              8. Use *text* for italic emphasis
              
              Return the optimized content in markdown format.`
            },
            {
              role: "user",
              content: `Original content: ${currentHtml}
              
              New metadata to incorporate:
              Title: ${title || seoAnalysis?.title}
              Description: ${description || seoAnalysis?.metaDescription}
              Primary Keyword: ${primaryKeyword}
              Secondary Keywords: ${JSON.stringify(secondaryKeywords)}
              
              Implement these improvements:
              ${JSON.stringify(opportunities, null, 2)}
              
              Please ensure:
              1. The content aligns with the new title and description
              2. Primary and secondary keywords are naturally incorporated
              3. The content maintains its readability and flow
              4. All selected optimization opportunities are implemented
              5. The markdown formatting is preserved`
            }
          ]
        })

        return NextResponse.json({
          optimizedContent: completion.choices[0].message.content,
          metadata: {
            title: title || seoAnalysis?.title,
            description: description || seoAnalysis?.metaDescription,
            primaryKeyword,
            secondaryKeywords
          }
        })
      }

      case 'generateArticleIdeas': {
        const { brand, topic, articleType, customSuggestion, brandIdentity } = body
        
        let promptInstructions = ''
        if (customSuggestion) {
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
            default:
              promptInstructions = 'Include a mix of recipe and cooking-related content.'
          }
        }

        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are a food content strategist who generates engaging recipe and cooking-related content ideas while strictly adhering to brand guidelines and tone of voice.
              
              Brand Guidelines:
              ${brandIdentity?.tone ? `Tone of Voice: ${brandIdentity.tone}` : ''}
              ${brandIdentity?.style ? `Writing Style: ${brandIdentity.style}` : ''}
              ${brandIdentity?.audience ? `Target Audience: ${brandIdentity.audience}` : ''}
              ${brandIdentity?.keywords ? `Brand Keywords: ${brandIdentity.keywords.join(', ')}` : ''}
              ${brandIdentity?.guardrails ? `Content Guardrails: ${brandIdentity.guardrails}` : ''}`
            },
            {
              role: "user",
              content: `Generate 10 creative and engaging food-related content ideas for ${brand || 'a food brand'}.

Requirements:
- Each idea should be a clear, compelling title that matches the brand's tone of voice
- Maintain consistency with brand guidelines and guardrails
- Focus on providing practical value to the target audience
- Consider seasonal ingredients and current food trends
- Incorporate brand keywords where relevant
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
          response_format: { type: "json_object" }
        })

        const result = JSON.parse(completion.choices[0].message.content || '{}')
        return NextResponse.json(result)
      }

      case 'regenerateArticleContent': {
        const { metadata, feedback } = body
        const {
          title,
          description,
          primaryKeyword,
          secondaryKeywords,
          targetAudience,
          wordCount,
          tone,
          format,
          articleType
        } = metadata

        const prompt = `Rewrite a ${wordCount} word ${articleType} article titled "${title}" based on the following feedback:

${feedback}

Description: ${description}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords.join(', ')}
Target Audience: ${targetAudience}
Tone: ${tone}
Format: ${format}

Please write a well-structured, engaging article using the following formatting:

1. Use "## " for main section headings (H2)
2. Use "### " for subsection headings (H3)
3. Use "#### " for minor headings (H4)
4. Use regular text for paragraphs
5. Use "- " for bullet points
6. Use "1. " for numbered lists
7. Use **text** for bold emphasis
8. Use *text* for italic emphasis

Content Requirements:
1. Address all feedback points provided above
2. Start with a compelling introduction paragraph
3. Include at least 3 main sections with H2 headings
4. Use H3 and H4 subheadings to break down complex sections
5. Naturally incorporate keywords throughout the content
6. Maintain consistent formatting throughout
7. End with a clear conclusion
8. Ensure proper spacing between sections
9. Keep paragraphs concise and readable

Please write the article following this structure and formatting while:
1. Following SEO best practices
2. Naturally incorporating the keywords
3. Maintaining the specified tone
4. Addressing the target audience effectively
5. Following the requested format
6. Providing valuable and accurate information
7. Specifically addressing the feedback provided`

        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are an expert content writer specialising in creating high-quality, engaging articles with proper rich text formatting and structure. Pay special attention to incorporating feedback and improvements in the regenerated content."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })

        const content = completion.choices[0].message.content

        if (!content) {
          throw new Error('No content generated')
        }

        return NextResponse.json({ content })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 