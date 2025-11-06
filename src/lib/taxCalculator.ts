// Canadian Provincial Tax Rates (2025)
export const PROVINCIAL_TAX_RATES = {
  AB: { gst: 0.05, pst: 0, hst: 0, total: 0.05, name: 'Alberta' },
  BC: { gst: 0.05, pst: 0.07, hst: 0, total: 0.12, name: 'British Columbia' },
  MB: { gst: 0.05, pst: 0.07, hst: 0, total: 0.12, name: 'Manitoba' },
  NB: { gst: 0, pst: 0, hst: 0.15, total: 0.15, name: 'New Brunswick' },
  NL: { gst: 0, pst: 0, hst: 0.15, total: 0.15, name: 'Newfoundland and Labrador' },
  NT: { gst: 0.05, pst: 0, hst: 0, total: 0.05, name: 'Northwest Territories' },
  NS: { gst: 0, pst: 0, hst: 0.15, total: 0.15, name: 'Nova Scotia' },
  NU: { gst: 0.05, pst: 0, hst: 0, total: 0.05, name: 'Nunavut' },
  ON: { gst: 0, pst: 0, hst: 0.13, total: 0.13, name: 'Ontario' },
  PE: { gst: 0, pst: 0, hst: 0.15, total: 0.15, name: 'Prince Edward Island' },
  QC: { gst: 0.05, pst: 0.09975, hst: 0, total: 0.14975, name: 'Quebec' },
  SK: { gst: 0.05, pst: 0.06, hst: 0, total: 0.11, name: 'Saskatchewan' },
  YT: { gst: 0.05, pst: 0, hst: 0, total: 0.05, name: 'Yukon' },
} as const;

export type Province = keyof typeof PROVINCIAL_TAX_RATES;

export interface QuoteCalculation {
  vehiclePrice: number;
  tradeInValue: number;
  tradeInPayoff: number;
  downPayment: number;
  dealerFees: number;
  incentives: number;
  addons: number;
  province: Province;
  
  // Calculated fields
  netTradeIn: number;
  subtotal: number;
  taxableAmount: number;
  gst: number;
  pst: number;
  hst: number;
  totalTaxes: number;
  totalPrice: number;
  amountToFinance: number;
}

export interface FinanceCalculation extends QuoteCalculation {
  financeTerm: number; // months
  financeRate: number; // annual percentage rate
  paymentAmount: number;
  totalInterest: number;
  totalFinanced: number;
}

export function calculateQuote(params: {
  vehiclePrice: number;
  tradeInValue?: number;
  tradeInPayoff?: number;
  downPayment?: number;
  dealerFees?: number;
  incentives?: number;
  addons?: number;
  province: Province;
}): QuoteCalculation {
  const {
    vehiclePrice,
    tradeInValue = 0,
    tradeInPayoff = 0,
    downPayment = 0,
    dealerFees = 0,
    incentives = 0,
    addons = 0,
    province,
  } = params;

  // Net trade-in (value minus payoff)
  const netTradeIn = Math.max(0, tradeInValue - tradeInPayoff);

  // Subtotal before taxes
  const subtotal = vehiclePrice + dealerFees + addons - incentives;

  // Taxable amount (subtract trade-in equity before tax in most provinces)
  // Note: Some provinces tax differently, this is simplified
  const taxableAmount = Math.max(0, subtotal - netTradeIn);

  // Get tax rates for province
  const taxRates = PROVINCIAL_TAX_RATES[province];

  // Calculate taxes
  const gst = taxableAmount * taxRates.gst;
  const pst = taxableAmount * taxRates.pst;
  const hst = taxableAmount * taxRates.hst;
  const totalTaxes = gst + pst + hst;

  // Total price
  const totalPrice = subtotal + totalTaxes;

  // Amount to finance (after down payment and trade-in)
  const amountToFinance = Math.max(0, totalPrice - downPayment - netTradeIn);

  return {
    vehiclePrice,
    tradeInValue,
    tradeInPayoff,
    downPayment,
    dealerFees,
    incentives,
    addons,
    province,
    netTradeIn,
    subtotal,
    taxableAmount,
    gst,
    pst,
    hst,
    totalTaxes,
    totalPrice,
    amountToFinance,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

// ============================================================================
// LEGACY API FUNCTIONS (for backward compatibility with existing tests)
// ============================================================================

/**
 * Legacy function for calculating provincial taxes
 * Used by existing unit tests - maintained for backward compatibility
 *
 * @param amount - The taxable amount
 * @param province - The province code (e.g., 'ON', 'BC', 'QC')
 * @returns Object with tax breakdown
 */
export function calculateProvincialTaxes(amount: number, province: Province) {
  const taxRates = PROVINCIAL_TAX_RATES[province] || { gst: 0, pst: 0, hst: 0, total: 0 };

  return {
    gst: amount * taxRates.gst,
    pst: amount * taxRates.pst,
    hst: amount * taxRates.hst,
    qst: province === 'QC' ? amount * taxRates.pst : 0, // QST is Quebec's PST
    total: amount * taxRates.total,
  };
}

/**
 * Legacy function overload for calculating finance payments
 * Used by existing unit tests - maintained for backward compatibility
 *
 * @param principal - The loan principal amount
 * @param annualRate - The annual percentage rate (e.g., 6.99 for 6.99%)
 * @param termMonths - The loan term in months
 * @returns Monthly payment amount
 */
export function calculateFinancePayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number;

/**
 * Modern function signature for calculating finance payments with full quote
 * Returns complete finance calculation with all fields
 */
export function calculateFinancePayment(params: {
  quote: QuoteCalculation;
  financeTerm: number;
  financeRate: number;
}): FinanceCalculation;

// Implementation with function overloading
export function calculateFinancePayment(
  principalOrParams: number | { quote: QuoteCalculation; financeTerm: number; financeRate: number },
  annualRate?: number,
  termMonths?: number
): number | FinanceCalculation {
  // Legacy signature: (principal: number, annualRate: number, termMonths: number)
  if (typeof principalOrParams === 'number' && typeof annualRate === 'number' && typeof termMonths === 'number') {
    const principal = principalOrParams;

    // 0% financing case
    if (annualRate === 0) {
      return principal / termMonths;
    }

    // Calculate monthly payment using standard loan formula
    const monthlyRate = annualRate / 100 / 12;
    const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths);
    const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;

    return numerator / denominator;
  }

  // Modern signature: (params: { quote, financeTerm, financeRate })
  if (typeof principalOrParams === 'object') {
    const { quote, financeTerm, financeRate } = principalOrParams;

    // Convert annual rate to monthly rate
    const monthlyRate = financeRate / 100 / 12;

    // Calculate monthly payment using standard loan formula
    let paymentAmount = 0;
    let totalInterest = 0;

    if (monthlyRate > 0) {
      const numerator = quote.amountToFinance * monthlyRate * Math.pow(1 + monthlyRate, financeTerm);
      const denominator = Math.pow(1 + monthlyRate, financeTerm) - 1;
      paymentAmount = numerator / denominator;

      const totalFinanced = paymentAmount * financeTerm;
      totalInterest = totalFinanced - quote.amountToFinance;
    } else {
      // 0% financing
      paymentAmount = quote.amountToFinance / financeTerm;
    }

    const totalFinanced = paymentAmount * financeTerm;

    return {
      ...quote,
      financeTerm,
      financeRate,
      paymentAmount,
      totalInterest,
      totalFinanced,
    };
  }

  // This should never happen, but TypeScript needs a return
  throw new Error('Invalid arguments to calculateFinancePayment');
}
