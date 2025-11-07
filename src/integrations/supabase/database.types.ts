/**
 * Supabase Database Types
 *
 * Auto-generated types from database schema
 * Source: supabase/migrations/20251001061412_1d9444b9-364b-4953-8335-a3707304ba4f.sql
 *
 * NOTE: Regenerate this file when schema changes using:
 * npx supabase gen types typescript --local > src/integrations/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Enums
export type UserRole =
  | 'super_admin'
  | 'org_admin'
  | 'dealer_admin'
  | 'sales_manager'
  | 'sales_rep'
  | 'finance_manager'
  | 'viewer';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'quoted'
  | 'negotiating'
  | 'credit_app'
  | 'sold'
  | 'lost'
  | 'archived';

export type LeadSource =
  | 'website'
  | 'chat'
  | 'sms'
  | 'whatsapp'
  | 'messenger'
  | 'email'
  | 'phone'
  | 'autotrader'
  | 'kijiji'
  | 'cargurus'
  | 'facebook'
  | 'walk_in'
  | 'referral'
  | 'other';

export type InteractionType =
  | 'chat'
  | 'sms'
  | 'whatsapp'
  | 'messenger'
  | 'email'
  | 'phone_call'
  | 'note'
  | 'ai_summary';

export type ConsentType =
  | 'marketing'
  | 'sms'
  | 'phone'
  | 'email'
  | 'data_processing'
  | 'credit_check'
  | 'esign'
  | 'tcpa'
  | 'casl';

export type ConsentStatus =
  | 'granted'
  | 'denied'
  | 'withdrawn'
  | 'expired';

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'expired'
  | 'declined';

export type CreditAppStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'declined'
  | 'more_info_needed';

export type DocumentType =
  | 'drivers_license'
  | 'insurance'
  | 'paystub'
  | 'credit_app'
  | 'quote'
  | 'contract'
  | 'trade_appraisal'
  | 'other';

export type Jurisdiction =
  | 'ca_ab'
  | 'ca_bc'
  | 'ca_on'
  | 'ca_qc'
  | 'ca_sk'
  | 'ca_mb'
  | 'ca_other'
  | 'us'
  | 'eu'
  | 'other';

// Database Tables
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          jurisdiction: Jurisdiction;
          timezone: string;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          jurisdiction?: Jurisdiction;
          timezone?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          jurisdiction?: Jurisdiction;
          timezone?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      dealerships: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          address: string | null;
          city: string | null;
          province: string | null;
          postal_code: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          logo_url: string | null;
          dealer_license: string | null;
          omvic_id: string | null;
          amvic_id: string | null;
          vsa_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          postal_code?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          dealer_license?: string | null;
          omvic_id?: string | null;
          amvic_id?: string | null;
          vsa_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          postal_code?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          dealer_license?: string | null;
          omvic_id?: string | null;
          amvic_id?: string | null;
          vsa_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          dealership_id: string | null;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          locale: string | null;
          timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          dealership_id?: string | null;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          locale?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          dealership_id?: string | null;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          locale?: string | null;
          timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          dealership_id: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id?: string | null;
          dealership_id?: string | null;
          role: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string | null;
          dealership_id?: string | null;
          role?: UserRole;
          created_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          dealership_id: string;
          vin: string | null;
          stock_number: string | null;
          year: number;
          make: string;
          model: string;
          trim: string | null;
          body_style: string | null;
          exterior_color: string | null;
          interior_color: string | null;
          mileage: number | null;
          engine: string | null;
          transmission: string | null;
          drivetrain: string | null;
          fuel_type: string | null;
          price: number | null;
          msrp: number | null;
          cost: number | null;
          description: string | null;
          features: string[] | null;
          images: string[] | null;
          status: string | null;
          source: string | null;
          source_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          vin?: string | null;
          stock_number?: string | null;
          year: number;
          make: string;
          model: string;
          trim?: string | null;
          body_style?: string | null;
          exterior_color?: string | null;
          interior_color?: string | null;
          mileage?: number | null;
          engine?: string | null;
          transmission?: string | null;
          drivetrain?: string | null;
          fuel_type?: string | null;
          price?: number | null;
          msrp?: number | null;
          cost?: number | null;
          description?: string | null;
          features?: string[] | null;
          images?: string[] | null;
          status?: string | null;
          source?: string | null;
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          vin?: string | null;
          stock_number?: string | null;
          year?: number;
          make?: string;
          model?: string;
          trim?: string | null;
          body_style?: string | null;
          exterior_color?: string | null;
          interior_color?: string | null;
          mileage?: number | null;
          engine?: string | null;
          transmission?: string | null;
          drivetrain?: string | null;
          fuel_type?: string | null;
          price?: number | null;
          msrp?: number | null;
          cost?: number | null;
          description?: string | null;
          features?: string[] | null;
          images?: string[] | null;
          status?: string | null;
          source?: string | null;
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          dealership_id: string;
          assigned_to: string | null;
          source: LeadSource;
          status: LeadStatus;
          score: number | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          preferred_contact: string | null;
          vehicle_interest: string | null;
          trade_in: Json | null;
          notes: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          assigned_to?: string | null;
          source: LeadSource;
          status?: LeadStatus;
          score?: number | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          preferred_contact?: string | null;
          vehicle_interest?: string | null;
          trade_in?: Json | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          assigned_to?: string | null;
          source?: LeadSource;
          status?: LeadStatus;
          score?: number | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          preferred_contact?: string | null;
          vehicle_interest?: string | null;
          trade_in?: Json | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      interactions: {
        Row: {
          id: string;
          lead_id: string;
          user_id: string | null;
          type: InteractionType;
          direction: string | null;
          subject: string | null;
          body: string | null;
          metadata: Json | null;
          ai_generated: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          user_id?: string | null;
          type: InteractionType;
          direction?: string | null;
          subject?: string | null;
          body?: string | null;
          metadata?: Json | null;
          ai_generated?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          user_id?: string | null;
          type?: InteractionType;
          direction?: string | null;
          subject?: string | null;
          body?: string | null;
          metadata?: Json | null;
          ai_generated?: boolean | null;
          created_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          dealership_id: string;
          lead_id: string | null;
          created_by: string;
          version: number;
          status: QuoteStatus;
          vehicle_id: string | null;
          vehicle_price: number;
          trade_in_value: number | null;
          trade_in_payoff: number | null;
          down_payment: number | null;
          tax_rate: number | null;
          taxes: number | null;
          dealer_fees: number | null;
          incentives: Json | null;
          addons: Json | null;
          finance_term: number | null;
          finance_rate: number | null;
          payment_amount: number | null;
          total_price: number | null;
          notes: string | null;
          valid_until: string | null;
          pdf_url: string | null;
          encryption_key: string | null;
          viewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          lead_id?: string | null;
          created_by: string;
          version?: number;
          status?: QuoteStatus;
          vehicle_id?: string | null;
          vehicle_price: number;
          trade_in_value?: number | null;
          trade_in_payoff?: number | null;
          down_payment?: number | null;
          tax_rate?: number | null;
          taxes?: number | null;
          dealer_fees?: number | null;
          incentives?: Json | null;
          addons?: Json | null;
          finance_term?: number | null;
          finance_rate?: number | null;
          payment_amount?: number | null;
          total_price?: number | null;
          notes?: string | null;
          valid_until?: string | null;
          pdf_url?: string | null;
          encryption_key?: string | null;
          viewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          lead_id?: string | null;
          created_by?: string;
          version?: number;
          status?: QuoteStatus;
          vehicle_id?: string | null;
          vehicle_price?: number;
          trade_in_value?: number | null;
          trade_in_payoff?: number | null;
          down_payment?: number | null;
          tax_rate?: number | null;
          taxes?: number | null;
          dealer_fees?: number | null;
          incentives?: Json | null;
          addons?: Json | null;
          finance_term?: number | null;
          finance_rate?: number | null;
          payment_amount?: number | null;
          total_price?: number | null;
          notes?: string | null;
          valid_until?: string | null;
          pdf_url?: string | null;
          encryption_key?: string | null;
          viewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      desking_sessions: {
        Row: {
          id: string;
          dealership_id: string;
          lead_id: string | null;
          quote_id: string | null;
          created_by: string;
          session_data: Json | null;
          external_id: string | null;
          integration_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          lead_id?: string | null;
          quote_id?: string | null;
          created_by: string;
          session_data?: Json | null;
          external_id?: string | null;
          integration_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          lead_id?: string | null;
          quote_id?: string | null;
          created_by?: string;
          session_data?: Json | null;
          external_id?: string | null;
          integration_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit_applications: {
        Row: {
          id: string;
          dealership_id: string;
          lead_id: string;
          submitted_by: string | null;
          status: CreditAppStatus;
          applicant_data: Json;
          co_applicant_data: Json | null;
          employment_data: Json | null;
          consent_timestamp: string | null;
          consent_ip: string | null;
          soft_pull: boolean | null;
          credit_score: number | null;
          decision: string | null;
          decision_date: string | null;
          external_id: string | null;
          integration_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          lead_id: string;
          submitted_by?: string | null;
          status?: CreditAppStatus;
          applicant_data: Json;
          co_applicant_data?: Json | null;
          employment_data?: Json | null;
          consent_timestamp?: string | null;
          consent_ip?: string | null;
          soft_pull?: boolean | null;
          credit_score?: number | null;
          decision?: string | null;
          decision_date?: string | null;
          external_id?: string | null;
          integration_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          lead_id?: string;
          submitted_by?: string | null;
          status?: CreditAppStatus;
          applicant_data?: Json;
          co_applicant_data?: Json | null;
          employment_data?: Json | null;
          consent_timestamp?: string | null;
          consent_ip?: string | null;
          soft_pull?: boolean | null;
          credit_score?: number | null;
          decision?: string | null;
          decision_date?: string | null;
          external_id?: string | null;
          integration_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      consents: {
        Row: {
          id: string;
          lead_id: string | null;
          profile_id: string | null;
          type: ConsentType;
          status: ConsentStatus;
          purpose: string;
          jurisdiction: Jurisdiction;
          granted_at: string | null;
          withdrawn_at: string | null;
          expires_at: string | null;
          ip_address: string | null;
          user_agent: string | null;
          channel: string | null;
          proof_url: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          profile_id?: string | null;
          type: ConsentType;
          status: ConsentStatus;
          purpose: string;
          jurisdiction: Jurisdiction;
          granted_at?: string | null;
          withdrawn_at?: string | null;
          expires_at?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          channel?: string | null;
          proof_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          profile_id?: string | null;
          type?: ConsentType;
          status?: ConsentStatus;
          purpose?: string;
          jurisdiction?: Jurisdiction;
          granted_at?: string | null;
          withdrawn_at?: string | null;
          expires_at?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          channel?: string | null;
          proof_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          dealership_id: string;
          lead_id: string | null;
          uploaded_by: string | null;
          type: DocumentType;
          filename: string;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          encrypted: boolean | null;
          encryption_metadata: Json | null;
          share_token: string | null;
          share_expires_at: string | null;
          share_revoked: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dealership_id: string;
          lead_id?: string | null;
          uploaded_by?: string | null;
          type: DocumentType;
          filename: string;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          encrypted?: boolean | null;
          encryption_metadata?: Json | null;
          share_token?: string | null;
          share_expires_at?: string | null;
          share_revoked?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dealership_id?: string;
          lead_id?: string | null;
          uploaded_by?: string | null;
          type?: DocumentType;
          filename?: string;
          storage_path?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          encrypted?: boolean | null;
          encryption_metadata?: Json | null;
          share_token?: string | null;
          share_expires_at?: string | null;
          share_revoked?: boolean | null;
          created_at?: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          provider: string;
          config: Json;
          credentials_encrypted: string | null;
          active: boolean | null;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          provider: string;
          config: Json;
          credentials_encrypted?: string | null;
          active?: boolean | null;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          provider?: string;
          config?: Json;
          credentials_encrypted?: string | null;
          active?: boolean | null;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pricing_tiers: {
        Row: {
          id: string;
          name: string;
          monthly_price: number;
          yearly_price: number | null;
          included_leads: number | null;
          included_ai_messages: number | null;
          max_users: number | null;
          max_dealerships: number | null;
          features: Json | null;
          active: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          monthly_price: number;
          yearly_price?: number | null;
          included_leads?: number | null;
          included_ai_messages?: number | null;
          max_users?: number | null;
          max_dealerships?: number | null;
          features?: Json | null;
          active?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          monthly_price?: number;
          yearly_price?: number | null;
          included_leads?: number | null;
          included_ai_messages?: number | null;
          max_users?: number | null;
          max_dealerships?: number | null;
          features?: Json | null;
          active?: boolean | null;
          created_at?: string;
        };
      };
      usage_counters: {
        Row: {
          id: string;
          organization_id: string;
          month: string;
          leads_created: number | null;
          ai_messages_sent: number | null;
          quotes_generated: number | null;
          credit_apps_submitted: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          month: string;
          leads_created?: number | null;
          ai_messages_sent?: number | null;
          quotes_generated?: number | null;
          credit_apps_submitted?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          month?: string;
          leads_created?: number | null;
          ai_messages_sent?: number | null;
          quotes_generated?: number | null;
          credit_apps_submitted?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_events: {
        Row: {
          id: string;
          organization_id: string | null;
          user_id: string | null;
          event_type: string;
          resource_type: string | null;
          resource_id: string | null;
          action: string;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          event_type: string;
          resource_type?: string | null;
          resource_id?: string | null;
          action: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          event_type?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          action?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      webhooks: {
        Row: {
          id: string;
          organization_id: string;
          url: string;
          events: string[];
          secret: string;
          active: boolean | null;
          last_triggered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          url: string;
          events: string[];
          secret: string;
          active?: boolean | null;
          last_triggered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          url?: string;
          events?: string[];
          secret?: string;
          active?: boolean | null;
          last_triggered_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: UserRole };
        Returns: boolean;
      };
      get_user_organization: {
        Args: { _user_id: string };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      lead_status: LeadStatus;
      lead_source: LeadSource;
      interaction_type: InteractionType;
      consent_type: ConsentType;
      consent_status: ConsentStatus;
      quote_status: QuoteStatus;
      credit_app_status: CreditAppStatus;
      document_type: DocumentType;
      jurisdiction: Jurisdiction;
    };
  };
}
