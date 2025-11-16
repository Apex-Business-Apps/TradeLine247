import { Link } from "react-router-dom";
import RoiCalculator from "@/components/RoiCalculator";
import { AISEOHead } from "@/components/seo/AISEOHead";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";

const MissedCallsCalculator = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AISEOHead
        title="Missed Calls ROI Calculator | TradeLine 24/7"
        description="Estimate how much revenue you lose to missed calls. TradeLine 24/7 recovers jobs with an AI receptionist that answers 24/7."
        canonical="https://tradeline247ai.com/missed-calls-calculator"
        directAnswer="Use this calculator to see the appointments and revenue TradeLine 24/7 can recover by answering every call."
        keyFacts={[
          { label: "Average capture", value: "30-45% more booked jobs" },
          { label: "Languages", value: "55+ supported" },
        ]}
        faqs={[
          {
            question: "How do I use the missed calls calculator?",
            answer:
              "Adjust the sliders to match your monthly calls, answer rate, conversion, and appointment value. The calculator shows recovered revenue and the best plan for your business.",
          },
          {
            question: "Does TradeLine 24/7 handle after-hours calls?",
            answer:
              "Yes. Our AI receptionist answers immediately 24/7, qualifies callers in 55+ languages, and books jobs into your calendar.",
          },
        ]}
      />

      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl space-y-10 text-center">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-wide text-success">Missed calls calculator</p>
            <h1 className="text-4xl font-bold tracking-tight">See what missed calls are costing you</h1>
            <p className="text-lg text-muted-foreground">
              Every un-answered call is a job someone else books. Estimate your lost revenue and choose the TradeLine plan that
              keeps you covered 24/7.
            </p>
          </div>

          <div className="text-left">
            <RoiCalculator />
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link to={`${paths.auth}?plan=default`}>Start free 7-day trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={paths.pricing}>Compare plans</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MissedCallsCalculator;
