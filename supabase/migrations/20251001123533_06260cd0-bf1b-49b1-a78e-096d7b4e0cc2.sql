-- Add missing RLS policies for credit_applications table
-- These policies ensure users can only access credit applications within their organization

-- Allow users to INSERT credit applications for leads in their dealerships
CREATE POLICY "Users can create credit apps in their dealerships"
ON public.credit_applications
FOR INSERT
TO authenticated
WITH CHECK (
  dealership_id IN (
    SELECT id FROM public.dealerships
    WHERE organization_id = get_user_organization(auth.uid())
  )
);

-- Allow users to UPDATE credit applications in their dealerships
CREATE POLICY "Users can update credit apps in their dealerships"
ON public.credit_applications
FOR UPDATE
TO authenticated
USING (
  dealership_id IN (
    SELECT id FROM public.dealerships
    WHERE organization_id = get_user_organization(auth.uid())
  )
)
WITH CHECK (
  dealership_id IN (
    SELECT id FROM public.dealerships
    WHERE organization_id = get_user_organization(auth.uid())
  )
);

-- Allow org admins to DELETE credit applications in their organization
-- Regular users should not be able to delete credit apps due to compliance requirements
CREATE POLICY "Org admins can delete credit apps in their dealerships"
ON public.credit_applications
FOR DELETE
TO authenticated
USING (
  dealership_id IN (
    SELECT id FROM public.dealerships
    WHERE organization_id = get_user_organization(auth.uid())
  )
  AND has_role(auth.uid(), 'org_admin'::user_role)
);