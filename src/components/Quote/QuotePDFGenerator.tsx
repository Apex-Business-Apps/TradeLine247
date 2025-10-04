/**
 * Bilingual PDF Quote Generator
 * 
 * Generates professional EN/FR quotes with Canadian tax calculations
 */

import { jsPDF } from 'jspdf';
import { formatCurrency } from '@/lib/taxCalculator';
import type { QuoteCalculation, FinanceCalculation } from '@/lib/taxCalculator';

interface QuoteData {
  quoteNumber: string;
  date: string;
  validUntil: string;
  dealership: {
    name: string;
    address: string;
    phone: string;
    email: string;
    license?: string;
  };
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  vehicle: {
    year: number;
    make: string;
    model: string;
    trim?: string;
    vin?: string;
    stockNumber?: string;
  };
  quote: QuoteCalculation;
  finance?: FinanceCalculation;
}

const translations = {
  en: {
    title: 'Vehicle Quote',
    quoteNumber: 'Quote Number',
    date: 'Date',
    validUntil: 'Valid Until',
    customer: 'Customer Information',
    vehicle: 'Vehicle Details',
    pricing: 'Pricing Breakdown',
    vehiclePrice: 'Vehicle Price',
    tradeInValue: 'Trade-In Value',
    tradeInPayoff: 'Trade-In Payoff',
    downPayment: 'Down Payment',
    dealerFees: 'Dealer Fees',
    incentives: 'Incentives',
    addons: 'Add-ons',
    subtotal: 'Subtotal',
    gst: 'GST',
    pst: 'PST',
    hst: 'HST',
    totalTax: 'Total Tax',
    totalPrice: 'Total Price',
    financing: 'Financing Details',
    amountFinanced: 'Amount Financed',
    term: 'Term',
    rate: 'Interest Rate',
    monthlyPayment: 'Monthly Payment',
    totalInterest: 'Total Interest',
    totalFinanced: 'Total Amount Financed',
    months: 'months',
    notes: 'Notes',
    disclosure: 'This quote is an estimate only. Final pricing subject to credit approval and dealer fees. Taxes calculated for',
    signature: 'Customer Signature',
    dateSigned: 'Date',
  },
  fr: {
    title: 'Soumission de véhicule',
    quoteNumber: 'Numéro de soumission',
    date: 'Date',
    validUntil: 'Valide jusqu\'au',
    customer: 'Informations client',
    vehicle: 'Détails du véhicule',
    pricing: 'Détail des prix',
    vehiclePrice: 'Prix du véhicule',
    tradeInValue: 'Valeur de reprise',
    tradeInPayoff: 'Solde de reprise',
    downPayment: 'Mise de fonds',
    dealerFees: 'Frais de concessionnaire',
    incentives: 'Incitatifs',
    addons: 'Accessoires',
    subtotal: 'Sous-total',
    gst: 'TPS',
    pst: 'TVP',
    hst: 'TVH',
    totalTax: 'Taxes totales',
    totalPrice: 'Prix total',
    financing: 'Détails du financement',
    amountFinanced: 'Montant financé',
    term: 'Durée',
    rate: 'Taux d\'intérêt',
    monthlyPayment: 'Paiement mensuel',
    totalInterest: 'Intérêts totaux',
    totalFinanced: 'Montant total financé',
    months: 'mois',
    notes: 'Remarques',
    disclosure: 'Cette soumission est une estimation seulement. Prix final sujet à l\'approbation du crédit et aux frais du concessionnaire. Taxes calculées pour',
    signature: 'Signature du client',
    dateSigned: 'Date',
  },
};

export function generateQuotePDF(data: QuoteData, language: 'en' | 'fr' = 'en'): jsPDF {
  const t = translations[language];
  const doc = new jsPDF();
  
  let y = 20;
  const lineHeight = 7;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Header - Dealership Info
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.dealership.name, margin, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.dealership.address, margin, y);
  y += 5;
  doc.text(`${data.dealership.phone} | ${data.dealership.email}`, margin, y);
  
  if (data.dealership.license) {
    y += 5;
    doc.setFontSize(8);
    doc.text(`License: ${data.dealership.license}`, margin, y);
  }

  // Title
  y += 15;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(t.title, margin, y);

  // Quote Details
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${t.quoteNumber}: ${data.quoteNumber}`, margin, y);
  doc.text(`${t.date}: ${data.date}`, pageWidth - margin - 50, y, { align: 'right' });
  y += 5;
  doc.text(`${t.validUntil}: ${data.validUntil}`, pageWidth - margin - 50, y, { align: 'right' });

  // Customer Info
  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.customer, margin, y);
  
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer.name, margin, y);
  if (data.customer.email) {
    y += 5;
    doc.text(data.customer.email, margin, y);
  }
  if (data.customer.phone) {
    y += 5;
    doc.text(data.customer.phone, margin, y);
  }

  // Vehicle Info
  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.vehicle, margin, y);
  
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const vehicleDesc = `${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}${data.vehicle.trim ? ' ' + data.vehicle.trim : ''}`;
  doc.text(vehicleDesc, margin, y);
  
  if (data.vehicle.vin) {
    y += 5;
    doc.text(`VIN: ${data.vehicle.vin}`, margin, y);
  }
  if (data.vehicle.stockNumber) {
    y += 5;
    doc.text(`Stock: ${data.vehicle.stockNumber}`, margin, y);
  }

  // Pricing Breakdown
  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.pricing, margin, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const addRow = (label: string, value: number | string, bold = false) => {
    if (bold) {
      doc.setFont('helvetica', 'bold');
    }
    doc.text(label, margin, y);
    doc.text(typeof value === 'number' ? formatCurrency(value) : value, pageWidth - margin, y, { align: 'right' });
    if (bold) {
      doc.setFont('helvetica', 'normal');
    }
    y += lineHeight;
  };

  addRow(t.vehiclePrice, data.quote.vehiclePrice);
  
  if (data.quote.tradeInValue > 0) {
    addRow(t.tradeInValue, -data.quote.tradeInValue);
  }
  if (data.quote.tradeInPayoff > 0) {
    addRow(t.tradeInPayoff, data.quote.tradeInPayoff);
  }
  if (data.quote.downPayment > 0) {
    addRow(t.downPayment, -data.quote.downPayment);
  }
  if (data.quote.dealerFees > 0) {
    addRow(t.dealerFees, data.quote.dealerFees);
  }
  if (data.quote.incentives > 0) {
    addRow(t.incentives, -data.quote.incentives);
  }
  if (data.quote.addons > 0) {
    addRow(t.addons, data.quote.addons);
  }

  y += 3;
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  addRow(t.subtotal, data.quote.subtotal);
  
  if (data.quote.gst > 0) {
    addRow(t.gst, data.quote.gst);
  }
  if (data.quote.pst > 0) {
    addRow(t.pst, data.quote.pst);
  }
  if (data.quote.hst > 0) {
    addRow(t.hst, data.quote.hst);
  }
  
  addRow(t.totalTax, data.quote.totalTaxes);

  y += 3;
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  doc.setFontSize(12);
  addRow(t.totalPrice, data.quote.totalPrice, true);
  doc.setFontSize(10);

  // Financing Details
  if (data.finance) {
    y += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(t.financing, margin, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    addRow(t.amountFinanced, data.finance.amountToFinance);
    addRow(t.term, `${data.finance.financeTerm} ${t.months}`);
    addRow(t.rate, `${data.finance.financeRate}%`);
    
    y += 3;
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    doc.setFontSize(12);
    addRow(t.monthlyPayment, data.finance.paymentAmount, true);
    doc.setFontSize(10);
    
    y += 5;
    addRow(t.totalInterest, data.finance.totalInterest);
    addRow(t.totalFinanced, data.finance.totalFinanced);
  }

  // Disclosure
  y += 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const disclosureText = `${t.disclosure} ${data.quote.province}.`;
  const splitText = doc.splitTextToSize(disclosureText, pageWidth - 2 * margin);
  doc.text(splitText, margin, y);

  // Signature Section
  y += 25;
  doc.setFont('helvetica', 'normal');
  doc.line(margin, y, margin + 70, y);
  doc.text(t.signature, margin, y + 5);
  
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  doc.text(t.dateSigned, pageWidth - margin - 70, y + 5);

  return doc;
}

export function downloadQuotePDF(data: QuoteData, language: 'en' | 'fr' = 'en') {
  const doc = generateQuotePDF(data, language);
  doc.save(`quote-${data.quoteNumber}-${language}.pdf`);
}
