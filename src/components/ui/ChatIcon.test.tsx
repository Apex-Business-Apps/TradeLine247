/**
 * ChatIcon Component Tests
 * Ensures ChatIcon works correctly and doesn't break tests
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChatIcon } from './ChatIcon';

describe('ChatIcon', () => {
  it('should render without crashing', () => {
    const { container } = render(<ChatIcon />);
    expect(container).toBeDefined();
  });

  it('should render with correct src', () => {
    const { container } = render(<ChatIcon />);
    const img = container.querySelector('img');
    expect(img).toBeDefined();
    expect(img?.getAttribute('src')).toBe('/assets/brand/TRADELEINE_ROBOT_V2.svg');
  });

  it('should apply size classes correctly', () => {
    const { container: sm } = render(<ChatIcon size="sm" />);
    expect(sm.querySelector('img')?.className).toContain('w-4 h-4');

    const { container: md } = render(<ChatIcon size="md" />);
    expect(md.querySelector('img')?.className).toContain('w-6 h-6');

    const { container: lg } = render(<ChatIcon size="lg" />);
    expect(lg.querySelector('img')?.className).toContain('w-8 h-8');

    const { container: xl } = render(<ChatIcon size="xl" />);
    expect(xl.querySelector('img')?.className).toContain('w-12 h-12');
  });

  it('should have proper alt text', () => {
    const { container } = render(<ChatIcon />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('TradeLine 24/7 AI Assistant');
  });

  it('should allow custom alt text', () => {
    const { container } = render(<ChatIcon alt="Custom alt" />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Custom alt');
  });

  it('should apply custom className', () => {
    const { container } = render(<ChatIcon className="custom-class" />);
    const img = container.querySelector('img');
    expect(img?.className).toContain('custom-class');
  });
});

