-- Fix remaining extension in public schema warning
-- Ensure all vector-related objects are in extensions schema

-- Move any remaining extensions to extensions schema
DO $$
DECLARE
  ext_record RECORD;
BEGIN
  FOR ext_record IN 
    SELECT extname 
    FROM pg_extension 
    WHERE extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND extname NOT IN ('plpgsql')  -- Don't move plpgsql
  LOOP
    EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_record.extname);
    RAISE NOTICE 'Moved extension % to extensions schema', ext_record.extname;
  END LOOP;
END $$;

-- Update search paths to include extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Ensure grants are correct
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;