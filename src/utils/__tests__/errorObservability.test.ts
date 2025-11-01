/**
 * Error Observability Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initErrorObservability, captureError } from '../errorObservability';

describe('errorObservability', () => {
  let originalConsoleError: typeof console.error;
  let originalConsoleInfo: typeof console.info;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalConsoleError = console.error;
    originalConsoleInfo = console.info;
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    
    // Mock import.meta.env
    (import.meta as any).env = { MODE: 'test' };
  });

  afterEach(() => {
    errorSpy.mockRestore();
    infoSpy.mockRestore();
    console.error = originalConsoleError;
    console.info = originalConsoleInfo;
    
    // Clean up event listeners
    const listeners = (window as any).__errorListeners || [];
    listeners.forEach((listener: any) => {
      window.removeEventListener('error', listener.listener);
      window.removeEventListener('unhandledrejection', listener.listener);
    });
    (window as any).__errorListeners = [];
  });

  describe('initErrorObservability', () => {
    it('should initialize error handlers', () => {
      initErrorObservability();
      
      expect(infoSpy).toHaveBeenCalledWith('[ERROR OBSERVABILITY] Initialized successfully');
    });

    it('should capture uncaught errors', () => {
      initErrorObservability();
      
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at test.js:1:1';
      
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        error,
        filename: 'test.js',
        lineno: 1,
        colno: 1,
      });
      
      window.dispatchEvent(errorEvent);
      
      expect(errorSpy).toHaveBeenCalled();
      const callArgs = errorSpy.mock.calls[0][0];
      expect(callArgs).toBe('[ERROR CAPTURE]');
    });

    it('should capture unhandled promise rejections', () => {
      initErrorObservability();

      const rejection = new Error('Unhandled rejection');

      const event = new Event('unhandledrejection');
      Object.defineProperty(event, 'reason', { value: rejection });

      window.dispatchEvent(event as any);

      expect(errorSpy).toHaveBeenCalledWith(
        '[ERROR CAPTURE]',
        expect.objectContaining({
          message: expect.stringContaining('Unhandled Promise Rejection'),
        })
      );
    });

    it('should include environment in error logs', () => {
      initErrorObservability();
      
      const error = new Error('Test error');
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        error,
        filename: 'test.js',
      });
      
      window.dispatchEvent(errorEvent);
      
      expect(errorSpy).toHaveBeenCalled();
      const callArgs = errorSpy.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        environment: 'test',
      });
    });
  });

  describe('captureError', () => {
    it('should capture errors with context', () => {
      const error = new Error('Manual error');
      error.stack = 'Error: Manual error\n  at test.js:1:1';
      
      captureError(error, { userId: '123', action: 'test-action' });
      
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('Error without stack');
      delete (error as any).stack;
      
      captureError(error);
      
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should include custom context in error logs', () => {
      const error = new Error('Context error');
      const context = { userId: '456', feature: 'dashboard' };
      
      captureError(error, context);
      
      expect(errorSpy).toHaveBeenCalled();
      const callArgs = errorSpy.mock.calls[0];
      expect(callArgs[1]).toMatchObject(context);
    });
  });
});
