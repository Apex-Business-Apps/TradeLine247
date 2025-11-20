import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { detectSafeModeFromSearch, enableSafeModeSideEffects, SAFE_MODE_LOG } from '../safeMode';

describe('safeMode helpers', () => {
  beforeEach(() => {
    document.body.removeAttribute('data-safe-mode');
    document.documentElement.removeAttribute('data-safe');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.removeAttribute('data-safe-mode');
    document.documentElement.removeAttribute('data-safe');
  });

  it('detects safe mode flag from search string', () => {
    expect(detectSafeModeFromSearch('?safe=1')).toBe(true);
    expect(detectSafeModeFromSearch('?safe=0')).toBe(false);
    expect(detectSafeModeFromSearch('')).toBe(false);
  });

  it('applies DOM side effects exactly once', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    enableSafeModeSideEffects();

    expect(document.body.dataset.safeMode).toBe('true');
    expect(document.documentElement.getAttribute('data-safe')).toBe('1');
    expect(infoSpy).toHaveBeenCalledWith(SAFE_MODE_LOG);

    infoSpy.mockClear();
    enableSafeModeSideEffects();
    expect(infoSpy).not.toHaveBeenCalled();
  });
});

