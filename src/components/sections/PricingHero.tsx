import RoiCalculator from "@/components/RoiCalculator";
import { LeadCaptureCard } from "@/components/sections/LeadCaptureCard";
import officialLogo from '@/assets/official-logo.png';
export const PricingHero = () => {
  return <section className="relative py-20 bg-gradient-orange-subtle section-heavy overflow-hidden">
      <div className="container relative z-10">
        {/* Hero Content */}
        <div className="text-center mb-16">
          {/* Logo above hero text */}
          <div className="flex justify-center mb-8 min-h-[10.9375rem] md:min-h-[14.0625rem] items-center">
            <img src={officialLogo} alt="TradeLine 24/7 Logo" className="h-[8.75rem] md:h-[11.25rem] w-auto opacity-80" style={{ transform: 'translateY(-0.5cm) scale(1.45) scaleY(1.3225) scaleX(1.3225)' }} />
          </div>
          
          <h1 id="hero-h1" className="text-4xl md:text-6xl mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent font-extrabold lg:text-7xl">
            Your 24/7 Ai Receptionist!
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto font-semibold text-foreground md:text-4xl">
            Never miss a call. Work while you sleep.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mb-2 mt-[63px] text-center my-0 py-0 md:text-4xl">
            Help us help you
          </h2>
          
          {/* Two-column layout for calculator and questionnaire */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 items-stretch max-w-7xl mx-auto mt-[120px]">
            <div className="flex justify-center">
              <RoiCalculator />
            </div>
            <div className="flex justify-center">
              <LeadCaptureCard compact />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" aria-hidden="true"></div>
    </section>;
};
