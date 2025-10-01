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
    expect(result.pst).toBe(2800);
    expect(result.hst).toBe(0);
    expect(result.total).toBe(4800);
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
      financeRate: 6.99,
      financeTerm: 60,
      dealerFees: 500,
      incentives: 1000
    };

    const quote = calculateQuote(params);

    // Net price: 35000 - 7000 - 5000 + 500 - 1000 = 22500
    expect(quote.subtotal).toBe(22500);

    // HST: 22500 * 0.13 = 2925
    expect(quote.taxes.total).toBe(2925);

    // Total: 22500 + 2925 = 25425
    expect(quote.total).toBe(25425);

    // Monthly payment should be calculated on financed amount
    expect(quote.monthlyPayment).toBeGreaterThan(0);
  });

  it('should handle cash purchase (0 month term)', () => {
    const params = {
      vehiclePrice: 25000,
      downPayment: 25000,
      province: 'BC' as const,
      financeTerm: 0
    };

    const quote = calculateQuote(params);

    expect(quote.monthlyPayment).toBe(0);
    expect(quote.total).toBeGreaterThan(0); // Should still have taxes
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

    expect(withIncentive.subtotal).toBe(withoutIncentive.subtotal - 2000);
  });
});
