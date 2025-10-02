import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Users, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ROICalculator = () => {
  const [leadsPerMonth, setLeadsPerMonth] = useState(100);
  const [avgDealValue, setAvgDealValue] = useState(35000);
  const [currentCloseRate, setCurrentCloseRate] = useState(15);
  const [timePerLead, setTimePerLead] = useState(45);

  // Calculate ROI metrics
  const improvedCloseRate = currentCloseRate * 1.3; // 30% improvement
  const timeSaved = timePerLead * 0.7; // 70% time reduction
  const additionalDeals = (leadsPerMonth * (improvedCloseRate - currentCloseRate)) / 100;
  const additionalRevenue = additionalDeals * avgDealValue;
  const annualRevenue = additionalRevenue * 12;
  const timeSavedHours = ((leadsPerMonth * timeSaved) / 60);
  const timeSavedValue = timeSavedHours * 75; // $75/hour value

  const totalMonthlyValue = additionalRevenue + timeSavedValue;
  const totalAnnualValue = annualRevenue + (timeSavedValue * 12);
  const monthlyPlanCost = 149;
  const roi = ((totalAnnualValue - (monthlyPlanCost * 12)) / (monthlyPlanCost * 12)) * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto border-2 border-primary/20 shadow-2xl bg-card">
      <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-3xl sm:text-4xl font-bold">ROI Calculator</CardTitle>
        <CardDescription className="text-lg">
          See how much AutoRepAi can increase your dealership revenue
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 sm:p-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Your Current Metrics
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="leads" className="text-sm font-medium">
                Monthly Leads
              </Label>
              <Input
                id="leads"
                type="number"
                value={leadsPerMonth}
                onChange={(e) => setLeadsPerMonth(Number(e.target.value))}
                className="text-lg"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dealValue" className="text-sm font-medium">
                Average Deal Value ($)
              </Label>
              <Input
                id="dealValue"
                type="number"
                value={avgDealValue}
                onChange={(e) => setAvgDealValue(Number(e.target.value))}
                className="text-lg"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closeRate" className="text-sm font-medium">
                Current Close Rate (%)
              </Label>
              <Input
                id="closeRate"
                type="number"
                value={currentCloseRate}
                onChange={(e) => setCurrentCloseRate(Number(e.target.value))}
                className="text-lg"
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timePerLead" className="text-sm font-medium">
                Minutes Per Lead
              </Label>
              <Input
                id="timePerLead"
                type="number"
                value={timePerLead}
                onChange={(e) => setTimePerLead(Number(e.target.value))}
                className="text-lg"
                min="0"
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Your Potential Results
            </h3>

            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Additional Monthly Revenue</p>
                  <p className="text-3xl font-bold text-primary">
                    ${totalMonthlyValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Additional Deals/Month</p>
                  <p className="text-2xl font-semibold">
                    {additionalDeals.toFixed(1)} deals
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Time Saved Per Month
                  </p>
                  <p className="text-2xl font-semibold">
                    {timeSavedHours.toFixed(0)} hours
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Annual Revenue Increase</p>
                  <p className="text-4xl font-bold text-primary">
                    ${annualRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="pt-4 border-t-2 border-primary/30">
                  <p className="text-sm text-muted-foreground mb-1">Return on Investment</p>
                  <p className="text-5xl font-extrabold text-primary">
                    {roi.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on Professional plan at ${monthlyPlanCost}/month
                  </p>
                </div>
              </div>
            </div>

            <Button asChild size="lg" className="w-full text-lg py-6">
              <Link to="/auth">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              No credit card required • 50 leads free forever
            </p>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-8 pt-8 border-t border-border grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{currentCloseRate}% → {improvedCloseRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Close Rate Improvement</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{timePerLead}m → {(timePerLead - timeSaved).toFixed(0)}m</p>
            <p className="text-xs text-muted-foreground mt-1">Time Per Lead</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{additionalDeals.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Extra Deals/Month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
