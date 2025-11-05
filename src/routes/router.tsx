import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import LayoutShell from "@/layout/LayoutShell";
import { paths } from "@/routes/paths";

const Index = lazy(() => import("@/pages/Index"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Features = lazy(() => import("@/pages/Features"));
const Compare = lazy(() => import("@/pages/Compare"));
const Security = lazy(() => import("@/pages/Security"));
const Contact = lazy(() => import("@/pages/Contact"));
const Auth = lazy(() => import("@/pages/Auth"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const Calls = lazy(() => import("@/pages/Calls"));
const CallLogs = lazy(() => import("@/pages/CallLogs"));
const AddNumber = lazy(() => import("@/pages/AddNumber"));
const VoiceSettings = lazy(() => import("@/pages/ops/VoiceSettings"));
const TeamInvite = lazy(() => import("@/pages/TeamInvite"));
const Integrations = lazy(() => import("@/pages/Integrations"));
const PhoneApps = lazy(() => import("@/pages/PhoneApps"));
const ForwardingWizard = lazy(() => import("@/routes/ForwardingWizard"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const CallCenterLegacy = lazy(() => import("@/pages/CallCenter"));
const NumbersLegacy = lazy(() => import("@/pages/ops/ClientNumberOnboarding"));

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<div className="p-8">Loading…</div>}>
    <Component />
  </Suspense>
);

const routeComponents = [
  { path: paths.home, Component: Index },
  { path: paths.pricing, Component: Pricing },
  { path: paths.faq, Component: FAQ },
  { path: paths.features, Component: Features },
  { path: paths.compare, Component: Compare },
  { path: paths.security, Component: Security },
  { path: paths.contact, Component: Contact },
  { path: paths.auth, Component: Auth },
  { path: paths.dashboard, Component: ClientDashboard },
  { path: paths.calls, Component: Calls },
  { path: paths.callCenterLegacy, Component: CallCenterLegacy },
  { path: paths.callLogs, Component: CallLogs },
  { path: paths.addNumber, Component: AddNumber },
  { path: paths.numbersLegacy, Component: NumbersLegacy },
  { path: paths.voiceSettings, Component: VoiceSettings },
  { path: paths.teamInvite, Component: TeamInvite },
  { path: paths.integrations, Component: Integrations },
  { path: paths.phoneApps, Component: PhoneApps },
  { path: paths.forwardingWizard, Component: ForwardingWizard },
  { path: paths.notFound, Component: NotFound },
] as const;

export const appRoutePaths = new Set(routeComponents.map(({ path }) => path));

export const router = createBrowserRouter([
  {
    path: paths.home,
    element: <LayoutShell />,
    children: [
      { index: true, element: withSuspense(Index) },
      ...routeComponents.map(({ path, Component }) => ({
        path,
        element: withSuspense(Component),
      })),
    ],
  },
]);
