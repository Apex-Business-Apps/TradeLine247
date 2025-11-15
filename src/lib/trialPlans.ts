export type PlanId = "default" | "core" | "commission" | "plus";

export interface PlanDetails {
  id: PlanId;
  label: string;
  subtitle: string;
  highlights: string[];
  badge?: string;
  notes: string;
  leadSource: string;
  companyLabel: string;
}

export const PLAN_LIBRARY: Record<PlanId, PlanDetails> = {
  default: {
    id: "default",
    label: "Plus Trial",
    subtitle: "Full AI receptionist coverage with 24/7 answering",
    highlights: [
      "One-click onboarding · hosted in Canada",
      "Includes 300 answered minutes during trial",
      "55+ languages with SOC 2 posture",
    ],
    badge: "Most popular",
    notes: "You can change plans anytime after onboarding.",
    leadSource: "fast_trust_plus",
    companyLabel: "Plus Trial",
  },
  core: {
    id: "core",
    label: "Predictable Plan Trial",
    subtitle: "$69 setup + $249/month after your free trial",
    highlights: [
      "Unlimited answered minutes with fair usage",
      "Human failover & CRM pushes optional",
      "Perfect for steady call volume",
    ],
    badge: "Flat pricing",
    notes: "We’ll confirm payment details after your trial ends.",
    leadSource: "fast_trust_predictable",
    companyLabel: "Predictable Plan",
  },
  commission: {
    id: "commission",
    label: "Zero-Monthly Trial",
    subtitle: "Pay only when we book a qualified job",
    highlights: [
      "$149 one-time setup then pay per booking",
      "Perfect for seasonal or variable volume",
      "Auto-transcripts for every conversation",
    ],
    badge: "No monthly fee",
    notes: "We’ll send a wallet link after activation so you can fund jobs as they close.",
    leadSource: "fast_trust_commission",
    companyLabel: "Zero Monthly",
  },
  plus: {
    id: "plus",
    label: "Plus Trial",
    subtitle: "Full AI receptionist coverage with 24/7 answering",
    highlights: [
      "Hosted and supported in Canada",
      "Call summaries delivered instantly",
      "Built for trades, clinics & solo operators",
    ],
    badge: "Recommended",
    notes: "Plus is ideal for growing teams that need predictable staffing.",
    leadSource: "fast_trust_plus",
    companyLabel: "Plus Trial",
  },
};

export const getPlanDetails = (plan: string | null | undefined): PlanDetails => {
  const normalized = (plan?.toLowerCase() ?? "default") as PlanId;
  return PLAN_LIBRARY[normalized] ?? PLAN_LIBRARY.default;
};
