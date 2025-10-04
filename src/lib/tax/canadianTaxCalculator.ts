/**
 * Canadian Provincial Tax Calculator
 * Handles GST, HST, PST across all provinces and territories
 */

import { telemetry } from '@/lib/observability/telemetry';

export type Province =
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NT' | 'NS' | 'NU'
  | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

interface TaxBreakdown {
  subtotal: number;
  gst: number;
  pst: number;
  hst: number;
  total: number;
  effectiveRate: number;
  taxType: 'GST+PST' | 'HST' | 'GST';
  province: Province;
}

interface TaxRates {
  gst: number;
  pst: number;
  hst: number;
}

/**
 * Tax rates as of 2025
 * Reference: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html
 */
const PROVINCIAL_TAX_RATES: Record<Province, TaxRates> = {
  // HST Provinces
  ON: { gst: 0, pst: 0, hst: 0.13 }, // 13% HST
  NB: { gst: 0, pst: 0, hst: 0.15 }, // 15% HST
  NL: { gst: 0, pst: 0, hst: 0.15 }, // 15% HST
  NS: { gst: 0, pst: 0, hst: 0.15 }, // 15% HST
  PE: { gst: 0, pst: 0, hst: 0.15 }, // 15% HST

  // GST + PST Provinces
  BC: { gst: 0.05, pst: 0.07, hst: 0 }, // 5% GST + 7% PST
  MB: { gst: 0.05, pst: 0.07, hst: 0 }, // 5% GST + 7% PST (RST)
  QC: { gst: 0.05, pst: 0.09975, hst: 0 }, // 5% GST + 9.975% QST
  SK: { gst: 0.05, pst: 0.06, hst: 0 }, // 5% GST + 6% PST

  // GST Only (Territories)
  AB: { gst: 0.05, pst: 0, hst: 0 }, // 5% GST only
  NT: { gst: 0.05, pst: 0, hst: 0 }, // 5% GST only
  NU: { gst: 0.05, pst: 0, hst: 0 }, // 5% GST only
  YT: { gst: 0.05, pst: 0, hst: 0 }, // 5% GST only
};

export class CanadianTaxCalculator {
  /**
   * Calculate taxes for a given province
   */
  calculateTax(subtotal: number, province: Province): TaxBreakdown {
    const startTime = performance.now();

    try {
      if (subtotal < 0) {
        throw new Error('Subtotal cannot be negative');
      }

      const rates = PROVINCIAL_TAX_RATES[province];
      if (!rates) {
        throw new Error(`Invalid province code: ${province}`);
      }

      let gst = 0;
      let pst = 0;
      let hst = 0;
      let taxType: 'GST+PST' | 'HST' | 'GST';

      if (rates.hst > 0) {
        // HST province
        hst = subtotal * rates.hst;
        taxType = 'HST';
      } else {
        // GST + PST or GST only
        gst = subtotal * rates.gst;
        
        if (rates.pst > 0) {
          // Note: In most provinces, PST is calculated on subtotal
          // In Quebec, QST is calculated on subtotal + GST
          if (province === 'QC') {
            pst = (subtotal + gst) * rates.pst;
          } else {
            pst = subtotal * rates.pst;
          }
          taxType = 'GST+PST';
        } else {
          taxType = 'GST';
        }
      }

      const totalTax = gst + pst + hst;
      const total = subtotal + totalTax;
      const effectiveRate = totalTax / subtotal;

      const breakdown: TaxBreakdown = {
        subtotal: Math.round(subtotal * 100) / 100,
        gst: Math.round(gst * 100) / 100,
        pst: Math.round(pst * 100) / 100,
        hst: Math.round(hst * 100) / 100,
        total: Math.round(total * 100) / 100,
        effectiveRate: Math.round(effectiveRate * 10000) / 100, // Percentage with 2 decimals
        taxType,
        province,
      };

      const duration = performance.now() - startTime;
      telemetry.trackPerformance('tax_calculation', duration, {
        province,
        taxType,
      });

      return breakdown;
    } catch (error) {
      telemetry.error('Tax calculation failed', { province, subtotal }, error as Error);
      throw error;
    }
  }

  /**
   * Get tax rates for a province
   */
  getTaxRates(province: Province): TaxRates {
    return PROVINCIAL_TAX_RATES[province];
  }

  /**
   * Get tax description for display
   */
  getTaxDescription(province: Province): string {
    const rates = PROVINCIAL_TAX_RATES[province];
    
    if (rates.hst > 0) {
      return `${(rates.hst * 100).toFixed(2)}% HST`;
    } else if (rates.pst > 0) {
      const gstLabel = province === 'QC' ? 'GST' : 'GST';
      const pstLabel = province === 'QC' ? 'QST' : 'PST';
      return `${(rates.gst * 100).toFixed(2)}% ${gstLabel} + ${(rates.pst * 100).toFixed(2)}% ${pstLabel}`;
    } else {
      return `${(rates.gst * 100).toFixed(2)}% GST`;
    }
  }

  /**
   * Validate province code
   */
  isValidProvince(code: string): code is Province {
    return code in PROVINCIAL_TAX_RATES;
  }

  /**
   * Get all supported provinces
   */
  getAllProvinces(): Province[] {
    return Object.keys(PROVINCIAL_TAX_RATES) as Province[];
  }
}

export const canadianTaxCalculator = new CanadianTaxCalculator();
