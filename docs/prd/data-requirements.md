# Data Requirements

## 5.1 Core Data Types

### Content Data
- Content ID
- Content Name
- Content Type (e.g., article, recipe, PDP)
- Draft and final versions
- Metadata:
  - Title
  - Description
  - Keywords
  - Alt Text
- AI generation parameters
- Language and localisation metadata
- Target Start and Publish Dates
- AMSV Value
- Status (cycle stage)
- Live URL (if published)
- Screenshot links (mobile and desktop)
- Change Log (timestamped actions with user IDs)

### Brand Data
- Brand Name
- Logo and visual assets
- Tone of Voice
- Guardrails (e.g. do-not-say list)
- Category mapping (content categories per brand)
- Website URL
- GSC Entity

### User Data
- User ID and name
- Email and login details (via Supabase)
- Assigned brands
- Role (editor, approver, admin, etc.)
- Activity log

### Feedback Data
- Linked Content ID and Version
- Comment body
- Author and timestamp
- Threaded responses
- Status (resolved, open, escalated)

## 5.2 External Integrations
- Publishing Document Link (e.g. Google Docs)
- Monday.com ID (external tracking ID)
- Airtable sync (optional future phase)
- GSC Submission Status

## 5.3 Storage & Access

### Database Structure
- Supabase for structured database storage
- Relational models for:
  - Users ↔ Brands ↔ Content ↔ Feedback
- Cascading deletes: e.g., removing a user also deletes orphaned feedback
- Versioned content records with rollback capability
- Read-only history logs for audit and compliance

### Data Security
- Encrypted storage for sensitive data
- Role-based access control
- Audit logging for all data modifications
- Regular backup procedures

## 5.4 Future Enhancements
- GA4 performance metric ingestion per content ID
- AI detection scores (GPTZero, plagiarism checkers)
- Content originality and tone-matching scoring
- Multilingual metadata tagging
- Advanced analytics and reporting capabilities 