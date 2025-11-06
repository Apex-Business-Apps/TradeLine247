/**
 * Client-Side Input Validation & Sanitization
 * 
 * Provides comprehensive input validation for XSS, injection, and data integrity.
 * Complements server-side validation.
 */

/**
 * Sanitize HTML content (prevents XSS)
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitize text input (removes dangerous characters)
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  // Length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove dangerous patterns
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase().trim());
}

/**
 * Validate phone number (E.164 format)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // E.164 format: +[country code][number]
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validate URL
 */
export function validateUrl(url: string, allowRelative = false): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url, allowRelative ? window.location.origin : undefined);
    // Only allow http/https
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Detect potentially malicious content
 */
export function detectMaliciousContent(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const maliciousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /union.*select/gi,
    /insert.*into/gi,
    /delete.*from/gi,
    /drop.*table/gi,
    /\.\.\//g, // Path traversal
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize name input
 */
export function validateAndSanitizeName(name: string, maxLength = 100): string | null {
  if (!name || typeof name !== 'string') return null;
  
  const sanitized = sanitizeText(name, maxLength);
  
  // Allow only alphanumeric, spaces, hyphens, apostrophes, and common punctuation
  const nameRegex = /^[a-zA-Z0-9\s\-'.,()&]+$/;
  if (!nameRegex.test(sanitized)) return null;
  
  // Check for malicious content
  if (detectMaliciousContent(name)) return null;
  
  return sanitized.trim();
}

/**
 * Validate form input
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

export function validateFormInput(
  value: string,
  type: 'text' | 'email' | 'phone' | 'url' | 'name',
  options: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
  } = {}
): ValidationResult {
  const errors: string[] = [];
  const { required = false, maxLength, minLength } = options;
  
  // Required check
  if (required && (!value || value.trim().length === 0)) {
    errors.push('This field is required');
    return { isValid: false, errors };
  }
  
  // If not required and empty, it's valid
  if (!value || value.trim().length === 0) {
    return { isValid: true, errors: [], sanitized: '' };
  }
  
  // Length checks
  if (minLength && value.length < minLength) {
    errors.push(`Minimum length is ${minLength} characters`);
  }
  if (maxLength && value.length > maxLength) {
    errors.push(`Maximum length is ${maxLength} characters`);
  }
  
  // Type-specific validation
  let sanitized: string | null = null;
  
  switch (type) {
    case 'email':
      if (!validateEmail(value)) {
        errors.push('Invalid email format');
      } else {
        sanitized = value.toLowerCase().trim();
      }
      break;
      
    case 'phone':
      if (!validatePhone(value)) {
        errors.push('Invalid phone format. Use E.164 format (e.g., +1234567890)');
      } else {
        sanitized = value.trim();
      }
      break;
      
    case 'url':
      if (!validateUrl(value)) {
        errors.push('Invalid URL format. Must be http:// or https://');
      } else {
        sanitized = value.trim();
      }
      break;
      
    case 'name':
      sanitized = validateAndSanitizeName(value, maxLength);
      if (!sanitized) {
        errors.push('Invalid name format');
      }
      break;
      
    case 'text':
    default:
      if (detectMaliciousContent(value)) {
        errors.push('Invalid characters detected');
      } else {
        sanitized = sanitizeText(value, maxLength || 1000);
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitized || undefined,
  };
}

