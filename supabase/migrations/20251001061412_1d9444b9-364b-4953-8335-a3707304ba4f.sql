-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM ('super_admin', 'org_admin', 'dealer_admin', 'sales_manager', 'sales_rep', 'finance_manager', 'viewer');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'quoted', 'negotiating', 'credit_app', 'sold', 'lost', 'archived');
CREATE TYPE lead_source AS ENUM ('website', 'chat', 'sms', 'whatsapp', 'messenger', 'email', 'phone', 'autotrader', 'kijiji', 'cargurus', 'facebook', 'walk_in', 'referral', 'other');
CREATE TYPE interaction_type AS ENUM ('chat', 'sms', 'whatsapp', 'messenger', 'email', 'phone_call', 'note', 'ai_summary');
CREATE TYPE consent_type AS ENUM ('marketing', 'sms', 'phone', 'email', 'data_processing', 'credit_check', 'esign', 'tcpa', 'casl');
CREATE TYPE consent_status AS ENUM ('granted', 'denied', 'withdrawn', 'expired');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'expired', 'declined');
CREATE TYPE credit_app_status AS ENUM ('draft', 'submitted', 'pending', 'approved', 'declined', 'more_info_needed');
CREATE TYPE document_type AS ENUM ('drivers_license', 'insurance', 'paystub', 'credit_app', 'quote', 'contract', 'trade_appraisal', 'other');
CREATE TYPE jurisdiction AS ENUM ('ca_ab', 'ca_bc', 'ca_on', 'ca_qc', 'ca_sk', 'ca_mb', 'ca_other', 'us', 'eu', 'other');

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  jurisdiction jurisdiction NOT NULL DEFAULT 'ca_on',
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  locale TEXT NOT NULL DEFAULT 'en-CA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dealerships table
CREATE TABLE dealerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  dealer_license TEXT,
  omvic_id TEXT,
  amvic_id TEXT,
  vsa_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  dealership_id UUID REFERENCES dealerships(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'en-CA',
  timezone TEXT DEFAULT 'America/Toronto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (security-first design)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id, dealership_id, role)
);

-- Vehicles/Inventory table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  vin TEXT,
  stock_number TEXT,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  body_style TEXT,
  exterior_color TEXT,
  interior_color TEXT,
  mileage INTEGER,
  engine TEXT,
  transmission TEXT,
  drivetrain TEXT,
  fuel_type TEXT,
  price DECIMAL(10,2),
  msrp DECIMAL(10,2),
  cost DECIMAL(10,2),
  description TEXT,
  features TEXT[],
  images TEXT[],
  status TEXT DEFAULT 'available',
  source TEXT,
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dealership_id, vin)
);

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source lead_source NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  score INTEGER DEFAULT 0,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  preferred_contact TEXT,
  vehicle_interest UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  trade_in JSONB,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Interactions table (omnichannel)
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type interaction_type NOT NULL,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT,
  body TEXT,
  metadata JSONB,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 1,
  status quote_status NOT NULL DEFAULT 'draft',
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_price DECIMAL(10,2) NOT NULL,
  trade_in_value DECIMAL(10,2),
  trade_in_payoff DECIMAL(10,2),
  down_payment DECIMAL(10,2),
  tax_rate DECIMAL(5,4),
  taxes DECIMAL(10,2),
  dealer_fees DECIMAL(10,2),
  incentives JSONB,
  addons JSONB,
  finance_term INTEGER,
  finance_rate DECIMAL(5,4),
  payment_amount DECIMAL(10,2),
  total_price DECIMAL(10,2),
  notes TEXT,
  valid_until DATE,
  pdf_url TEXT,
  encryption_key TEXT,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Desking sessions table
CREATE TABLE desking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  session_data JSONB,
  external_id TEXT,
  integration_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credit applications table
CREATE TABLE credit_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status credit_app_status NOT NULL DEFAULT 'draft',
  applicant_data JSONB NOT NULL,
  co_applicant_data JSONB,
  employment_data JSONB,
  consent_timestamp TIMESTAMPTZ,
  consent_ip TEXT,
  soft_pull BOOLEAN DEFAULT true,
  credit_score INTEGER,
  decision TEXT,
  decision_date TIMESTAMPTZ,
  external_id TEXT,
  integration_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consents table (compliance-first)
CREATE TABLE consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type consent_type NOT NULL,
  status consent_status NOT NULL,
  purpose TEXT NOT NULL,
  jurisdiction jurisdiction NOT NULL,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  channel TEXT,
  proof_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((lead_id IS NOT NULL) OR (profile_id IS NOT NULL))
);

-- Documents table (E2EE)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type document_type NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  encrypted BOOLEAN DEFAULT true,
  encryption_metadata JSONB,
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMPTZ,
  share_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Integrations table
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  config JSONB NOT NULL,
  credentials_encrypted TEXT,
  active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

-- Pricing tiers table
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  monthly_price DECIMAL(10,2) NOT NULL,
  yearly_price DECIMAL(10,2),
  included_leads INTEGER,
  included_ai_messages INTEGER,
  max_users INTEGER,
  max_dealerships INTEGER,
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usage counters table
CREATE TABLE usage_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  leads_created INTEGER DEFAULT 0,
  ai_messages_sent INTEGER DEFAULT 0,
  quotes_generated INTEGER DEFAULT 0,
  credit_apps_submitted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, month)
);

-- Audit events table (compliance)
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhooks table
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_profiles_dealership ON profiles(dealership_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_org ON user_roles(organization_id);
CREATE INDEX idx_dealerships_org ON dealerships(organization_id);
CREATE INDEX idx_vehicles_dealership ON vehicles(dealership_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_leads_dealership ON leads(dealership_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_interactions_lead ON interactions(lead_id);
CREATE INDEX idx_interactions_created ON interactions(created_at DESC);
CREATE INDEX idx_quotes_dealership ON quotes(dealership_id);
CREATE INDEX idx_quotes_lead ON quotes(lead_id);
CREATE INDEX idx_credit_apps_dealership ON credit_applications(dealership_id);
CREATE INDEX idx_credit_apps_lead ON credit_applications(lead_id);
CREATE INDEX idx_consents_lead ON consents(lead_id);
CREATE INDEX idx_consents_profile ON consents(profile_id);
CREATE INDEX idx_documents_dealership ON documents(dealership_id);
CREATE INDEX idx_documents_lead ON documents(lead_id);
CREATE INDEX idx_audit_events_org ON audit_events(organization_id);
CREATE INDEX idx_audit_events_created ON audit_events(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE desking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization(auth.uid()));

-- RLS Policies for dealerships
CREATE POLICY "Users can view dealerships in their org"
  ON dealerships FOR SELECT
  USING (organization_id = get_user_organization(auth.uid()));

-- RLS Policies for vehicles
CREATE POLICY "Users can view vehicles in their dealerships"
  ON vehicles FOR SELECT
  USING (
    dealership_id IN (
      SELECT id FROM dealerships WHERE organization_id = get_user_organization(auth.uid())
    )
  );

-- RLS Policies for leads
CREATE POLICY "Users can view leads in their dealerships"
  ON leads FOR SELECT
  USING (
    dealership_id IN (
      SELECT id FROM dealerships WHERE organization_id = get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Users can create leads in their dealerships"
  ON leads FOR INSERT
  WITH CHECK (
    dealership_id IN (
      SELECT id FROM dealerships WHERE organization_id = get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Users can update leads in their dealerships"
  ON leads FOR UPDATE
  USING (
    dealership_id IN (
      SELECT id FROM dealerships WHERE organization_id = get_user_organization(auth.uid())
    )
  );

-- RLS Policies for interactions
CREATE POLICY "Users can view interactions for their leads"
  ON interactions FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE dealership_id IN (
        SELECT id FROM dealerships WHERE organization_id = get_user_organization(auth.uid())
      )
    )
  );

CREATE POLICY "Users can create interactions"
  ON interactions FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE dealership_id IN (
        SELECT id FROM dealerships WHERE organization_id = get_user_organization(auth.uid())
      )
    )
  );

-- RLS Policies for quotes
CREATE POLICY "Users can view quotes in their dealerships"
  ON quotes FOR SELECT
  USING (
    dealership_id IN (
      SELECT id FROM dealerships WHERE organization_id = get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Users can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (
    dealership_id IN (
      SELECT id FROM dealerships WHERE organization_id = get_user_organization(auth.uid())
    )
  );

-- RLS Policies for credit_applications
CREATE POLICY "Users can view credit apps in their dealerships"
  ON credit_applications FOR SELECT
  USING (
    dealership_id IN (
      SELECT id FROM dealerships WHERE organization_id = get_user_organization(auth.uid())
    )
  );

-- RLS Policies for documents
CREATE POLICY "Users can view documents in their dealerships"
  ON documents FOR SELECT
  USING (
    dealership_id IN (
      SELECT id FROM dealerships WHERE organization_id = get_user_organization(auth.uid())
    )
  );

-- RLS Policies for audit_events
CREATE POLICY "Admins can view audit events"
  ON audit_events FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'org_admin')
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dealerships_updated_at BEFORE UPDATE ON dealerships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_desking_sessions_updated_at BEFORE UPDATE ON desking_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_applications_updated_at BEFORE UPDATE ON credit_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_counters_updated_at BEFORE UPDATE ON usage_counters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();