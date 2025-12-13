declare module "sentiment" {
  interface SentimentResult {
    score: number;
    comparative: number;
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }

  interface SentimentAnalysisOptions {
    extras?: Record<string, number>;
  }

  class Sentiment {
    analyze(phrase: string, options?: SentimentAnalysisOptions): SentimentResult;
  }

  export = Sentiment;
}

