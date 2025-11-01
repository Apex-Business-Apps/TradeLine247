export default function AuthLanding() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Start Free Trial</h1>
      <p className="mb-6">Choose a plan to get started. No credit card required.</p>
      {/* If you already have a real trial/signup component, render it here instead. */}
      <form className="grid gap-4 max-w-lg">
        <input className="border rounded px-4 py-3" placeholder="Business name" />
        <input className="border rounded px-4 py-3" placeholder="Email" type="email" />
        <button className="bg-orange-500 text-white rounded px-5 py-3 font-semibold">
          Start my 14-day trial
        </button>
      </form>
    </section>
  );
}
