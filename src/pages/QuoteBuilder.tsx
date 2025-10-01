import { AppLayout } from '@/components/Layout/AppLayout';
import { QuoteCalculator } from '@/components/Quote/QuoteCalculator';

export default function QuoteBuilder() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quote Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create professional quotes with accurate Canadian tax calculations
          </p>
        </div>

        <QuoteCalculator />
      </div>
    </AppLayout>
  );
}
