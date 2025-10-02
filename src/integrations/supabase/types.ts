export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ab_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          session_id: string
          test_id: string
          user_id: string | null
          variant: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          session_id: string
          test_id: string
          user_id?: string | null
          variant: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string
          test_id?: string
          user_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_events_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          traffic_split: Json
          updated_at: string
          variants: Json
          winner: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          traffic_split?: Json
          updated_at?: string
          variants: Json
          winner?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          traffic_split?: Json
          updated_at?: string
          variants?: Json
          winner?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          channel: string | null
          created_at: string
          expires_at: string | null
          granted_at: string | null
          id: string
          ip_address: string | null
          jurisdiction: Database["public"]["Enums"]["jurisdiction"]
          lead_id: string | null
          metadata: Json | null
          profile_id: string | null
          proof_url: string | null
          purpose: string
          status: Database["public"]["Enums"]["consent_status"]
          type: Database["public"]["Enums"]["consent_type"]
          user_agent: string | null
          withdrawn_at: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          jurisdiction: Database["public"]["Enums"]["jurisdiction"]
          lead_id?: string | null
          metadata?: Json | null
          profile_id?: string | null
          proof_url?: string | null
          purpose: string
          status: Database["public"]["Enums"]["consent_status"]
          type: Database["public"]["Enums"]["consent_type"]
          user_agent?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          jurisdiction?: Database["public"]["Enums"]["jurisdiction"]
          lead_id?: string | null
          metadata?: Json | null
          profile_id?: string | null
          proof_url?: string | null
          purpose?: string
          status?: Database["public"]["Enums"]["consent_status"]
          type?: Database["public"]["Enums"]["consent_type"]
          user_agent?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_applications: {
        Row: {
          applicant_data: Json
          co_applicant_data: Json | null
          consent_ip: string | null
          consent_timestamp: string | null
          created_at: string
          credit_score: number | null
          dealership_id: string
          decision: string | null
          decision_date: string | null
          employment_data: Json | null
          external_id: string | null
          id: string
          integration_name: string | null
          lead_id: string
          soft_pull: boolean | null
          status: Database["public"]["Enums"]["credit_app_status"]
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          applicant_data: Json
          co_applicant_data?: Json | null
          consent_ip?: string | null
          consent_timestamp?: string | null
          created_at?: string
          credit_score?: number | null
          dealership_id: string
          decision?: string | null
          decision_date?: string | null
          employment_data?: Json | null
          external_id?: string | null
          id?: string
          integration_name?: string | null
          lead_id: string
          soft_pull?: boolean | null
          status?: Database["public"]["Enums"]["credit_app_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          applicant_data?: Json
          co_applicant_data?: Json | null
          consent_ip?: string | null
          consent_timestamp?: string | null
          created_at?: string
          credit_score?: number | null
          dealership_id?: string
          decision?: string | null
          decision_date?: string | null
          employment_data?: Json | null
          external_id?: string | null
          id?: string
          integration_name?: string | null
          lead_id?: string
          soft_pull?: boolean | null
          status?: Database["public"]["Enums"]["credit_app_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_applications_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_applications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_applications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dealerships: {
        Row: {
          active: boolean
          address: string | null
          amvic_id: string | null
          city: string | null
          created_at: string
          dealer_license: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          omvic_id: string | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          province: string | null
          slug: string
          updated_at: string
          vsa_id: string | null
          website: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          amvic_id?: string | null
          city?: string | null
          created_at?: string
          dealer_license?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          omvic_id?: string | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          slug: string
          updated_at?: string
          vsa_id?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          amvic_id?: string | null
          city?: string | null
          created_at?: string
          dealer_license?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          omvic_id?: string | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          slug?: string
          updated_at?: string
          vsa_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealerships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      desking_sessions: {
        Row: {
          created_at: string
          created_by: string
          dealership_id: string
          external_id: string | null
          id: string
          integration_name: string | null
          lead_id: string | null
          quote_id: string | null
          session_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dealership_id: string
          external_id?: string | null
          id?: string
          integration_name?: string | null
          lead_id?: string | null
          quote_id?: string | null
          session_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dealership_id?: string
          external_id?: string | null
          id?: string
          integration_name?: string | null
          lead_id?: string | null
          quote_id?: string | null
          session_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "desking_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desking_sessions_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desking_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desking_sessions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          dealership_id: string
          encrypted: boolean | null
          encryption_metadata: Json | null
          filename: string
          id: string
          lead_id: string | null
          mime_type: string | null
          share_expires_at: string | null
          share_revoked: boolean | null
          share_token: string | null
          size_bytes: number | null
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          dealership_id: string
          encrypted?: boolean | null
          encryption_metadata?: Json | null
          filename: string
          id?: string
          lead_id?: string | null
          mime_type?: string | null
          share_expires_at?: string | null
          share_revoked?: boolean | null
          share_token?: string | null
          size_bytes?: number | null
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          dealership_id?: string
          encrypted?: boolean | null
          encryption_metadata?: Json | null
          filename?: string
          id?: string
          lead_id?: string | null
          mime_type?: string | null
          share_expires_at?: string | null
          share_revoked?: boolean | null
          share_token?: string | null
          size_bytes?: number | null
          storage_path?: string
          type?: Database["public"]["Enums"]["document_type"]
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          active: boolean | null
          config: Json
          created_at: string
          credentials_encrypted: string | null
          id: string
          last_sync_at: string | null
          name: string
          organization_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          config: Json
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          organization_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          config?: Json
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          organization_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          ai_generated: boolean | null
          body: string | null
          created_at: string
          direction: string | null
          id: string
          lead_id: string
          metadata: Json | null
          subject: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          body?: string | null
          created_at?: string
          direction?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          subject?: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          body?: string | null
          created_at?: string
          direction?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          subject?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          dealership_id: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          preferred_contact: string | null
          score: number | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          trade_in: Json | null
          updated_at: string
          vehicle_interest: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          dealership_id: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          score?: number | null
          source: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          trade_in?: Json | null
          updated_at?: string
          vehicle_interest?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          dealership_id?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          score?: number | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          trade_in?: Json | null
          updated_at?: string
          vehicle_interest?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vehicle_interest_fkey"
            columns: ["vehicle_interest"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          jurisdiction: Database["public"]["Enums"]["jurisdiction"]
          locale: string
          name: string
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jurisdiction?: Database["public"]["Enums"]["jurisdiction"]
          locale?: string
          name: string
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jurisdiction?: Database["public"]["Enums"]["jurisdiction"]
          locale?: string
          name?: string
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_tiers: {
        Row: {
          active: boolean | null
          created_at: string
          features: Json | null
          id: string
          included_ai_messages: number | null
          included_leads: number | null
          max_dealerships: number | null
          max_users: number | null
          monthly_price: number
          name: string
          yearly_price: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          features?: Json | null
          id?: string
          included_ai_messages?: number | null
          included_leads?: number | null
          max_dealerships?: number | null
          max_users?: number | null
          monthly_price: number
          name: string
          yearly_price?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          features?: Json | null
          id?: string
          included_ai_messages?: number | null
          included_leads?: number | null
          max_dealerships?: number | null
          max_users?: number | null
          monthly_price?: number
          name?: string
          yearly_price?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dealership_id: string | null
          email: string
          full_name: string | null
          id: string
          locale: string | null
          organization_id: string | null
          phone: string | null
          referral_code: string | null
          referral_credits: number | null
          referred_by: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dealership_id?: string | null
          email: string
          full_name?: string | null
          id: string
          locale?: string | null
          organization_id?: string | null
          phone?: string | null
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dealership_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          locale?: string | null
          organization_id?: string | null
          phone?: string | null
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          addons: Json | null
          created_at: string
          created_by: string
          dealer_fees: number | null
          dealership_id: string
          down_payment: number | null
          encryption_key: string | null
          finance_rate: number | null
          finance_term: number | null
          id: string
          incentives: Json | null
          lead_id: string | null
          notes: string | null
          payment_amount: number | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["quote_status"]
          tax_rate: number | null
          taxes: number | null
          total_price: number | null
          trade_in_payoff: number | null
          trade_in_value: number | null
          updated_at: string
          valid_until: string | null
          vehicle_id: string | null
          vehicle_price: number
          version: number
          viewed_at: string | null
        }
        Insert: {
          addons?: Json | null
          created_at?: string
          created_by: string
          dealer_fees?: number | null
          dealership_id: string
          down_payment?: number | null
          encryption_key?: string | null
          finance_rate?: number | null
          finance_term?: number | null
          id?: string
          incentives?: Json | null
          lead_id?: string | null
          notes?: string | null
          payment_amount?: number | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          tax_rate?: number | null
          taxes?: number | null
          total_price?: number | null
          trade_in_payoff?: number | null
          trade_in_value?: number | null
          updated_at?: string
          valid_until?: string | null
          vehicle_id?: string | null
          vehicle_price: number
          version?: number
          viewed_at?: string | null
        }
        Update: {
          addons?: Json | null
          created_at?: string
          created_by?: string
          dealer_fees?: number | null
          dealership_id?: string
          down_payment?: number | null
          encryption_key?: string | null
          finance_rate?: number | null
          finance_term?: number | null
          id?: string
          incentives?: Json | null
          lead_id?: string | null
          notes?: string | null
          payment_amount?: number | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          tax_rate?: number | null
          taxes?: number | null
          total_price?: number | null
          trade_in_payoff?: number | null
          trade_in_value?: number | null
          updated_at?: string
          valid_until?: string | null
          vehicle_id?: string | null
          vehicle_price?: number
          version?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          referral_code: string
          referred_email: string
          referred_user_id: string | null
          referrer_id: string
          reward_granted: boolean | null
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          referral_code: string
          referred_email: string
          referred_user_id?: string | null
          referrer_id: string
          reward_granted?: boolean | null
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          referral_code?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string
          reward_granted?: boolean | null
          status?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          ai_messages_sent: number | null
          created_at: string
          credit_apps_submitted: number | null
          id: string
          leads_created: number | null
          month: string
          organization_id: string
          quotes_generated: number | null
          updated_at: string
        }
        Insert: {
          ai_messages_sent?: number | null
          created_at?: string
          credit_apps_submitted?: number | null
          id?: string
          leads_created?: number | null
          month: string
          organization_id: string
          quotes_generated?: number | null
          updated_at?: string
        }
        Update: {
          ai_messages_sent?: number | null
          created_at?: string
          credit_apps_submitted?: number | null
          id?: string
          leads_created?: number | null
          month?: string
          organization_id?: string
          quotes_generated?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          dealership_id: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          dealership_id?: string | null
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          dealership_id?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          body_style: string | null
          cost: number | null
          created_at: string
          dealership_id: string
          description: string | null
          drivetrain: string | null
          engine: string | null
          exterior_color: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          interior_color: string | null
          make: string
          mileage: number | null
          model: string
          msrp: number | null
          price: number | null
          source: string | null
          source_id: string | null
          status: string | null
          stock_number: string | null
          transmission: string | null
          trim: string | null
          updated_at: string
          vin: string | null
          year: number
        }
        Insert: {
          body_style?: string | null
          cost?: number | null
          created_at?: string
          dealership_id: string
          description?: string | null
          drivetrain?: string | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          make: string
          mileage?: number | null
          model: string
          msrp?: number | null
          price?: number | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          stock_number?: string | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          vin?: string | null
          year: number
        }
        Update: {
          body_style?: string | null
          cost?: number | null
          created_at?: string
          dealership_id?: string
          description?: string | null
          drivetrain?: string | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          make?: string
          mileage?: number | null
          model?: string
          msrp?: number | null
          price?: number | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          stock_number?: string | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          active: boolean | null
          created_at: string
          events: string[]
          id: string
          last_triggered_at: string | null
          organization_id: string
          secret: string
          url: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          events: string[]
          id?: string
          last_triggered_at?: string | null
          organization_id: string
          secret: string
          url: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          events?: string[]
          id?: string
          last_triggered_at?: string | null
          organization_id?: string
          secret?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_installs: {
        Row: {
          active: boolean | null
          created_at: string
          dealership_id: string
          domain: string | null
          id: string
          install_date: string
          last_impression_at: string | null
          metadata: Json | null
          organization_id: string
          total_clicks: number | null
          total_impressions: number | null
          widget_code: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          dealership_id: string
          domain?: string | null
          id?: string
          install_date?: string
          last_impression_at?: string | null
          metadata?: Json | null
          organization_id: string
          total_clicks?: number | null
          total_impressions?: number | null
          widget_code: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          dealership_id?: string
          domain?: string | null
          id?: string
          install_date?: string
          last_impression_at?: string | null
          metadata?: Json | null
          organization_id?: string
          total_clicks?: number | null
          total_impressions?: number | null
          widget_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      consent_status: "granted" | "denied" | "withdrawn" | "expired"
      consent_type:
        | "marketing"
        | "sms"
        | "phone"
        | "email"
        | "data_processing"
        | "credit_check"
        | "esign"
        | "tcpa"
        | "casl"
      credit_app_status:
        | "draft"
        | "submitted"
        | "pending"
        | "approved"
        | "declined"
        | "more_info_needed"
      document_type:
        | "drivers_license"
        | "insurance"
        | "paystub"
        | "credit_app"
        | "quote"
        | "contract"
        | "trade_appraisal"
        | "other"
      interaction_type:
        | "chat"
        | "sms"
        | "whatsapp"
        | "messenger"
        | "email"
        | "phone_call"
        | "note"
        | "ai_summary"
      jurisdiction:
        | "ca_ab"
        | "ca_bc"
        | "ca_on"
        | "ca_qc"
        | "ca_sk"
        | "ca_mb"
        | "ca_other"
        | "us"
        | "eu"
        | "other"
      lead_source:
        | "website"
        | "chat"
        | "sms"
        | "whatsapp"
        | "messenger"
        | "email"
        | "phone"
        | "autotrader"
        | "kijiji"
        | "cargurus"
        | "facebook"
        | "walk_in"
        | "referral"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "quoted"
        | "negotiating"
        | "credit_app"
        | "sold"
        | "lost"
        | "archived"
      quote_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "expired"
        | "declined"
      user_role:
        | "super_admin"
        | "org_admin"
        | "dealer_admin"
        | "sales_manager"
        | "sales_rep"
        | "finance_manager"
        | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      consent_status: ["granted", "denied", "withdrawn", "expired"],
      consent_type: [
        "marketing",
        "sms",
        "phone",
        "email",
        "data_processing",
        "credit_check",
        "esign",
        "tcpa",
        "casl",
      ],
      credit_app_status: [
        "draft",
        "submitted",
        "pending",
        "approved",
        "declined",
        "more_info_needed",
      ],
      document_type: [
        "drivers_license",
        "insurance",
        "paystub",
        "credit_app",
        "quote",
        "contract",
        "trade_appraisal",
        "other",
      ],
      interaction_type: [
        "chat",
        "sms",
        "whatsapp",
        "messenger",
        "email",
        "phone_call",
        "note",
        "ai_summary",
      ],
      jurisdiction: [
        "ca_ab",
        "ca_bc",
        "ca_on",
        "ca_qc",
        "ca_sk",
        "ca_mb",
        "ca_other",
        "us",
        "eu",
        "other",
      ],
      lead_source: [
        "website",
        "chat",
        "sms",
        "whatsapp",
        "messenger",
        "email",
        "phone",
        "autotrader",
        "kijiji",
        "cargurus",
        "facebook",
        "walk_in",
        "referral",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "quoted",
        "negotiating",
        "credit_app",
        "sold",
        "lost",
        "archived",
      ],
      quote_status: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "expired",
        "declined",
      ],
      user_role: [
        "super_admin",
        "org_admin",
        "dealer_admin",
        "sales_manager",
        "sales_rep",
        "finance_manager",
        "viewer",
      ],
    },
  },
} as const
