export const paths = {
  home: "/",
  pricing: "/pricing",
  faq: "/faq",
  features: "/features",
  compare: "/compare",
  security: "/security",
  contact: "/contact",
  auth: "/auth",
  dashboard: "/dashboard",
  calls: "/calls",
  callCenterLegacy: "/call-center",
  callLogs: "/call-logs",
  addNumber: "/numbers/new",
  numbersLegacy: "/ops/number-onboarding",
  phoneApps: "/phone-apps",
  teamInvite: "/team/invite",
  integrations: "/integrations",
  forwardingWizard: "/ops/forwarding",
  voiceSettings: "/ops/voice",
  notFound: "*",
} as const;

export type AppPathKey = keyof typeof paths;
export const appPathValues = new Set<string>(Object.values(paths));
