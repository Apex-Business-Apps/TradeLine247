import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  calculateQuote,
  calculateFinancePayment,
  formatCurrency,
  formatPercent,
  PROVINCIAL_TAX_RATES,
  type Province,
  type QuoteCalculation,
  type FinanceCalculation,
} from '@/lib/taxCalculator';
import { FileDown, Languages } from 'lucide-react';
import { toast } from 'sonner';

export function QuoteCalculator() {
  const [vehiclePrice, setVehiclePrice] = useState('35000');
  const [tradeInValue, setTradeInValue] = useState('0');
  const [tradeInPayoff, setTradeInPayoff] = useState('0');
  const [downPayment, setDownPayment] = useState('0');
  const [dealerFees, setDealerFees] = useState('695');
  const [incentives, setIncentives] = useState('0');
  const [addons, setAddons] = useState('0');
  const [province, setProvince] = useState<Province>('ON');
  const [financeTerm, setFinanceTerm] = useState('60');
  const [financeRate, setFinanceRate] = useState('5.99');
  const [pdfLanguage, setPdfLanguage] = useState<'en' | 'fr'>('en');

  const quote = calculateQuote({
    vehiclePrice: parseFloat(vehiclePrice) || 0,
    tradeInValue: parseFloat(tradeInValue) || 0,
    tradeInPayoff: parseFloat(tradeInPayoff) || 0,
    downPayment: parseFloat(downPayment) || 0,
    dealerFees: parseFloat(dealerFees) || 0,
    incentives: parseFloat(incentives) || 0,
    addons: parseFloat(addons) || 0,
    province,
  });

  const finance = calculateFinancePayment({
    quote,
    financeTerm: parseInt(financeTerm) || 60,
    financeRate: parseFloat(financeRate) || 0,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehiclePrice">Vehicle Price</Label>
            <Input
              id="vehiclePrice"
              type="number"
              value={vehiclePrice}
              onChange={(e) => setVehiclePrice(e.target.value)}
              placeholder="35000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <Select value={province} onValueChange={(v) => setProvince(v as Province)}>
              <SelectTrigger id="province">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVINCIAL_TAX_RATES).map(([code, data]) => (
                  <SelectItem key={code} value={code}>
                    {data.name} ({formatPercent(data.total * 100)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tradeInValue">Trade-In Value</Label>
              <Input
                id="tradeInValue"
                type="number"
                value={tradeInValue}
                onChange={(e) => setTradeInValue(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeInPayoff">Trade-In Payoff</Label>
              <Input
                id="tradeInPayoff"
                type="number"
                value={tradeInPayoff}
                onChange={(e) => setTradeInPayoff(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="downPayment">Down Payment</Label>
            <Input
              id="downPayment"
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dealerFees">Dealer Fees</Label>
              <Input
                id="dealerFees"
                type="number"
                value={dealerFees}
                onChange={(e) => setDealerFees(e.target.value)}
                placeholder="695"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incentives">Incentives</Label>
              <Input
                id="incentives"
                type="number"
                value={incentives}
                onChange={(e) => setIncentives(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addons">Add-ons</Label>
              <Input
                id="addons"
                type="number"
                value={addons}
                onChange={(e) => setAddons(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4">Financing</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="financeTerm">Term (months)</Label>
                <Input
                  id="financeTerm"
                  type="number"
                  value={financeTerm}
                  onChange={(e) => setFinanceTerm(e.target.value)}
                  placeholder="60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="financeRate">Rate (%)</Label>
                <Input
                  id="financeRate"
                  type="number"
                  step="0.01"
                  value={financeRate}
                  onChange={(e) => setFinanceRate(e.target.value)}
                  placeholder="5.99"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Vehicle Price</span>
              <span className="font-medium">{formatCurrency(quote.vehiclePrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Dealer Fees</span>
              <span className="font-medium">{formatCurrency(quote.dealerFees)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Add-ons</span>
              <span className="font-medium">{formatCurrency(quote.addons)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Incentives</span>
              <span className="font-medium">-{formatCurrency(quote.incentives)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
            </div>
          </div>

          <div className="border-t pt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Trade-In Value</span>
              <span className="font-medium">{formatCurrency(quote.tradeInValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Trade-In Payoff</span>
              <span className="font-medium">-{formatCurrency(quote.tradeInPayoff)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-green-600">
              <span>Net Trade-In</span>
              <span>{formatCurrency(quote.netTradeIn)}</span>
            </div>
          </div>

          <div className="border-t pt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Taxable Amount</span>
              <span className="font-medium">{formatCurrency(quote.taxableAmount)}</span>
            </div>
            {quote.gst > 0 && (
              <div className="flex justify-between text-sm">
                <span>GST ({formatPercent(PROVINCIAL_TAX_RATES[province].gst * 100)})</span>
                <span className="font-medium">{formatCurrency(quote.gst)}</span>
              </div>
            )}
            {quote.pst > 0 && (
              <div className="flex justify-between text-sm">
                <span>PST ({formatPercent(PROVINCIAL_TAX_RATES[province].pst * 100)})</span>
                <span className="font-medium">{formatCurrency(quote.pst)}</span>
              </div>
            )}
            {quote.hst > 0 && (
              <div className="flex justify-between text-sm">
                <span>HST ({formatPercent(PROVINCIAL_TAX_RATES[province].hst * 100)})</span>
                <span className="font-medium">{formatCurrency(quote.hst)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Taxes</span>
              <span>{formatCurrency(quote.totalTaxes)}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Price</span>
              <span className="text-primary">{formatCurrency(quote.totalPrice)}</span>
            </div>
          </div>

          <div className="border-t pt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Down Payment</span>
              <span className="font-medium">-{formatCurrency(quote.downPayment)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Net Trade-In</span>
              <span className="font-medium">-{formatCurrency(quote.netTradeIn)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Amount to Finance</span>
              <span>{formatCurrency(quote.amountToFinance)}</span>
            </div>
          </div>

          <div className="border-t pt-4 bg-primary/5 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                {financeTerm} months @ {formatPercent(parseFloat(financeRate))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Monthly Payment</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(finance.paymentAmount)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Total Interest</span>
              <span>{formatCurrency(finance.totalInterest)}</span>
            </div>
          </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={() => {
                    // TODO: Save to database
                    toast.success('Quote saved successfully');
                  }}
                >
                  Save Quote
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const pdfData = {
                      quoteNumber: `Q-${Date.now()}`,
                      date: new Date().toLocaleDateString(),
                      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                      dealership: {
                        name: 'AutoRepAi Demo Dealer',
                        address: '123 Main St, City, Province',
                        phone: '(555) 123-4567',
                        email: 'sales@dealer.com',
                      },
                      customer: {
                        name: 'Customer Name',
                      },
                      vehicle: {
                        year: 2024,
                        make: 'Make',
                        model: 'Model',
                      },
                      quote,
                      finance,
                    };
                    // Lazy load PDF generator (543 kB) only when user clicks download
                    import('./QuotePDFGenerator').then(async ({ downloadQuotePDF }) => {
                      await downloadQuotePDF(pdfData, pdfLanguage);
                      toast.success(`PDF downloaded in ${pdfLanguage === 'en' ? 'English' : 'French'}`);
                    }).catch((error) => {
                      console.error('Failed to load PDF generator:', error);
                      toast.error('Failed to generate PDF. Please try again.');
                    });
                  }}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF ({pdfLanguage.toUpperCase()})
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setPdfLanguage(pdfLanguage === 'en' ? 'fr' : 'en')}
                >
                  <Languages className="h-4 w-4" />
                </Button>
              </div>
        </CardContent>
      </Card>
    </div>
  );
}
