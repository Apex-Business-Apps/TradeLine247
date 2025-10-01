-- Fix database function security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Add RLS policies for webhooks (CRITICAL - contains secrets)
CREATE POLICY "Org admins can manage webhooks"
ON public.webhooks
FOR ALL
USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'org_admin'::user_role));

-- Add RLS policies for user_roles
CREATE POLICY "Users can view roles in their org"
ON public.user_roles
FOR SELECT
USING (organization_id = get_user_organization(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Org admins can manage roles"
ON public.user_roles
FOR ALL
USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'org_admin'::user_role));

-- Add RLS policies for pricing_tiers (public read, admin write)
CREATE POLICY "Anyone can view active pricing tiers"
ON public.pricing_tiers
FOR SELECT
USING (active = true);

CREATE POLICY "Super admins can manage pricing tiers"
ON public.pricing_tiers
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::user_role));

-- Add RLS policies for usage_counters
CREATE POLICY "Users can view their org usage"
ON public.usage_counters
FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "System can update usage counters"
ON public.usage_counters
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add RLS policies for integrations
CREATE POLICY "Org admins can manage integrations"
ON public.integrations
FOR ALL
USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'org_admin'::user_role));

-- Add RLS policies for desking_sessions
CREATE POLICY "Users can view desking sessions in their dealerships"
ON public.desking_sessions
FOR SELECT
USING (dealership_id IN (
  SELECT id FROM public.dealerships 
  WHERE organization_id = get_user_organization(auth.uid())
));

CREATE POLICY "Users can create desking sessions"
ON public.desking_sessions
FOR INSERT
WITH CHECK (dealership_id IN (
  SELECT id FROM public.dealerships 
  WHERE organization_id = get_user_organization(auth.uid())
));

-- Add RLS policies for consents
CREATE POLICY "Users can view consents for their leads"
ON public.consents
FOR SELECT
USING (
  lead_id IN (
    SELECT id FROM public.leads 
    WHERE dealership_id IN (
      SELECT id FROM public.dealerships 
      WHERE organization_id = get_user_organization(auth.uid())
    )
  )
  OR profile_id = auth.uid()
);

CREATE POLICY "Users can create consents"
ON public.consents
FOR INSERT
WITH CHECK (
  lead_id IN (
    SELECT id FROM public.leads 
    WHERE dealership_id IN (
      SELECT id FROM public.dealerships 
      WHERE organization_id = get_user_organization(auth.uid())
    )
  )
  OR profile_id = auth.uid()
);