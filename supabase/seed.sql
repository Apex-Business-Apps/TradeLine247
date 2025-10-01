-- AutoRepAi Seed Data
-- Provides sample data for development and testing
-- Run with: psql -d <database> -f supabase/seed.sql

-- Create test organization
INSERT INTO public.organizations (id, name, slug, jurisdiction, locale, timezone)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Auto Group', 'demo-auto-group', 'ca_on', 'en-CA', 'America/Toronto')
ON CONFLICT (id) DO NOTHING;

-- Create test dealerships
INSERT INTO public.dealerships (id, organization_id, name, slug, address, city, province, postal_code, phone, email, website, omvic_id, active)
VALUES 
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Downtown Motors', 'downtown-motors', '123 Main St', 'Toronto', 'ON', 'M5V 3A8', '416-555-1234', 'sales@downtownmotors.ca', 'https://downtownmotors.ca', 'OMVIC-12345', true),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Highway Auto Sales', 'highway-auto-sales', '456 Highway 7', 'Markham', 'ON', 'L3R 5H9', '905-555-5678', 'info@highwayauto.ca', 'https://highwayauto.ca', 'OMVIC-67890', true)
ON CONFLICT (id) DO NOTHING;

-- Create test user profile (you'll need to create the auth user first via Supabase Auth)
-- This is a placeholder - actual user must be created via Supabase Auth UI or signup flow
-- INSERT INTO public.profiles (id, organization_id, dealership_id, full_name, email, phone)
-- VALUES 
--   ('YOUR-AUTH-USER-ID-HERE', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'John Dealer', 'john@downtownmotors.ca', '416-555-1234');

-- Create test vehicles
INSERT INTO public.vehicles (id, dealership_id, vin, stock_number, year, make, model, trim, price, msrp, cost, mileage, status, body_style, exterior_color, interior_color, engine, transmission, drivetrain, fuel_type)
VALUES 
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '1HGCM82633A123456', 'A12345', 2024, 'Honda', 'Accord', 'Sport', 32995.00, 35000.00, 28000.00, 15000, 'available', 'Sedan', 'Silver', 'Black', '1.5L Turbo', 'CVT', 'FWD', 'Gasoline'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', '5FNRL6H78MB123456', 'B23456', 2023, 'Honda', 'Odyssey', 'EX-L', 45995.00, 48000.00, 42000.00, 8000, 'available', 'Minivan', 'White', 'Gray', '3.5L V6', 'Automatic', 'FWD', 'Gasoline'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', '2T3BFREV5JW123456', 'C34567', 2024, 'Toyota', 'RAV4', 'Limited', 42995.00, 45000.00, 39000.00, 5000, 'available', 'SUV', 'Blue', 'Tan', '2.5L Hybrid', 'CVT', 'AWD', 'Hybrid'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000012', '1N4BL4EV8PN123456', 'D45678', 2023, 'Nissan', 'Leaf', 'SV Plus', 38995.00, 41000.00, 35000.00, 12000, 'available', 'Hatchback', 'Red', 'Black', 'Electric', 'Single-Speed', 'FWD', 'Electric'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000012', '3VW5T7AJ8LM123456', 'E56789', 2024, 'Volkswagen', 'Atlas', 'Highline', 52995.00, 55000.00, 48000.00, 3000, 'available', 'SUV', 'Gray', 'Black', '3.6L V6', 'Automatic', 'AWD', 'Gasoline')
ON CONFLICT (id) DO NOTHING;

-- Create test leads
INSERT INTO public.leads (id, dealership_id, first_name, last_name, email, phone, source, status, score, preferred_contact, vehicle_interest)
VALUES 
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Sarah', 'Johnson', 'sarah.j@email.com', '416-555-9876', 'website', 'new', 85, 'email', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', 'Michael', 'Chen', 'mchen@email.com', '647-555-4321', 'chat', 'contacted', 72, 'phone', '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000012', 'Emily', 'Rodriguez', 'emily.r@email.com', '905-555-8765', 'phone', 'qualified', 90, 'sms', '10000000-0000-0000-0000-000000000004'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000012', 'David', 'Lee', 'dlee@email.com', '905-555-2468', 'referral', 'quoted', 88, 'email', '10000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

-- Create test interactions
INSERT INTO public.interactions (id, lead_id, type, direction, subject, body, ai_generated)
VALUES 
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'email', 'inbound', 'Interested in 2024 Honda Accord', 'Hi, I saw your listing for the 2024 Honda Accord Sport. Is it still available? I''d like to schedule a test drive.', false),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'email', 'outbound', 'Re: Interested in 2024 Honda Accord', 'Hi Sarah, thank you for your interest! The 2024 Accord Sport is still available. I''d be happy to schedule a test drive for you. What days work best this week?', true),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'chat', 'inbound', null, 'Do you have any RAV4 Hybrids in stock?', false),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'chat', 'outbound', null, 'Yes! We have a beautiful 2024 Toyota RAV4 Limited Hybrid in Blue. It has all the latest safety features and excellent fuel economy. Would you like to learn more?', true)
ON CONFLICT (id) DO NOTHING;

-- Create test consents
INSERT INTO public.consents (id, lead_id, type, status, jurisdiction, purpose, granted_at, channel)
VALUES 
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'marketing', 'granted', 'ca_on', 'Receive marketing communications', NOW(), 'web'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'sms', 'granted', 'ca_on', 'Receive SMS messages', NOW(), 'web'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'marketing', 'granted', 'ca_on', 'Receive marketing communications', NOW(), 'chat'),
  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'marketing', 'granted', 'ca_on', 'Receive marketing communications', NOW(), 'phone'),
  ('40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'phone', 'granted', 'ca_on', 'Receive phone calls', NOW(), 'phone')
ON CONFLICT (id) DO NOTHING;

-- Create test pricing tiers
INSERT INTO public.pricing_tiers (id, name, monthly_price, yearly_price, max_dealerships, max_users, included_leads, included_ai_messages, active)
VALUES 
  ('50000000-0000-0000-0000-000000000001', 'Starter', 299.00, 3000.00, 1, 5, 100, 500, true),
  ('50000000-0000-0000-0000-000000000002', 'Professional', 599.00, 6000.00, 3, 15, 500, 2000, true),
  ('50000000-0000-0000-0000-000000000003', 'Enterprise', 1299.00, 13000.00, 10, 50, 2000, 10000, true)
ON CONFLICT (id) DO NOTHING;

-- Create test usage counters (current month)
INSERT INTO public.usage_counters (id, organization_id, month, leads_created, quotes_generated, credit_apps_submitted, ai_messages_sent)
VALUES 
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE), 42, 28, 15, 387)
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE 'Organization: Demo Auto Group';
  RAISE NOTICE 'Dealerships: 2 (Downtown Motors, Highway Auto Sales)';
  RAISE NOTICE 'Vehicles: 5';
  RAISE NOTICE 'Leads: 4';
  RAISE NOTICE 'Interactions: 4';
  RAISE NOTICE 'Consents: 5';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: You must create a user via Supabase Auth UI first!';
  RAISE NOTICE 'Then update the profiles table with your auth user ID.';
END $$;
