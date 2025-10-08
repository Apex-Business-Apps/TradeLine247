/**
 * Entitlement Management
 * 
 * Handles feature access control based on organization subscription tier
 */

import { supabase } from '@/integrations/supabase/client';

export type FeatureName = 
  | 'analytics'
  | 'advanced_reporting'
  | 'unlimited_users'
  | 'white_label'
  | 'api_access'
  | 'custom_integrations';

interface PricingTier {
  id: string;
  name: string;
  features: Record<string, boolean>;
}

/**
 * Check if organization has access to a specific feature
 */
export async function checkEntitlement(
  organizationId: string,
  feature: FeatureName
): Promise<boolean> {
  try {
    // Get organization's pricing tier
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('Failed to fetch organization:', orgError);
      return false;
    }

    // For now, return false for analytics until pricing tiers are implemented
    // This will be connected to the pricing_tiers table once subscription management is added
    if (feature === 'analytics') {
      return false; // Analytics requires paid tier
    }

    // Default features available to all tiers
    const defaultFeatures: FeatureName[] = [];
    
    return defaultFeatures.includes(feature);
  } catch (error) {
    console.error('Error checking entitlement:', error);
    return false;
  }
}

/**
 * Get all features available to an organization
 */
export async function getOrganizationFeatures(
  organizationId: string
): Promise<FeatureName[]> {
  const features: FeatureName[] = [];
  
  // Check each feature
  const allFeatures: FeatureName[] = [
    'analytics',
    'advanced_reporting',
    'unlimited_users',
    'white_label',
    'api_access',
    'custom_integrations',
  ];

  for (const feature of allFeatures) {
    const hasAccess = await checkEntitlement(organizationId, feature);
    if (hasAccess) {
      features.push(feature);
    }
  }

  return features;
}

/**
 * Hook to check feature entitlement in React components
 */
export function useEntitlement() {
  const checkFeature = async (feature: FeatureName): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) return false;

    return checkEntitlement(profile.organization_id, feature);
  };

  return { checkFeature };
}
