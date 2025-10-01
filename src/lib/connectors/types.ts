/**
 * DMS Connector SDK Types
 * 
 * Provides standardized interfaces for integrating with Dealer Management Systems
 * like Autovance and Dealertrack.
 */

export interface ConnectorConfig {
  provider: 'autovance' | 'dealertrack' | 'other';
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  dealerCode?: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
}

export interface Vehicle {
  vin?: string;
  stockNumber?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  price?: number;
  msrp?: number;
  cost?: number;
  status: 'available' | 'sold' | 'pending' | 'archived';
  images?: string[];
  features?: string[];
}

export interface Lead {
  id?: string;
  externalId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  vehicleInterest?: string;
  metadata?: Record<string, any>;
}

export interface Quote {
  id?: string;
  externalId?: string;
  leadId?: string;
  vehicleId?: string;
  vehiclePrice: number;
  downPayment?: number;
  tradeInValue?: number;
  financeRate?: number;
  financeTerm?: number;
  paymentAmount?: number;
  totalPrice: number;
  taxes?: number;
  fees?: number;
}

export interface CreditApplication {
  id?: string;
  externalId?: string;
  leadId?: string;
  applicantData: Record<string, any>;
  coApplicantData?: Record<string, any>;
  employmentData?: Record<string, any>;
  status: 'draft' | 'submitted' | 'approved' | 'declined';
  softPull: boolean;
  creditScore?: number;
}

export interface SyncResult {
  success: boolean;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors?: string[];
  timestamp: string;
}

/**
 * Base Connector Interface
 * All DMS connectors must implement these methods
 */
export interface DMSConnector {
  // Configuration
  connect(config: ConnectorConfig): Promise<boolean>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;

  // Vehicles
  syncVehicles(): Promise<SyncResult>;
  getVehicle(vin: string): Promise<Vehicle | null>;
  updateVehicle(vin: string, data: Partial<Vehicle>): Promise<boolean>;

  // Leads
  createLead(lead: Lead): Promise<string>;
  updateLead(id: string, lead: Partial<Lead>): Promise<boolean>;
  getLead(id: string): Promise<Lead | null>;

  // Quotes
  createQuote(quote: Quote): Promise<string>;
  getQuote(id: string): Promise<Quote | null>;
  updateQuote(id: string, quote: Partial<Quote>): Promise<boolean>;

  // Credit Applications
  submitCreditApp(app: CreditApplication): Promise<string>;
  getCreditAppStatus(id: string): Promise<string>;
}
