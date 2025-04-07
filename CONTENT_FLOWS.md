# Content Creation Flows

This document outlines all content creation flows and their implementation status.

## Article Content Flow ✅
- **Status**: Implemented
- **Location**: `/content/create/article/page.tsx`
- **Features**:
  - Article type selection with descriptions and examples
  - Title input with AI assistance
  - SEO metadata generation (title, description, slug)
  - Content optimization support
  - Version control integration

## Recipe Content Flow ✅
- **Status**: Implemented
- **Location**: `/content/create/recipe/page.tsx`
- **Features**:
  - Recipe type selection
  - Basic information (title, description)
  - Recipe details (servings, prep time, cook time, difficulty)
  - Ingredients list management
  - Step-by-step instructions
  - Tips and variations
  - SEO metadata
  - Content optimization support

## Email Content Flow ✅
- **Status**: Implemented
- **Location**: `/content/create/email/page.tsx`
- **Features**:
  - Email type selection
  - Subject line and preview text
  - Dual content source support (URL or freeform text)
  - A/B testing variations
  - SEO metadata
  - Content optimization support

## Social Post Content Flow 🚧
- **Status**: In Progress
- **Location**: `/content/create/social/page.tsx`
- **Features**:
  - Platform selection (Twitter, LinkedIn, Facebook, Instagram)
  - Post type selection
  - Character count validation
  - Media attachment support
  - Hashtag suggestions
  - Platform-specific preview
  - Content optimization support
  - SEO metadata

## Product Content Flow ⏳
- **Status**: Planned
- **Location**: `/content/create/product/page.tsx`
- **Features**:
  - Product type selection
  - CPG-specific fields
  - USPs and features
  - Ingredients and nutritional info
  - SEO metadata
  - Content optimization support

## Technical Considerations
1. Version Control ✅
   - Implemented in article flow
   - To be extended to other content types

2. SEO Optimization ✅
   - Implemented across all content types
   - Includes title, description, and slug generation

3. Content Optimization ✅
   - URL-based optimization support
   - Feedback incorporation
   - AI-powered suggestions

4. A/B Testing ✅
   - Implemented in email flow
   - To be considered for other content types

## Next Steps
1. Complete social post flow implementation
2. Implement product content flow
3. Add media handling capabilities
4. Enhance AI content generation
5. Add analytics integration
6. Implement content scheduling

## Questions for Review
1. Should we extend A/B testing to other content types?
2. Do we need additional CPG-specific fields?
3. Should we add support for more social media platforms?
4. Do we need more granular version control?

## Implementation Notes
- Using Next.js 14 with App Router
- Supabase for database and authentication
- AI integration for content generation
- Responsive UI with shadcn/ui components
- TypeScript for type safety
- Error handling and validation
- Loading states and optimistic updates

## Article Creation Flow

### Overview
The article creation process supports two primary paths:
1. Creating new articles from scratch with AI assistance
2. Optimizing existing articles by providing a URL

### Database Schema
Articles are stored in the `content` table with the following fields:
```sql
content
├── title                   # Article title
├── description             # Article description
├── brand_id               # Associated brand
├── content_type           # Type (article, product, etc.)
├── primary_keyword        # Main SEO keyword
├── secondary_keywords     # Array of additional keywords
├── content               # Main article content
├── content_format        # Format (markdown, html)
├── status                # Content state (draft, pending_approval, etc.)
├── seo_title             # SEO-optimized title
├── seo_description       # SEO meta description
├── seo_slug              # URL slug
├── article_type          # Specific type of article
├── optimization_url      # Original URL for optimized content
├── optimization_feedback # User feedback for optimization
├── cycle_type           # Content cycle (new, optimization)
├── cycle_id             # Unique cycle identifier
├── target_audience      # Intended audience
├── word_count           # Target word count
├── tone                 # Content tone
└── format              # Content format
```

### 1. New Article Creation

#### Step 1: Initial Setup
1. User selects their brand
   - Auto-selected if user has only one brand
   - Required for brand-specific content generation

2. User chooses "Article" content type
   - Presented with option to create new or optimize existing

3. User selects article type
   - Options include: how-to, lifestyle, guide, etc.
   - Influences AI's content generation approach

#### Step 2: Title Generation
1. User can:
   - Enter custom title directly
   - Request AI-generated titles
   
2. If requesting AI help:
   - System generates multiple title options
   - Based on brand voice and article type
   - User can select suggestion or enter custom

#### Step 3: SEO & Metadata
1. Primary Keyword
   - Manual input or AI-generated
   - Core focus for SEO optimization

2. Secondary Keywords
   - Manual input or AI-generated
   - Supporting keywords for content

3. Description
   - Manual input or AI-generated
   - Used for meta description and content brief

4. Additional Settings
   - Target Audience (optional)
   - Word Count (default: 1000)
   - Tone (default: professional)
   - Format (default: article)

#### Step 4: Content Generation
1. AI generates article using:
   - Title
   - Keywords
   - Description
   - Article type
   - Target audience
   - Tone preferences
   - Format requirements

2. Content Structure:
   - Proper markdown formatting
   - H2 for main sections
   - H3 for subsections
   - H4 for minor sections
   - Lists and emphasis as needed

#### Step 5: Review & Edit
1. Content loads in TipTap editor
2. Available actions:
   - Direct content editing
   - Save as draft
   - Regenerate with feedback
   - Submit for approval

### 2. Article Optimization

#### Step 1: URL Input
1. User provides:
   - URL of existing content
   - Optional improvement feedback
   - Specific optimization goals

#### Step 2: Content Analysis
1. System analyzes existing content
2. Generates optimization suggestions:
   - Optimized title
   - Meta description
   - Primary keyword
   - Secondary keywords
   - SEO recommendations
   - URL slug suggestions

#### Step 3: Enhancement
1. AI enhances content while maintaining:
   - Original structure
   - Core message
   - Brand voice
2. Improvements focus on:
   - SEO optimization
   - Readability
   - Keyword usage
   - Content structure

#### Step 4: Review & Edit
1. Enhanced content in TipTap editor
2. Available actions:
   - Edit optimized content
   - Save as draft
   - Request further optimization
   - Submit for approval

### Content States
- **Draft**: Initial saved state
- **Pending Approval**: Submitted for review
- **Approved**: Ready for publication
- **Published**: Live content
- **Rejected**: Needs revision

### Technical Notes
1. Content Format
   - Stored as markdown in database
   - Rendered in TipTap editor
   - Supports rich text formatting

2. Error Handling
   - Autosave for draft content
   - Validation for required fields
   - Clear error messaging
   - Retry for failed API calls

3. Performance
   - Indexed fields:
     - article_type
     - content_format
     - cycle_type
   - Efficient content storage
   - Optimized API calls 