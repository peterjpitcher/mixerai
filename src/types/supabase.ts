export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'manager' | 'user'

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          name: UserRole
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: UserRole
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: UserRole
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      role_permissions: {
        Row: {
          role_id: string
          permission_id: string
          created_at: string
        }
        Insert: {
          role_id: string
          permission_id: string
          created_at?: string
        }
        Update: {
          role_id?: string
          permission_id?: string
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          role_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          role_id?: string
          created_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          logo_url?: string | null
          website_url?: string | null
          language?: string | null
          country?: string | null
          settings: {
            brandIdentity: string
            toneOfVoice: string
            guardrails: string[]
            keywords: string[]
            styleGuide: {
              communicationStyle: string
              languagePreferences: string
              formalityLevel: string
              writingStyle: string
            }
            roles: string[]
            allowedContentTypes: string[]
            workflowStages: string[]
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          website_url?: string | null
          language?: string | null
          country?: string | null
          settings?: {
            brandIdentity?: string
            toneOfVoice?: string
            guardrails?: string[]
            keywords?: string[]
            styleGuide?: {
              communicationStyle?: string
              languagePreferences?: string
              formalityLevel?: string
              writingStyle?: string
            }
            roles?: string[]
            allowedContentTypes?: string[]
            workflowStages?: string[]
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          website_url?: string | null
          language?: string | null
          country?: string | null
          settings?: {
            brandIdentity?: string
            toneOfVoice?: string
            guardrails?: string[]
            keywords?: string[]
            styleGuide?: {
              communicationStyle?: string
              languagePreferences?: string
              formalityLevel?: string
              writingStyle?: string
            }
            roles?: string[]
            allowedContentTypes?: string[]
            workflowStages?: string[]
          }
          created_at?: string
          updated_at?: string
        }
      }
      user_brand_access: {
        Row: {
          user_id: string
          brand_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          brand_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          brand_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      user_permissions_view: {
        Row: {
          user_id: string
          role_name: UserRole | null
          permissions: string[] | null
          accessible_brand_names: string[] | null
        }
      }
    }
    Functions: {}
    Enums: {
      user_role: UserRole
    }
  }
} 