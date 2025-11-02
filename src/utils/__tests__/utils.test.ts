/**
 * Utility Functions Tests
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (class name utility)', () => {
  it('should merge class names correctly', () => {
    const result = cn('foo', 'bar');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('should handle conditional classes', () => {
    const shouldAddBar = false;
    const result = cn('foo', shouldAddBar && 'bar', 'baz');
    expect(result).toContain('foo');
    expect(result).toContain('baz');
    expect(result).not.toContain('bar');
  });

  it('should handle undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('should merge Tailwind classes with conflicts', () => {
    // Tailwind merge should resolve conflicts (last one wins)
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
    expect(result).toContain('baz');
  });

  it('should handle objects with truthy values', () => {
    const result = cn({ foo: true, bar: false, baz: true });
    expect(result).toContain('foo');
    expect(result).toContain('baz');
    expect(result).not.toContain('bar');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should merge complex class combinations', () => {
    const shouldHide = false;
    const result = cn(
      'base-class',
      { 'conditional-class': true },
      shouldHide && 'hidden-class',
      ['array-class-1', 'array-class-2'],
      'final-class'
    );
    
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
    expect(result).toContain('array-class-1');
    expect(result).toContain('array-class-2');
    expect(result).toContain('final-class');
    expect(result).not.toContain('hidden-class');
  });
});

