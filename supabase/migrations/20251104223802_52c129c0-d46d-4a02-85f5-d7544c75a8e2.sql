-- Fix Database Linter Warnings
-- 1. Create extensions schema
-- 2. Move extensions from public to extensions schema
-- 3. Ensure all SECURITY DEFINER functions have SET search_path

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move pgcrypto extension to extensions schema (if it exists in public)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
END $$;

-- Move vector extension to extensions schema (if it exists in public)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
  END IF;
END $$;

-- Move uuid-ossp extension to extensions schema (if it exists in public)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
  END IF;
END $$;

-- Fix any SECURITY DEFINER functions missing search_path
-- update_org_integration_secrets_updated_at
CREATE OR REPLACE FUNCTION public.update_org_integration_secrets_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- update_billing_updated_at
CREATE OR REPLACE FUNCTION public.update_billing_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- audit_appointments_pii_access
CREATE OR REPLACE FUNCTION public.audit_appointments_pii_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if accessing PII fields
  IF TG_OP = 'SELECT' THEN
    INSERT INTO public.data_access_audit (
      user_id,
      accessed_table,
      accessed_record_id,
      access_type
    ) VALUES (
      auth.uid(),
      'appointments',
      NEW.id::text,
      'pii_field_access'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- log_support_ticket_access
CREATE OR REPLACE FUNCTION public.log_support_ticket_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log for non-service-role access
  IF auth.role() != 'service_role' THEN
    INSERT INTO public.data_access_audit (
      user_id,
      accessed_table,
      accessed_record_id,
      access_type
    ) VALUES (
      auth.uid(),
      'support_tickets',
      NEW.id::text,
      'ticket_view_secure'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- cleanup_old_analytics_events
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_events()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete analytics events older than 90 days that contain potential PII
  DELETE FROM public.analytics_events 
  WHERE created_at < (NOW() - INTERVAL '90 days')
  AND (
    event_data ? 'email' OR 
    event_data ? 'phone' OR 
    event_data ? 'name' OR
    event_data ? 'user_id'
  );
  
  -- Log the cleanup operation
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    severity
  ) VALUES (
    'data_retention_cleanup',
    jsonb_build_object(
      'action', 'cleanup_analytics_events',
      'timestamp', NOW()
    ),
    'info'
  );
END;
$function$;

-- cleanup_old_ab_sessions
CREATE OR REPLACE FUNCTION public.cleanup_old_ab_sessions()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DELETE FROM public.ab_test_assignments
  WHERE created_at < NOW() - INTERVAL '90 days';
$function$;

-- share_org
CREATE OR REPLACE FUNCTION public.share_org(user_a uuid, user_b uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members ma
    JOIN organization_members mb ON mb.org_id = ma.org_id
    WHERE ma.user_id = user_a
      AND mb.user_id = user_b
  );
$function$;