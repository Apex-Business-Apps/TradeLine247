/**
 * Unit Tests: Canadian Tax Calculator
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateProvincialTaxes, 
  calculateFinancePayment, 
  calculateQuote 
} from '../../src/lib/taxCalculator';

describe('calculateProvincialTaxes', () => {
  it('should calculate Ontario HST (13%) correctly', () => {
    const result = calculateProvincialTaxes(30000, 'ON');
    expect(result.gst).toBe(0);
    expect(result.pst).toBe(0);
    expect(result.hst).toBe(3900);
    expect(result.total).toBe(3900);
  });

  it('should calculate BC taxes (GST 5% + PST 7%) correctly', () => {
    const result = calculateProvincialTaxes(40000, 'BC');
    expect(result.gst).toBe(2000);
    expect(result.pst).toBeCloseTo(2800, 2); // Use toBeCloseTo for floating point
    expect(result.hst).toBe(0);
    expect(result.total).toBeCloseTo(4800, 2);
  });

  it('should calculate Alberta GST only (5%) correctly', () => {
    const result = calculateProvincialTaxes(50000, 'AB');
    expect(result.gst).toBe(2500);
    expect(result.pst).toBe(0);
    expect(result.hst).toBe(0);
    expect(result.total).toBe(2500);
  });

  it('should handle Quebec QST (9.975%) + GST (5%)', () => {
    const result = calculateProvincialTaxes(25000, 'QC');
    expect(result.gst).toBe(1250);
    expect(result.qst).toBe(2493.75);
    expect(result.total).toBeCloseTo(3743.75, 2);
  });

  it('should default to 0% for unknown province', () => {
    const result = calculateProvincialTaxes(30000, 'XX' as any);
    expect(result.total).toBe(0);
  });
});

describe('calculateFinancePayment', () => {
  it('should calculate monthly payment correctly', () => {
    const principal = 20000;
    const annualRate = 6.99;
    const termMonths = 60;

    const payment = calculateFinancePayment(principal, annualRate, termMonths);

    // Expected: ~$395/month (approximate)
    expect(payment).toBeGreaterThan(390);
    expect(payment).toBeLessThan(400);
  });

  it('should handle 0% interest rate', () => {
    const principal = 24000;
    const annualRate = 0;
    const termMonths = 48;

    const payment = calculateFinancePayment(principal, annualRate, termMonths);

    // Simple division: 24000 / 48 = 500
    expect(payment).toBe(500);
  });

  it('should handle short term (12 months)', () => {
    const principal = 12000;
    const annualRate = 4.99;
    const termMonths = 12;

    const payment = calculateFinancePayment(principal, annualRate, termMonths);

    expect(payment).toBeGreaterThan(1000);
    expect(payment).toBeLessThan(1050);
  });
});

describe('calculateQuote', () => {
  it('should calculate complete quote with all components', () => {
    const params = {
      vehiclePrice: 35000,
      downPayment: 7000,
      tradeInValue: 5000,
      province: 'ON' as const,
      dealerFees: 500,
      incentives: 1000
    };

    const quote = calculateQuote(params);

    // Subtotal: vehiclePrice + dealerFees - incentives = 35000 + 500 - 1000 = 34500
    expect(quote.subtotal).toBe(34500);

    // Taxable amount: subtotal - netTradeIn = 34500 - 5000 = 29500
    // HST: 29500 * 0.13 = 3835
    expect(quote.totalTaxes).toBe(3835);

    // Total: subtotal + totalTaxes = 34500 + 3835 = 38335
    expect(quote.totalPrice).toBe(38335);

    // Amount to finance: totalPrice - downPayment - netTradeIn
    // = 38335 - 7000 - 5000 = 26335
    expect(quote.amountToFinance).toBe(26335);
  });

  it('should handle purchase without trade-in', () => {
    const params = {
      vehiclePrice: 25000,
      province: 'BC' as const,
    };

    const quote = calculateQuote(params);

    // Subtotal: 25000
    expect(quote.subtotal).toBe(25000);

    // BC taxes: GST 5% + PST 7% = 12%
    // Total taxes: 25000 * 0.12 = 3000
    expect(quote.totalTaxes).toBe(3000);

    // Total price: 25000 + 3000 = 28000
    expect(quote.totalPrice).toBe(28000);
  });

  it('should apply incentives correctly', () => {
    const withoutIncentive = calculateQuote({
      vehiclePrice: 30000,
      province: 'AB' as const
    });

    const withIncentive = calculateQuote({
      vehiclePrice: 30000,
      province: 'AB' as const,
      incentives: 2000
    });

    // Incentives reduce the subtotal
    expect(withIncentive.subtotal).toBe(withoutIncentive.subtotal - 2000);
  });

  it('should calculate net trade-in correctly', () => {
    const params = {
      vehiclePrice: 30000,
      tradeInValue: 8000,
      tradeInPayoff: 3000,
      province: 'ON' as const
    };

    const quote = calculateQuote(params);

    // Net trade-in: 8000 - 3000 = 5000
    expect(quote.netTradeIn).toBe(5000);

    // Taxable amount should deduct net trade-in
    // Subtotal: 30000
    // Taxable: 30000 - 5000 = 25000
    expect(quote.taxableAmount).toBe(25000);
  });
});
