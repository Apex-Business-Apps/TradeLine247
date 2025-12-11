import Sentiment from 'sentiment';

export type SentimentCategory = 'negative' | 'neutral' | 'positive';

export interface SentimentResult {
  score: number;
  comparative: number;
  category: SentimentCategory;
}

const analyzer = new Sentiment();

/**
 * Lightweight sentiment analysis wrapper.
 * Returns score (sum), comparative (normalized), and coarse category.
 */
export function getSentimentScore(text: string): SentimentResult {
  const analysis = analyzer.analyze(text || '');
  const { score, comparative } = analysis;

  let category: SentimentCategory = 'neutral';
  if (score > 0.5) category = 'positive';
  else if (score < -0.5) category = 'negative';

  return { score, comparative, category };
}

/**
 * Maps sentiment category to an empathy cue prefix to guide TTS prosody.
 */
export function getEmpathyCue(category: SentimentCategory): string {
  switch (category) {
    case 'negative':
      return "I'm sorry to hear that. ";
    case 'positive':
      return "That's great to hear! ";
    default:
      return '';
  }
}

