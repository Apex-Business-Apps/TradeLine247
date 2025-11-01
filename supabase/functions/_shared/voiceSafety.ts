// Voice AI Safety Guardrails & Content Filtering
// Enterprise-grade safety for voice conversations

export interface SafetyConfig {
  content_filter: boolean;
  profanity_block: boolean;
  sentiment_tracking: boolean;
  escalation_triggers: string[];
  forbidden_topics?: string[];
  max_conversation_time_seconds?: number;
  max_turns?: number;
  sentiment_threshold_negative?: number;
}

export interface SafetyCheckResult {
  safe: boolean;
  action: 'allow' | 'escalate' | 'block' | 'redirect';
  reason?: string;
  confidence?: number;
  sentiment_score?: number;
}

// Common profanity patterns (basic - can be expanded)
const PROFANITY_PATTERNS = [
  /\b(fuck|shit|damn|ass|bitch|bastard|crap)\b/gi,
  // Add more patterns as needed
];

// Escalation trigger keywords
export function checkEscalationTriggers(
  text: string,
  triggers: string[]
): boolean {
  const lowerText = text.toLowerCase();
  return triggers.some(trigger => lowerText.includes(trigger.toLowerCase()));
}

// Basic profanity detection
export function containsProfanity(text: string): boolean {
  return PROFANITY_PATTERNS.some(pattern => pattern.test(text));
}

// Simple sentiment analysis (can be enhanced with ML model)
export function analyzeSentiment(text: string): number {
  // Simple keyword-based sentiment (range: -1 to 1)
  const positive = ['great', 'excellent', 'thank', 'appreciate', 'happy', 'good', 'perfect', 'wonderful', 'love', 'helpful'];
  const negative = ['terrible', 'awful', 'horrible', 'frustrated', 'angry', 'upset', 'disappointed', 'hate', 'bad', 'worst', 'sucks'];
  
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let score = 0;
  words.forEach(word => {
    if (positive.includes(word)) score += 0.1;
    if (negative.includes(word)) score -= 0.2;
  });
  
  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, score));
}

// Main safety check function
export function performSafetyCheck(
  text: string,
  config: SafetyConfig,
  conversationMetadata?: {
    duration_seconds?: number;
    turn_count?: number;
    sentiment_history?: number[];
  }
): SafetyCheckResult {
  // Check escalation triggers first (highest priority)
  if (checkEscalationTriggers(text, config.escalation_triggers || [])) {
    return {
      safe: false,
      action: 'escalate',
      reason: 'Escalation trigger detected',
      confidence: 0.95
    };
  }

  // Check profanity
  if (config.profanity_block && containsProfanity(text)) {
    return {
      safe: false,
      action: 'redirect',
      reason: 'Inappropriate language detected',
      confidence: 0.9
    };
  }

  // Check forbidden topics
  if (config.forbidden_topics) {
    const lowerText = text.toLowerCase();
    const matchedTopic = config.forbidden_topics.find(topic =>
      lowerText.includes(topic.toLowerCase())
    );
    if (matchedTopic) {
      return {
        safe: false,
        action: 'redirect',
        reason: `Forbidden topic detected: ${matchedTopic}`,
        confidence: 0.85
      };
    }
  }

  // Check conversation limits
  if (conversationMetadata) {
    if (config.max_conversation_time_seconds && 
        conversationMetadata.duration_seconds && 
        conversationMetadata.duration_seconds > config.max_conversation_time_seconds) {
      return {
        safe: false,
        action: 'escalate',
        reason: 'Maximum conversation time exceeded',
        confidence: 1.0
      };
    }

    if (config.max_turns && 
        conversationMetadata.turn_count && 
        conversationMetadata.turn_count > config.max_turns) {
      return {
        safe: false,
        action: 'escalate',
        reason: 'Maximum turn count exceeded',
        confidence: 1.0
      };
    }
  }

  // Sentiment analysis
  let sentimentScore: number | undefined;
  if (config.sentiment_tracking) {
    sentimentScore = analyzeSentiment(text);
    
    // Check negative sentiment threshold
    if (config.sentiment_threshold_negative !== undefined && 
        sentimentScore < config.sentiment_threshold_negative) {
      return {
        safe: true,
        action: 'escalate',
        reason: 'Negative sentiment threshold exceeded',
        confidence: 0.7,
        sentiment_score: sentimentScore
      };
    }
  }

  // All checks passed
  return {
    safe: true,
    action: 'allow',
    sentiment_score: sentimentScore
  };
}

// Sanitize text for logging (remove PII)
export function sanitizeForLogging(text: string): string {
  // Remove phone numbers (E.164 format)
  let sanitized = text.replace(/\+\d{10,15}/g, '[PHONE]');
  // Remove email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  // Remove credit card patterns (basic)
  sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');
  return sanitized;
}

