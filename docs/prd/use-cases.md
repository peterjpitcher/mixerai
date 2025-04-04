# Use Cases

## 1. Content Creation & Initial Setup

### UC1: Create New Content Brief
**Primary Actor:** Content Creator
**Flow:**
1. User selects "Create New Content"
2. User selects content type (Article/Recipe/PDP)
3. User fills in brief requirements:
   - Content title
   - Target brand/country
   - Content type specific fields
4. System generates initial content draft
5. User reviews and adjusts brief if needed
6. User submits to Initial Review stage

### UC2: Brand Setup
**Primary Actor:** Admin
**Flow:**
1. Admin selects "Add New Brand"
2. Enters brand details:
   - Brand name
   - Country
   - Logo upload
3. Configures brand settings:
   - "Do Not Say" list
   - Required workflow stages
4. Assigns users to brand roles
5. Activates brand in system

## 2. Content Review & Progression

### UC3: Content Review
**Primary Actor:** Any Review Role (Human Reviewer/Editor/SEO/Kitchen/Brand Team)
**Flow:**
1. User views assigned content in their queue
2. Opens content for review
3. Reviews against role-specific criteria
4. Can:
   - Approve and progress to next stage
   - Reject to any previous stage
   - Add comments/feedback
   - Make direct edits (if applicable)
5. System notifies relevant users of decision

### UC4: Content Rejection
**Primary Actor:** Any Review Role
**Flow:**
1. User decides to reject content
2. Selects target stage for rejection
3. Provides mandatory rejection reason
4. Optionally:
   - Tags specific users
   - Adds detailed feedback
   - Highlights specific sections
5. System returns content to selected stage
6. Notifies relevant users

## 3. User Management

### UC5: Multi-Brand User Assignment
**Primary Actor:** Admin
**Flow:**
1. Admin selects user to manage
2. Views current brand/role assignments
3. Can:
   - Add user to additional brands
   - Assign roles per brand
   - Remove brand access
   - Update permissions
4. System updates user access immediately

### UC6: Content Assignment
**Primary Actor:** Any Role
**Flow:**
1. User views content in their stage
2. Can assign/reassign content to team members
3. System notifies assigned user
4. Updates assignment history

## 4. Content Publishing

### UC7: Final Content Approval
**Primary Actor:** Brand Team
**Flow:**
1. Reviews final content version
2. Verifies all required stages completed
3. Can:
   - Approve for publishing
   - Reject for revisions
4. On approval, content moves to Published stage

### UC8: Content Status Monitoring
**Primary Actor:** Any Role
**Flow:**
1. User views content dashboard
2. Can filter by:
   - Brand
   - Stage
   - Status
   - Assignee
3. Views progress and blockers
4. Accesses full content history

## 5. System Administration

### UC9: Workflow Configuration
**Primary Actor:** Admin
**Flow:**
1. Selects brand to configure
2. Enables/disables optional stages
3. Reviews stage progression rules
4. Updates user assignments
5. System applies changes to new content

### UC10: Content Audit
**Primary Actor:** Admin/Brand Team
**Flow:**
1. Views content audit trail
2. Accesses:
   - Change history
   - User actions
   - Stage transitions
   - Rejection reasons
3. Exports audit data if needed 