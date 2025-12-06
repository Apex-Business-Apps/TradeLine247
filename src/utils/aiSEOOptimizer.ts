/**
 * AI SEO Optimizer Utilities
 * 
 * Specialized functions for AI search engine optimization:
 * - Natural language formatting
 * - Direct answer extraction
 * - Entity recognition
 * - Fact extraction
 * - Citation formatting
 * 
 * Target: >95 AI SEO Score
 */

/**
 * Format content for AI citation
 * Uses natural language and clear factual statements
 */
export function formatForAICitation(
  content: string,
  includeSource: boolean = true,
  sourceUrl?: string
): string {
  // Remove markdown formatting that AI might misinterpret
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links, keep text
  
  // Ensure sentences end properly
  if (!formatted.endsWith('.') && !formatted.endsWith('!') && !formatted.endsWith('?')) {
    formatted += '.';
  }
  
  if (includeSource && sourceUrl) {
    formatted += ` (Source: ${sourceUrl})`;
  }
  
  return formatted;
}

/**
 * Extract direct answer from content
 * AI search engines look for clear, direct answers
 */
export function extractDirectAnswer(
  content: string,
  question?: string
): string | null {
  // Look for direct answer patterns
  const patterns = [
    /^(.{20,200}\.)/, // First sentence (20-200 chars)
    /(?:answer|solution|result|conclusion)[:]\s*(.{20,200}\.)/i,
    /(?:the|this|it)\s+(?:is|was|means|refers to)\s+(.{20,200}\.)/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const answer = match[1].trim();
      if (answer.length >= 20 && answer.length <= 200) {
        return answer;
      }
    }
  }
  
  // Fallback: first sentence
  const firstSentence = content.split(/[.!?]/)[0];
  if (firstSentence.length >= 20 && firstSentence.length <= 200) {
    return firstSentence + '.';
  }
  
  return null;
}

/**
 * Extract facts/statistics from content
 * AI models excel at extracting numerical facts
 */
export function extractFacts(content: string): Array<{ label: string; value: string }> {
  const facts: Array<{ label: string; value: string }> = [];
  
  // Pattern for percentages
  const percentagePattern = /(\d+(?:\.\d+)?)\s*%/g;
  let match;
  while ((match = percentagePattern.exec(content)) !== null) {
    const context = content.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50);
    const label = context.split(/[.!?]/)[0].trim();
    facts.push({
      label: label || 'Percentage',
      value: `${match[1]}%`,
    });
  }
  
  // Pattern for dollar amounts
  const dollarPattern = /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
  while ((match = dollarPattern.exec(content)) !== null) {
    const context = content.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50);
    const label = context.split(/[.!?]/)[0].trim();
    facts.push({
      label: label || 'Price',
      value: `$${match[1]}`,
    });
  }
  
  // Pattern for numbers with units
  const numberWithUnitPattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s+(hours?|days?|months?|years?|minutes?|seconds?|customers?|users?|calls?|messages?)/gi;
  while ((match = numberWithUnitPattern.exec(content)) !== null) {
    facts.push({
      label: `${match[2]}`,
      value: match[1],
    });
  }
  
  return facts;
}

/**
 * Format entity for AI recognition
 * Helps AI models identify key entities
 */
export function formatEntity(name: string, type: string, properties: Record<string, any>): object {
  return {
    '@type': type,
    name,
    ...properties,
  };
}

/**
 * Create AI-friendly FAQ structure
 */
export function createAIFAQ(question: string, answer: string): object {
  return {
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: formatForAICitation(answer, false),
    },
  };
}

/**
 * Generate AI summary from content
 * Short, factual summary for AI crawlers
 */
export function generateAISummary(
  content: string,
  maxLength: number = 200
): string {
  // Remove markdown and HTML
  let clean = content
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1');
  
  // Take first sentence or first N characters
  const sentences = clean.split(/[.!?]/);
  if (sentences[0] && sentences[0].length <= maxLength) {
    return sentences[0].trim() + (sentences[0].endsWith('.') ? '' : '.');
  }
  
  // Truncate at word boundary
  const truncated = clean.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace).trim() + '...';
  }
  
  return truncated.trim() + '...';
}

/**
 * Check if content is AI-friendly
 * Validates content structure for AI readability
 */
export function isAIFriendly(content: string): {
  isFriendly: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;
  
  // Check length (AI prefers concise, clear content)
  if (content.length < 50) {
    issues.push('Content too short (minimum 50 characters recommended)');
    score -= 10;
  }
  
  if (content.length > 2000) {
    issues.push('Content too long (consider breaking into sections)');
    score -= 5;
  }
  
  // Check for clear sentences
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
  if (sentences.length < 3) {
    issues.push('Too few sentences (AI prefers multiple clear statements)');
    score -= 10;
  }
  
  // Check for factual content (numbers, specific terms)
  const hasNumbers = /\d/.test(content);
  if (!hasNumbers) {
    issues.push('Consider including specific numbers or statistics');
    score -= 5;
  }
  
  // Check for question-answer format
  const hasQuestion = /\?/.test(content);
  const hasAnswer = content.split(/[.!?]/).some(s => s.length > 20);
  if (hasQuestion && !hasAnswer) {
    issues.push('Questions should be followed by clear answers');
    score -= 10;
  }
  
  // Check readability (average sentence length)
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
  if (avgSentenceLength > 100) {
    issues.push('Sentences too long (AI prefers shorter, clearer sentences)');
    score -= 5;
  }
  
  return {
    isFriendly: score >= 80,
    score: Math.max(0, score),
    issues,
  };
}

