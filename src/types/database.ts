export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ContentStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived'
export type ContentType = 'article' | 'recipe' | 'pdp' | 'collection' | 'category'

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          email: string
          role_id: string
          brand_ids: string[]
          invited_by: string
          status: Database['public']['Enums']['invitation_status']
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          email: string
          role_id: string
          brand_ids: string[]
          invited_by: string
          status?: Database['public']['Enums']['invitation_status']
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          role_id?: string
          brand_ids?: string[]
          invited_by?: string
          status?: Database['public']['Enums']['invitation_status']
          created_at?: string
          accepted_at?: string | null
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_brand_access: {
        Row: {
          id: string
          user_id: string
          brand_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brand_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brand_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      invitation_details: {
        Row: {
          id: string
          email: string
          status: Database['public']['Enums']['invitation_status']
          created_at: string
          accepted_at: string | null
          role_name: string
          brand_names: string[]
          invited_by_email: string
        }
      }
    }
    Functions: {
      accept_invitation: {
        Args: {
          p_user_id: string
          p_invitation_id: string
          p_role_id: string
          p_brand_ids: string[]
        }
        Returns: void
      }
      has_brand_access: {
        Args: {
          user_id: string
          target_brand_id: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: {
          user_id: string
          required_permission: string
        }
        Returns: boolean
      }
    }
    Enums: {
      invitation_status: 'pending' | 'accepted' | 'revoked'
    }
  }
} 