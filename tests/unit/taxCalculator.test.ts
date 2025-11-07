/**
 * Unit Tests: Canadian Tax Calculator
 *
 * Comprehensive tests for quote calculations, tax calculations, and finance calculations
 */

import { describe, it, expect } from 'vitest';
import {
  calculateQuote,
  calculateFinancePayment,
  calculateProvincialTaxes,
  PROVINCIAL_TAX_RATES,
  formatCurrency,
  formatPercent
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
    const result = calculateProvincialTaxes(40000, 'BC');
    expect(result.gst).toBe(2000);
    expect(result.pst).toBeCloseTo(2800, 2); // Use toBeCloseTo for floating point
    expect(result.hst).toBe(0);
    expect(result.total).toBeCloseTo(4800, 2);
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

describe('calculateQuote - Edge Cases', () => {
  it('should handle negative trade-in equity (upside down trade-in)', () => {
    const quote = calculateQuote({
      vehiclePrice: 30000,
      tradeInValue: 5000,
      tradeInPayoff: 8000, // Owes more than it's worth
      province: 'ON'
    });

    // Net trade-in should be 0 (not negative)
    expect(quote.netTradeIn).toBe(0);

    // Taxable amount should be full subtotal (no trade-in benefit)
    expect(quote.taxableAmount).toBe(30000);
  });

  it('should handle dealer fees and add-ons together', () => {
    const quote = calculateQuote({
      vehiclePrice: 25000,
      dealerFees: 695,
      addons: 2500, // Extended warranty, paint protection, etc.
      province: 'AB'
    });

    // Subtotal includes all fees and add-ons
    expect(quote.subtotal).toBe(28195);

    // Taxes on full amount
    expect(quote.totalTaxes).toBeCloseTo(1409.75, 2); // 28195 * 0.05
  });

  it('should handle cash purchase (fully paid)', () => {
    const quote = calculateQuote({
      vehiclePrice: 20000,
      downPayment: 20000 + 2600, // Full price + taxes
      province: 'ON'
    });

    // Amount to finance should be 0
    expect(quote.amountToFinance).toBe(0);
  });

  it('should handle very high vehicle price (luxury/exotic)', () => {
    const quote = calculateQuote({
      vehiclePrice: 250000, // Ferrari, Lamborghini, etc.
      province: 'ON'
    });

    // Should calculate correctly without overflow
    expect(quote.totalTaxes).toBe(32500); // 250000 * 0.13
    expect(quote.totalPrice).toBe(282500);
  });

  it('should handle maximum incentives scenario', () => {
    const quote = calculateQuote({
      vehiclePrice: 40000,
      incentives: 5000, // Manufacturer + dealer incentives
      province: 'BC'
    });

    // Subtotal reduced by incentives
    expect(quote.subtotal).toBe(35000);

    // Taxes calculated on reduced amount
    expect(quote.totalTaxes).toBe(4200); // 35000 * 0.12
  });

  it('should handle add-ons and incentives together', () => {
    const quote = calculateQuote({
      vehiclePrice: 30000,
      addons: 3000,
      incentives: 2000,
      province: 'ON'
    });

    // Subtotal: vehiclePrice + addons - incentives
    // 30000 + 3000 - 2000 = 31000
    expect(quote.subtotal).toBe(31000);

    // Taxes: 31000 * 0.13 = 4030
    expect(quote.totalTaxes).toBe(4030);
  });

  it('should handle all 13 provinces correctly', () => {
    const vehiclePrice = 20000;

    // Test each province has valid tax rate
    Object.keys(PROVINCIAL_TAX_RATES).forEach((province) => {
      const quote = calculateQuote({
        vehiclePrice,
        province: province as any
      });

      // Total taxes should be positive
      expect(quote.totalTaxes).toBeGreaterThan(0);

      // Total price should be vehicle price + taxes
      expect(quote.totalPrice).toBe(vehiclePrice + quote.totalTaxes);

      // Tax components should sum correctly
      expect(quote.gst + quote.pst + quote.hst).toBeCloseTo(quote.totalTaxes, 2);
    });
  });
});

describe('calculateFinancePayment - Edge Cases', () => {
  it('should handle very high interest rate (bad credit)', () => {
    const quote = calculateQuote({
      vehiclePrice: 15000,
      province: 'ON'
    });

    const result = calculateFinancePayment({
      quote,
      financeTerm: 60,
      financeRate: 19.99 // Subprime rate
    });

    // Payment should be significantly higher
    expect(result.paymentAmount).toBeGreaterThan(350);
    expect(result.totalInterest).toBeGreaterThan(4000);
  });

  it('should handle very long term (96 months)', () => {
    const quote = calculateQuote({
      vehiclePrice: 35000,
      province: 'ON'
    });

    const result = calculateFinancePayment({
      quote,
      financeTerm: 96,
      financeRate: 6.99
    });

    // Longer term = lower payment but more interest
    expect(result.paymentAmount).toBeGreaterThan(500);
    expect(result.paymentAmount).toBeLessThan(600);
    expect(result.totalInterest).toBeGreaterThan(6000);
  });

  it('should handle short term with high rate', () => {
    const quote = calculateQuote({
      vehiclePrice: 20000,
      province: 'AB'
    });

    const result = calculateFinancePayment({
      quote,
      financeTerm: 24,
      financeRate: 8.99
    });

    // High payment due to short term
    expect(result.paymentAmount).toBeGreaterThan(900);
  });

  it('should calculate total interest correctly', () => {
    const quote = calculateQuote({
      vehiclePrice: 30000,
      downPayment: 5000,
      province: 'ON'
    });

    const result = calculateFinancePayment({
      quote,
      financeTerm: 60,
      financeRate: 5.99
    });

    // Total interest = (payment × term) - principal
    const calculatedInterest = (result.paymentAmount * result.financeTerm) - result.amountToFinance;
    expect(result.totalInterest).toBeCloseTo(calculatedInterest, 2);
  });
});

describe('Formatting Functions', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(999999.99)).toBe('$999,999.99');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(99.9)).toBe('$99.90');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('should format percentage correctly', () => {
    expect(formatPercent(5.99)).toBe('5.99%');
    expect(formatPercent(0)).toBe('0.00%');
    expect(formatPercent(19.995)).toBe('20.00%');
    expect(formatPercent(100)).toBe('100.00%');
  });
});

describe('calculateQuote - Real-World Scenarios', () => {
  it('should handle typical new car purchase', () => {
    const quote = calculateQuote({
      vehiclePrice: 42000,
      dealerFees: 795,
      addons: 1500, // Rust proofing, tint, mats
      downPayment: 8000,
      province: 'ON'
    });

    // Expected calculations
    expect(quote.subtotal).toBe(44295); // 42000 + 795 + 1500
    expect(quote.totalTaxes).toBeCloseTo(5758.35, 2); // 44295 * 0.13
    expect(quote.totalPrice).toBeCloseTo(50053.35, 2);
    expect(quote.amountToFinance).toBeCloseTo(42053.35, 2); // totalPrice - downPayment
  });

  it('should handle used car with trade-in', () => {
    const quote = calculateQuote({
      vehiclePrice: 18000,
      tradeInValue: 6000,
      tradeInPayoff: 2500,
      dealerFees: 495,
      province: 'BC'
    });

    // Net trade-in: 6000 - 2500 = 3500
    expect(quote.netTradeIn).toBe(3500);

    // Subtotal: 18000 + 495 = 18495
    expect(quote.subtotal).toBe(18495);

    // Taxable: 18495 - 3500 = 14995
    expect(quote.taxableAmount).toBe(14995);

    // Taxes: 14995 * 0.12 = 1799.40
    expect(quote.totalTaxes).toBeCloseTo(1799.40, 2);
  });

  it('should handle lease buyout scenario', () => {
    const quote = calculateQuote({
      vehiclePrice: 28000, // Residual value
      dealerFees: 0, // No doc fees on lease buyout
      province: 'AB'
    });

    expect(quote.subtotal).toBe(28000);
    expect(quote.totalTaxes).toBe(1400); // 28000 * 0.05
    expect(quote.totalPrice).toBe(29400);
  });
});
