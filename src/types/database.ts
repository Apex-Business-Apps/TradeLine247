export type UserRole = 'super_admin' | 'org_admin' | 'dealer_admin' | 'sales_manager' | 'sales_rep' | 'finance_manager' | 'viewer';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'negotiating' | 'credit_app' | 'sold' | 'lost' | 'archived';
export type LeadSource = 'website' | 'chat' | 'sms' | 'whatsapp' | 'messenger' | 'email' | 'phone' | 'autotrader' | 'kijiji' | 'cargurus' | 'facebook' | 'walk_in' | 'referral' | 'other';
export type InteractionType = 'chat' | 'sms' | 'whatsapp' | 'messenger' | 'email' | 'phone_call' | 'note' | 'ai_summary';
export type ConsentType = 'marketing' | 'sms' | 'phone' | 'email' | 'data_processing' | 'credit_check' | 'esign' | 'tcpa' | 'casl';
export type ConsentStatus = 'granted' | 'denied' | 'withdrawn' | 'expired';
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired' | 'declined';
export type CreditAppStatus = 'draft' | 'submitted' | 'pending' | 'approved' | 'declined' | 'more_info_needed';
export type DocumentType = 'drivers_license' | 'insurance' | 'paystub' | 'credit_app' | 'quote' | 'contract' | 'trade_appraisal' | 'other';
export type Jurisdiction = 'ca_ab' | 'ca_bc' | 'ca_on' | 'ca_qc' | 'ca_sk' | 'ca_mb' | 'ca_other' | 'us' | 'eu' | 'other';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  jurisdiction: Jurisdiction;
  timezone: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface Dealership {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  dealer_license?: string;
  omvic_id?: string;
  amvic_id?: string;
  vsa_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id?: string;
  dealership_id?: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  locale?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  dealership_id: string;
  vin?: string;
  stock_number?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  body_style?: string;
  exterior_color?: string;
  interior_color?: string;
  mileage?: number;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuel_type?: string;
  price?: number;
  msrp?: number;
  cost?: number;
  description?: string;
  features?: string[];
  images?: string[];
  status?: string;
  source?: string;
  source_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  dealership_id: string;
  assigned_to?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  preferred_contact?: string;
  vehicle_interest?: string;
  trade_in?: any;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  lead_id: string;
  user_id?: string;
  type: InteractionType;
  direction: 'inbound' | 'outbound';
  subject?: string;
  body?: string;
  metadata?: any;
  ai_generated: boolean;
  created_at: string;
}

export interface Quote {
  id: string;
  dealership_id: string;
  lead_id?: string;
  created_by: string;
  version: number;
  status: QuoteStatus;
  vehicle_id?: string;
  vehicle_price: number;
  trade_in_value?: number;
  trade_in_payoff?: number;
  down_payment?: number;
  tax_rate?: number;
  taxes?: number;
  dealer_fees?: number;
  incentives?: any;
  addons?: any;
  finance_term?: number;
  finance_rate?: number;
  payment_amount?: number;
  total_price?: number;
  notes?: string;
  valid_until?: string;
  pdf_url?: string;
  encryption_key?: string;
  viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditApplication {
  id: string;
  dealership_id: string;
  lead_id: string;
  submitted_by?: string;
  status: CreditAppStatus;
  applicant_data: any;
  co_applicant_data?: any;
  employment_data?: any;
  consent_timestamp?: string;
  consent_ip?: string;
  soft_pull: boolean;
  credit_score?: number;
  decision?: string;
  decision_date?: string;
  external_id?: string;
  integration_name?: string;
  created_at: string;
  updated_at: string;
}
