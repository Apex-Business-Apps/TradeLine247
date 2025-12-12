/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { corsHeaders, preflight } from '../cors.ts';
import { mergeHeaders, secureHeaders } from '../secure_headers.ts';
import { validateTwilioSignature } from '../twilio_sig.ts';

const encoder = new TextEncoder();

function btoaFromBuffer(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

describe('HTTP security primitives', () => {
  beforeAll(() => {
    (globalThis as any).Deno = {
      env: {
        get(key: string) {
          if (key === 'TWILIO_AUTH_TOKEN') {
            return process.env.TWILIO_AUTH_TOKEN ?? 'test-token';
          }
          return undefined;
        },
      },
    };
    process.env.TWILIO_AUTH_TOKEN = 'test-token';
  });

  afterAll(() => {
    delete (globalThis as any).Deno;
    delete process.env.TWILIO_AUTH_TOKEN;
  });

  it('handles CORS preflight', () => {
    const res = preflight(new Request('https://example.com', { method: 'OPTIONS' }));
    expect(res).not.toBeNull();
    expect(res?.status).toBe(204);
    expect(res?.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res?.headers.get('Content-Length')).toBe('0');
  });

  it('merges secure headers with custom sets', () => {
    const headers = mergeHeaders(secureHeaders, corsHeaders, { 'X-Test': 'ok' });
    expect(headers['Strict-Transport-Security']).toContain('includeSubDomains');
    expect(headers['X-Test']).toBe('ok');
    expect(headers['Access-Control-Allow-Methods']).toBe('GET,POST,OPTIONS');
  });

  it('rejects invalid Twilio signature', async () => {
    const req = new Request('https://example.com/functions/v1/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'Foo=bar',
    });
    const result = await validateTwilioSignature(req);
    expect(result).toBe(false);
  });

  it('accepts valid Twilio signature', async () => {
    const token = 'test-token';
    const url = 'https://example.com/functions/v1/test';
    const params = new URLSearchParams({ Foo: 'bar', Baz: '1' });
    const body = params.toString();
    let data = url;
    const sorted = [...params.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [key, value] of sorted) {
      data += key + value;
    }
    const key = await crypto.subtle.importKey('raw', encoder.encode(token), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const signature = btoaFromBuffer(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));

    const req = new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature,
      },
      body,
    });

    const result = await validateTwilioSignature(req);
    expect(result).toBe(true);
  });
});
