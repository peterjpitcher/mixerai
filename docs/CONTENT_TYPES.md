# Content Types Documentation

## Article Content Type

### Overview
Articles are long-form editorial content pieces that require careful SEO optimization and structured content generation. The process involves several key stages: content planning, SEO optimization, content generation, and approval workflow.

### Key Features

1. **Content Planning**
   - Two paths for article creation:
     - Direct title input (when user knows what to write)
     - Guided idea generation (when user needs suggestions)
   - Article type categorization:
     - Recipe Guide
     - Cooking Tips
     - Meal Planning
     - Ingredient Spotlight
     - Seasonal Content
     - Food & Lifestyle
     - Health & Nutrition
     - Custom Ideas

2. **SEO Optimization**
   - Primary keyword handling
   - Secondary keywords management
   - Keyword generation assistance
   - SEO recommendations with selectable implementation
   - Current vs. suggested keywords comparison
   - Optimization for existing content

3. **Content Generation**
   - AI-assisted content creation
   - Markdown support for rich formatting
   - Live preview of formatted content
   - Content regeneration with feedback
   - Content editing capabilities

4. **Metadata Management**
   - Title
   - Description (with AI generation support)
   - Brand association
   - Content type tracking
   - Optimization metadata (URL, feedback)
   - Cycle tracking (new vs. optimization)

### Database Schema
```sql
content {
  id: uuid (primary key)
  title: string
  description: string
  brand_id: string (foreign key)
  content_type: string
  primary_keyword: string
  secondary_keywords: string[]
  content: string
  status: string
  created_at: timestamp
  updated_at: timestamp
}
```

Note: The schema has been simplified to include only the essential fields needed for content management. Additional fields like optimization metadata can be added through schema migrations if needed in the future.

### Workflow States
1. **Draft Creation**
   - Initial content generation
   - SEO optimization
   - Content editing

2. **Approval Process**
   - Content saved as draft
   - Approval workflow initiated
   - Status tracking

### SEO Analysis Features
1. **Recommendations**
   - Top 10 actionable recommendations
   - Selectable implementation options
   - No categorization for cleaner UI
   - Focus on specific, implementable improvements

2. **Keyword Management**
   - Current keywords tracking
   - Suggested keywords with selection
   - Visual indication of currently used keywords
   - Primary/secondary keyword distinction

### Optimization Workflow
1. **Existing Content Analysis**
   - URL input
   - Improvement feedback
   - Content extraction
   - SEO analysis

2. **Optimization Process**
   - Keyword analysis
   - Content structure review
   - Improvement suggestions
   - Content regeneration

### Learnings & Best Practices

1. **User Interface**
   - Step-by-step workflow reduces complexity
   - Clear separation of planning and creation phases
   - Visual feedback for selected options
   - Preview capabilities for generated content

2. **SEO Integration**
   - Keyword generation should be contextual
   - Balance between suggested and user-defined keywords
   - Clear distinction between primary and secondary keywords
   - Actionable SEO recommendations

3. **Content Generation**
   - Allow for content regeneration with feedback
   - Maintain editing capabilities
   - Support rich text formatting
   - Preview formatted content

4. **Error Handling**
   - Validate inputs before API calls
   - Clear error messages
   - Fallback options for failed operations
   - State management for loading operations

### Implementation for Other Content Types

When implementing other content types (social, email, product), consider:

1. **Adapt the Workflow**
   - Modify steps based on content type needs
   - Adjust SEO requirements accordingly
   - Consider length and format differences

2. **Customize Metadata**
   - Add type-specific fields
   - Modify validation rules
   - Adjust character limits

3. **Modify Generation Process**
   - Adapt AI prompts for content type
   - Adjust formatting options
   - Consider platform-specific requirements

4. **Adjust UI/UX**
   - Modify preview functionality
   - Adapt input fields
   - Consider platform-specific previews

### Future Improvements
1. Add character count for social media content
2. Platform-specific preview modes
3. Template support for recurring content
4. Enhanced metadata for specific content types
5. Integration with publishing platforms

## Product Content Type

### Overview
Product content is generated in two distinct formats: website product listings and retailer-specific product content. The workflow is optimized for Consumer Packaged Goods (CPG) products, ensuring all necessary product information, compliance requirements, and marketing details are captured accurately.

### Key Features

1. **Product Types**
   - Website Product Content
     - Optimized for direct-to-consumer presentation
     - Brand-focused messaging
     - SEO-optimized product descriptions
   - Retailer Product Content
     - Retailer-specific formatting
     - Marketplace compliance
     - Channel-appropriate content

2. **Product Categories**
   - Food & Beverage
   - Snacks & Confectionery
   - Condiments & Sauces
   - Baking & Cooking
   - Breakfast & Cereal
   - Pantry Staples
   - Beverages
   - Specialty & Diet

3. **Required Information**
   - Basic Details
     - Product name
     - Category
     - Size/Format
     - Key features
   - Compliance Information
     - Ingredients list
     - Nutritional information
     - Allergen statements
     - Storage requirements
   - Additional Details
     - Usage instructions
     - Shelf life
     - Packaging information
     - Country of origin
     - Certifications
     - Sustainability information

4. **Content Generation**
   - SEO-optimized titles
   - Structured product descriptions
   - Feature highlighting
   - Compliance-focused content
   - Channel-specific formatting

### Database Schema Updates
```sql
ALTER TABLE content ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS product_category text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS product_size text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS product_format text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS ingredients text[];
ALTER TABLE content ADD COLUMN IF NOT EXISTS nutritional_info text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS allergen_info text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS storage_instructions text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS shelf_life text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS packaging text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS country_of_origin text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS certifications text[];
ALTER TABLE content ADD COLUMN IF NOT EXISTS usage_instructions text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS key_features text[];
ALTER TABLE content ADD COLUMN IF NOT EXISTS sustainability_info text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS retailer_name text;
ALTER TABLE content ADD COLUMN IF NOT EXISTS product_type text;
```

### Workflow States
1. **Product Information Entry**
   - Basic product details
   - Required compliance information
   - Additional product attributes
   - Retailer-specific details (if applicable)

2. **Content Generation**
   - SEO optimization
   - Description generation
   - Feature highlighting
   - Compliance verification

3. **Preview & Publish**
   - Content review
   - Compliance check
   - Format verification
   - Publishing workflow

### Best Practices

1. **Product Information**
   - Complete all required fields
   - Accurate ingredient lists
   - Clear allergen statements
   - Consistent formatting
   - Compliance verification

2. **Content Structure**
   - Clear feature hierarchy
   - Compliance-first approach
   - Benefit-focused descriptions
   - Channel-appropriate tone
   - SEO optimization

3. **Quality Control**
   - Regulatory compliance
   - Accuracy verification
   - Consistency check
   - Format validation
   - Channel requirements

### Implementation Notes

1. **Field Validation**
   - Required field enforcement
   - Format verification
   - Character limit checks
   - Compliance validation
   - Cross-field validation

2. **Content Generation**
   - Compliance-aware templates
   - Channel-specific formatting
   - SEO optimization
   - Benefit extraction
   - Feature highlighting

3. **Output Management**
   - Channel-specific exports
   - Compliance documentation
   - Version control
   - Change tracking
   - Approval workflow

### Future Improvements
1. Add regulatory compliance checking
2. Implement nutritional calculator
3. Add ingredient database integration
4. Include allergen cross-reference
5. Add packaging specification tools
6. Implement multi-language support
7. Add competitor analysis tools
8. Include market trend integration 