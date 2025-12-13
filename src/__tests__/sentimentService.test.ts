import { describe, it, expect } from 'vitest';
import { getSentimentScore, getEmpathyCue } from '../services/sentimentService';

describe('sentimentService', () => {
  it('classifies positive text', () => {
    const result = getSentimentScore('I love this great product');
    expect(result.category).toBe('positive');
    expect(getEmpathyCue(result.category)).toContain('great');
  });

  it('classifies negative text', () => {
    const result = getSentimentScore('I am very disappointed and upset');
    expect(result.category).toBe('negative');
    expect(getEmpathyCue(result.category)).toContain('sorry');
  });

  it('classifies neutral text', () => {
    const result = getSentimentScore('The package arrived.');
    expect(result.category).toBe('neutral');
    expect(getEmpathyCue(result.category)).toBe('');
  });
});

