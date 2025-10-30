export default function Pricing() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Pricing</h1>
      <p className="text-muted-foreground mb-10">Simple plans. Cancel anytime.</p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Personal</h2>
          <p className="mb-4">$0 / mo</p>
          <a href="/auth?plan=personal" className="inline-block bg-orange-500 text-white rounded px-4 py-2">
            Start free trial
          </a>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Plus</h2>
          <p className="mb-4">$49 / mo</p>
          <a href="/auth?plan=plus" className="inline-block bg-orange-500 text-white rounded px-4 py-2">
            Start free trial
          </a>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Commission</h2>
          <p className="mb-4">Pay-per-job</p>
          <a href="/auth?plan=commission" className="inline-block bg-orange-500 text-white rounded px-4 py-2">
            Start free trial
          </a>
        </div>
      </div>
    </section>
  );
}
