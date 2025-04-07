# MixerAI - Content Management and Brand Collaboration Platform

MixerAI is a sophisticated content management and brand collaboration platform built with Next.js 14, Supabase, and TypeScript. It enables brands to manage their content creation workflow, team collaboration, and maintain brand consistency across all content.

## Features

### Brand Management
- Create and manage multiple brands
- Configure brand identity and tone of voice
- AI-powered brand identity generation from reference content
- Custom role management and workflow configuration
- Regulatory compliance settings

### Content Creation
- Multiple content types support (Articles, Products, Recipes, Emails, Social Posts)
- AI-assisted content generation
- SEO optimization tools
- Content approval workflows
- Reference content analysis

### Team Collaboration
- Role-based access control
- Custom approval workflows
- Team member invitations
- Brand-specific role assignments

### Technical Features
- Next.js 14 App Router
- Supabase Authentication and Database
- TypeScript for type safety
- Responsive UI with Tailwind CSS
- Edge Functions for serverless operations
- Real-time collaboration features

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- OpenAI API key (for AI features)

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mixer-ai.git
cd mixer-ai
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Push the database schema:
```bash
supabase db push
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
mixer-ai/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable React components
│   ├── lib/                 # Utility functions and shared logic
│   └── styles/             # Global styles and Tailwind config
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── types/                  # TypeScript type definitions
```

## Key Components

### Brand Management
- `BrandWizard`: Guides users through brand creation
- `BrandEditPage`: Manages brand settings and configuration
- `RoleManagement`: Handles team roles and permissions

### Content Creation
- `CreateContentPage`: Main content creation interface
- `ContentEditor`: Rich text editor with AI assistance
- `SEOOptimizer`: Content optimization tools

### Team Collaboration
- `InvitationForm`: Manages team member invitations
- `WorkflowConfig`: Configures content approval workflows
- `NotificationSystem`: Real-time updates and notifications

## Database Schema

The application uses Supabase with the following main tables:
- `brands`: Brand information and settings
- `roles`: System-wide role definitions
- `brand_roles`: Brand-specific role assignments
- `content`: Content items (articles, products, etc.)
- `invitations`: Team member invitations
- `profiles`: User profiles and preferences

## Edge Functions

Located in `supabase/functions/`:
- `accept-invitation`: Handles invitation acceptance
- `create-invitation`: Manages invitation creation
- Other utility functions for content operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
