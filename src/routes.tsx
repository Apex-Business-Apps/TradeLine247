import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import LayoutShell from "./layout/LayoutShell";
import Index from "./pages/Index";
import { paths } from "./routes/paths";

const Pricing = lazy(() => import("./pages/Pricing").catch(() => ({ default: () => <h1>Pricing</h1> })));
const FAQ = lazy(() => import("./pages/FAQ").catch(() => ({ default: () => <h1>FAQ</h1> })));
const Features = lazy(() => import("./pages/Features").catch(() => ({ default: () => <h1>Features</h1> })));
const Compare = lazy(() => import("./pages/Compare").catch(() => ({ default: () => <h1>Compare</h1> })));
const Security = lazy(() => import("./pages/Security").catch(() => ({ default: () => <h1>Security</h1> })));
const Contact = lazy(() => import("./pages/Contact").catch(() => ({ default: () => <h1>Contact</h1> })));
const Auth = lazy(() => import("./pages/Auth").catch(() => ({ default: () => <h1>Auth</h1> })));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard").catch(() => ({ default: () => <h1>Dashboard</h1> })));
const CallCenter = lazy(() => import("./pages/CallCenter").catch(() => ({ default: () => <h1>Calls</h1> })));
const CallLogs = lazy(() => import("./pages/CallLogs").catch(() => ({ default: () => <h1>Call Logs</h1> })));
const Integrations = lazy(() => import("./pages/Integrations").catch(() => ({ default: () => <h1>Integrations</h1> })));
const ClientNumberOnboarding = lazy(() => import("./pages/ops/ClientNumberOnboarding").catch(() => ({ default: () => <h1>Add Number</h1> })));
const VoiceSettings = lazy(() => import("./pages/ops/VoiceSettings").catch(() => ({ default: () => <h1>Voice Settings</h1> })));
const TeamInvite = lazy(() => import("./pages/TeamInvite").catch(() => ({ default: () => <h1>Invite Staff</h1> })));
const PhoneApps = lazy(() => import("./pages/PhoneApps").catch(() => ({ default: () => <h1>Phone Apps</h1> })));
const ForwardingWizard = lazy(() => import("./routes/ForwardingWizard").catch(() => ({ default: () => <h1>Forwarding Wizard</h1> })));
const NotFound = lazy(() => import("./pages/NotFound").catch(() => ({ default: () => <h1>Not Found</h1> })));

const Fallback = ({ text = "Loading…" }: { text?: string }) => (
  <div className="p-8" role="status">{text}</div>
);

const fallbackElement = <Fallback />;

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={fallbackElement}>{node}</Suspense>
);

type RouteEntry = {
  path: string;
  element: React.ReactNode;
  suspense?: boolean;
  index?: boolean;
};

const routeEntries: RouteEntry[] = [
  { path: paths.home, element: <Index />, index: true },
  { path: paths.pricing, element: <Pricing />, suspense: true },
  { path: paths.faq, element: <FAQ />, suspense: true },
  { path: paths.features, element: <Features />, suspense: true },
  { path: paths.compare, element: <Compare />, suspense: true },
  { path: paths.security, element: <Security />, suspense: true },
  { path: paths.contact, element: <Contact />, suspense: true },
  { path: paths.auth, element: <Auth />, suspense: true },
  { path: paths.dashboard, element: <ClientDashboard />, suspense: true },
  { path: paths.calls, element: <CallCenter />, suspense: true },
  { path: paths.callCenterLegacy, element: <CallCenter />, suspense: true },
  { path: paths.callLogs, element: <CallLogs />, suspense: true },
  { path: paths.addNumber, element: <ClientNumberOnboarding />, suspense: true },
  { path: paths.numbersLegacy, element: <ClientNumberOnboarding />, suspense: true },
  { path: paths.teamInvite, element: <TeamInvite />, suspense: true },
  { path: paths.integrations, element: <Integrations />, suspense: true },
  { path: paths.phoneApps, element: <PhoneApps />, suspense: true },
  { path: paths.voiceSettings, element: <VoiceSettings />, suspense: true },
  { path: paths.forwardingWizard, element: <ForwardingWizard />, suspense: true },
  { path: paths.notFound, element: <NotFound />, suspense: true },
];

export const appRoutePaths = new Set<string>(routeEntries.map(({ path }) => path));

export const router = createBrowserRouter([
  {
    path: paths.home,
    element: <LayoutShell />,
    children: routeEntries.map(({ path, element, suspense, index }) => ({
      ...(index ? { index: true } : { path }),
      element: suspense ? withSuspense(element) : element,
    })),
  },
]);
