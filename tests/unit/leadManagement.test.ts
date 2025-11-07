/**
 * Unit Tests: Lead Management Business Logic
 *
 * Tests lead scoring, qualification, and status management
 */

import { describe, it, expect } from 'vitest';

// Lead scoring algorithm (to be implemented in src/lib/leadScoring.ts)
interface LeadData {
  hasEmail: boolean;
  hasPhone: boolean;
  source: 'website' | 'chat' | 'phone' | 'referral' | 'walk-in';
  interactionCount: number;
  responseTime?: number; // in minutes
  vehicleInterest?: string;
  budgetProvided: boolean;
}

function calculateLeadScore(lead: LeadData): number {
  let score = 0;

  // Contact information (30 points)
  if (lead.hasEmail) score += 15;
  if (lead.hasPhone) score += 15;

  // Source quality (20 points)
  const sourceScores = {
    referral: 20,
    'walk-in': 15,
    chat: 12,
    phone: 10,
    website: 8,
  };
  score += sourceScores[lead.source] || 0;

  // Engagement (30 points)
  score += Math.min(lead.interactionCount * 5, 30);

  // Response time bonus (10 points)
  if (lead.responseTime !== undefined) {
    if (lead.responseTime < 5) score += 10;
    else if (lead.responseTime < 15) score += 7;
    else if (lead.responseTime < 60) score += 5;
  }

  // Intent signals (10 points)
  if (lead.vehicleInterest) score += 5;
  if (lead.budgetProvided) score += 5;

  return Math.min(score, 100);
}

function getLeadQualification(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

describe('Lead Scoring Algorithm', () => {
  it('should score high-quality referral leads highly', () => {
    const lead: LeadData = {
      hasEmail: true,
      hasPhone: true,
      source: 'referral',
      interactionCount: 3,
      responseTime: 2,
      vehicleInterest: '2024 Toyota Camry',
      budgetProvided: true,
    };

    const score = calculateLeadScore(lead);
    expect(score).toBeGreaterThanOrEqual(85);
    expect(getLeadQualification(score)).toBe('hot');
  });

  it('should score minimal website leads lower', () => {
    const lead: LeadData = {
      hasEmail: true,
      hasPhone: false,
      source: 'website',
      interactionCount: 0,
      budgetProvided: false,
    };

    const score = calculateLeadScore(lead);
    expect(score).toBeLessThanOrEqual(30);
    expect(getLeadQualification(score)).toBe('cold');
  });

  it('should reward fast response times', () => {
    const fastLead: LeadData = {
      hasEmail: true,
      hasPhone: true,
      source: 'chat',
      interactionCount: 1,
      responseTime: 3,
      budgetProvided: false,
    };

    const slowLead: LeadData = {
      ...fastLead,
      responseTime: 120,
    };

    expect(calculateLeadScore(fastLead)).toBeGreaterThan(calculateLeadScore(slowLead));
  });

  it('should cap score at 100', () => {
    const perfectLead: LeadData = {
      hasEmail: true,
      hasPhone: true,
      source: 'referral',
      interactionCount: 20, // Would give 100+ points
      responseTime: 1,
      vehicleInterest: 'Any',
      budgetProvided: true,
    };

    expect(calculateLeadScore(perfectLead)).toBe(100);
  });

  it('should categorize leads correctly', () => {
    expect(getLeadQualification(85)).toBe('hot');
    expect(getLeadQualification(70)).toBe('hot');
    expect(getLeadQualification(69)).toBe('warm');
    expect(getLeadQualification(40)).toBe('warm');
    expect(getLeadQualification(39)).toBe('cold');
    expect(getLeadQualification(0)).toBe('cold');
  });
});

describe('Lead Status Transitions', () => {
  const validTransitions: Record<string, string[]> = {
    new: ['contacted', 'lost'],
    contacted: ['qualified', 'lost'],
    qualified: ['quoted', 'lost'],
    quoted: ['negotiating', 'lost'],
    negotiating: ['sold', 'lost'],
    sold: [], // Terminal state
    lost: [], // Terminal state
  };

  function canTransition(from: string, to: string): boolean {
    return validTransitions[from]?.includes(to) || false;
  }

  it('should allow valid status transitions', () => {
    expect(canTransition('new', 'contacted')).toBe(true);
    expect(canTransition('contacted', 'qualified')).toBe(true);
    expect(canTransition('qualified', 'quoted')).toBe(true);
  });

  it('should prevent invalid status transitions', () => {
    expect(canTransition('new', 'sold')).toBe(false);
    expect(canTransition('contacted', 'negotiating')).toBe(false);
    expect(canTransition('sold', 'contacted')).toBe(false);
  });

  it('should allow losing a lead at any stage', () => {
    expect(canTransition('new', 'lost')).toBe(true);
    expect(canTransition('contacted', 'lost')).toBe(true);
    expect(canTransition('qualified', 'lost')).toBe(true);
  });

  it('should not allow transitions from terminal states', () => {
    expect(canTransition('sold', 'contacted')).toBe(false);
    expect(canTransition('lost', 'contacted')).toBe(false);
  });
});
