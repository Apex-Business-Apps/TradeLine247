/**
 * SEO Optimizer Utilities
 * 
 * Helper functions to ensure SEO best practices:
 * - Title optimization (50-60 chars)
 * - Description optimization (150-160 chars)
 * - Alt text generation
 * - URL validation
 * - Content analysis
 * 
 * Target: >95 Lighthouse SEO Score
 */

/**
 * Optimize title for SEO (50-60 characters optimal)
 */
export function optimizeTitle(title: string, maxLength: number = 60): string {
  if (title.length <= maxLength) return title;
  
  // Try to cut at word boundary
  const truncated = title.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    // Only truncate at word boundary if we keep >70% of the title
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Optimize meta description (150-160 characters optimal)
 */
export function optimizeDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) return description;
  
  // Try to cut at sentence boundary first
  const sentences = description.match(/[^.!?]+[.!?]+/g);
  if (sentences) {
    let result = '';
    for (const sentence of sentences) {
      if ((result + sentence).length <= maxLength) {
        result += sentence;
      } else {
        break;
      }
    }
    if (result.length >= maxLength * 0.7) {
      return result.trim();
    }
  }
  
  // Fallback to word boundary
  const truncated = description.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Generate SEO-friendly alt text
 */
export function generateAltText(
  imageName: string,
  context?: string,
  objectName?: string
): string {
  // Remove file extension and clean up
  const cleanName = imageName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
  
  if (objectName) {
    return `${objectName}: ${cleanName}`;
  }
  
  if (context) {
    return `${context} - ${cleanName}`;
  }
  
  return cleanName;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return url.startsWith('/'); // Relative URLs are valid
  }
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Common stop words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  ]);
  
  // Extract words (alphanumeric only, lowercase)
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
  
  // Count frequency
  const frequency: Record<string, number> = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }
  
  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Check if heading hierarchy is valid
 */
export function validateHeadingHierarchy(headings: Array<{ level: number; text: string }>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let previousLevel = 0;
  
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    
    // First heading should be h1
    if (i === 0 && heading.level !== 1) {
      errors.push('First heading should be h1');
    }
    
    // Skip more than one level
    if (heading.level > previousLevel + 1 && previousLevel > 0) {
      errors.push(`Heading ${i + 1} (h${heading.level}) skips level(s) after h${previousLevel}`);
    }
    
    previousLevel = heading.level;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate breadcrumb schema data
 */
export function generateBreadcrumbs(path: string, titles: Record<string, string>): Array<{ name: string; url: string }> {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: Array<{ name: string; url: string }> = [
    { name: 'Home', url: '/' },
  ];
  
  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      name: titles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      url: currentPath,
    });
  }
  
  return breadcrumbs;
}

/**
 * Check if content has proper semantic HTML
 */
export function checkSemanticHTML(html: string): {
  hasMain: boolean;
  hasHeader: boolean;
  hasFooter: boolean;
  hasNav: boolean;
  hasArticle: boolean;
  hasSection: boolean;
  score: number;
} {
  const checks = {
    hasMain: /<main[^>]*>/i.test(html),
    hasHeader: /<header[^>]*>/i.test(html),
    hasFooter: /<footer[^>]*>/i.test(html),
    hasNav: /<nav[^>]*>/i.test(html),
    hasArticle: /<article[^>]*>/i.test(html),
    hasSection: /<section[^>]*>/i.test(html),
  };
  
  const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100;
  
  return { ...checks, score };
}

