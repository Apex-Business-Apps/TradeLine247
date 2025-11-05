/**
 * Unit Tests: Canadian Tax Calculator
 */

import { describe, it, expect } from 'vitest';
import {
  calculateQuote,
  calculateFinancePayment,
  PROVINCIAL_TAX_RATES
} from '../../src/lib/taxCalculator';

describe('calculateQuote - Tax Calculations', () => {
  it('should calculate Ontario HST (13%) correctly', () => {
    const result = calculateQuote({
      vehiclePrice: 30000,
      province: 'ON'
    });
    expect(result.gst).toBe(0);
    expect(result.pst).toBe(0);
    expect(result.hst).toBe(3900); // 30000 * 0.13
    expect(result.totalTaxes).toBe(3900);
  });

  it('should calculate BC taxes (GST 5% + PST 7%) correctly', () => {
    const result = calculateQuote({
      vehiclePrice: 40000,
      province: 'BC'
    });
    expect(result.gst).toBe(2000); // 40000 * 0.05
    expect(result.pst).toBeCloseTo(2800, 2); // 40000 * 0.07 (floating point precision)
    expect(result.hst).toBe(0);
    expect(result.totalTaxes).toBeCloseTo(4800, 2);
  });

  it('should calculate Alberta GST only (5%) correctly', () => {
    const result = calculateQuote({
      vehiclePrice: 50000,
      province: 'AB'
    });
    expect(result.gst).toBe(2500); // 50000 * 0.05
    expect(result.pst).toBe(0);
    expect(result.hst).toBe(0);
    expect(result.totalTaxes).toBe(2500);
  });

  it('should handle Quebec QST (9.975%) + GST (5%)', () => {
    const result = calculateQuote({
      vehiclePrice: 25000,
      province: 'QC'
    });
    expect(result.gst).toBe(1250); // 25000 * 0.05
    expect(result.pst).toBeCloseTo(2493.75, 2); // 25000 * 0.09975
    expect(result.totalTaxes).toBeCloseTo(3743.75, 2);
  });
});

describe('calculateFinancePayment', () => {
  it('should calculate monthly payment correctly', () => {
    const quote = calculateQuote({
      vehiclePrice: 20000,
      province: 'ON'
    });

    const result = calculateFinancePayment({
      quote,
      financeTerm: 60,
      financeRate: 6.99
    });

    // Expected: ~$395-450/month (approximate, includes taxes)
    expect(result.paymentAmount).toBeGreaterThan(390);
    expect(result.paymentAmount).toBeLessThan(500);
    expect(result.financeTerm).toBe(60);
    expect(result.financeRate).toBe(6.99);
  });

  it('should handle 0% interest rate', () => {
    const quote = calculateQuote({
      vehiclePrice: 24000,
      province: 'ON'
    });

    const result = calculateFinancePayment({
      quote,
      financeTerm: 48,
      financeRate: 0
    });

    // 0% financing: simple division of amountToFinance / term
    // amountToFinance = 24000 + taxes = 24000 + (24000 * 0.13) = 27120
    expect(result.paymentAmount).toBeCloseTo(27120 / 48, 2);
    expect(result.totalInterest).toBe(0);
  });

  it('should handle short term (12 months)', () => {
    const quote = calculateQuote({
      vehiclePrice: 12000,
      province: 'AB'
    });

    const result = calculateFinancePayment({
      quote,
      financeTerm: 12,
      financeRate: 4.99
    });

    expect(result.paymentAmount).toBeGreaterThan(1000);
    expect(result.paymentAmount).toBeLessThan(1100);
    expect(result.totalInterest).toBeGreaterThan(0);
  });
});

describe('calculateQuote - Complete Quote', () => {
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

    // Subtotal: vehiclePrice + dealerFees + addons - incentives
    // = 35000 + 500 + 0 - 1000 = 34500
    expect(quote.subtotal).toBe(34500);

    // Net trade-in: tradeInValue - tradeInPayoff = 5000 - 0 = 5000
    expect(quote.netTradeIn).toBe(5000);

    // Taxable amount: subtotal - netTradeIn = 34500 - 5000 = 29500
    expect(quote.taxableAmount).toBe(29500);

    // HST: 29500 * 0.13 = 3835
    expect(quote.hst).toBe(3835);
    expect(quote.totalTaxes).toBe(3835);

    // Total price: subtotal + taxes = 34500 + 3835 = 38335
    expect(quote.totalPrice).toBe(38335);

    // Amount to finance: totalPrice - downPayment - netTradeIn
    // = 38335 - 7000 - 5000 = 26335
    expect(quote.amountToFinance).toBe(26335);
  });

  it('should handle simple vehicle purchase', () => {
    const params = {
      vehiclePrice: 25000,
      province: 'BC' as const
    };

    const quote = calculateQuote(params);

    expect(quote.subtotal).toBe(25000);
    expect(quote.totalTaxes).toBe(3000); // 25000 * 0.12 (BC: 5% GST + 7% PST)
    expect(quote.totalPrice).toBe(28000);
    expect(quote.amountToFinance).toBe(28000);
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
    expect(withIncentive.subtotal).toBe(28000);

    // Taxes also reduced because taxable amount is lower
    expect(withIncentive.totalTaxes).toBeLessThan(withoutIncentive.totalTaxes);
  });

  it('should handle down payment correctly', () => {
    const quote = calculateQuote({
      vehiclePrice: 20000,
      downPayment: 5000,
      province: 'ON'
    });

    // Down payment doesn't affect subtotal or taxes
    expect(quote.subtotal).toBe(20000);
    expect(quote.totalTaxes).toBe(2600); // 20000 * 0.13

    // Down payment reduces amount to finance
    // amountToFinance = totalPrice - downPayment = 22600 - 5000 = 17600
    expect(quote.amountToFinance).toBe(17600);
  });
});
