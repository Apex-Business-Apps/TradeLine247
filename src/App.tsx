import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header><nav className="container py-3">
        <Link to="/">Home</Link> <Link to="/pricing">Pricing</Link> <Link to="/features">Features</Link>
        <Link to="/compare">Compare</Link> <Link to="/security">Security</Link> <Link to="/faq">FAQ</Link> <Link to="/contact">Contact</Link>
      </nav></header>
      <main id="main">{children}</main>
      <footer className="container py-6"><Link to="/privacy">Privacy</Link></footer>
    </>
  );
}

function Home() {
  return (
    <section id="app-home" className="container py-10">
      <h1>TradeLine 24/7 — Never miss a call</h1>
      <div className="space-x-3 my-6">
        <button className="btn-primary">Start Free Trial</button>
        <Link to="/auth">Start Zero-Monthly</Link>
        <Link to="/auth">Choose Predictable</Link>
      </div>
      <div className="space-x-3 my-4">
        <Link to="/calls" className="btn-outline" data-testid="quick-action-view-calls">View Calls</Link>
        <Link to="/numbers/new" className="btn-outline" data-testid="quick-action-add-number">Add Number</Link>
        <Link to="/team/invite" className="btn-outline" data-testid="quick-action-invite-staff">Invite Team</Link>
        <Link to="/integrations" className="btn-outline" data-testid="quick-action-integrations">Integrations</Link>
      </div>
    </section>
  );
}

const Page = ({ title }: { title: string }) => <section className="container py-10"><h1>{title}</h1></section>;

function Privacy() {
  return (
    <section className="container py-10">
      <h1>Privacy Policy</h1>
      <article id="call-recording"><h2>Call Recording</h2>
        <p>Calls may be recorded for quality and training. Opt-out and retention details provided.</p>
      </article>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Page title="Pricing" />} />
          <Route path="/features" element={<Page title="Features" />} />
          <Route path="/compare" element={<Page title="Compare" />} />
          <Route path="/security" element={<Page title="Security" />} />
          <Route path="/faq" element={<Page title="FAQ" />} />
          <Route path="/contact" element={<Page title="Contact" />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/auth" element={<Page title="Sign Up" />} />
          <Route path="/calls" element={<Page title="Calls" />} />
          <Route path="/numbers/new" element={<Page title="Add Number" />} />
          <Route path="/team/invite" element={<Page title="Invite Team" />} />
          <Route path="/integrations" element={<Page title="Integrations" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
