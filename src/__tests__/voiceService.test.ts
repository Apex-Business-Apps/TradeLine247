import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSpeech } from '../services/voiceService';

const mockAudio = new Uint8Array([1, 2, 3]).buffer;

describe('voiceService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.ELEVEN_LABS_API_KEY = 'test-key';
    process.env.ELEVEN_VOICE_ID = 'voice-123';
    process.env.ELEVEN_MODEL_ID = 'eleven_multilingual_v2';
    process.env.ALLOW_VOICE_IN_BROWSER = 'true';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => mockAudio,
      headers: { get: () => 'audio/mpeg' },
      status: 200,
      statusText: 'OK',
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('calls ElevenLabs with correct payload and returns audio buffer', async () => {
    const result = await generateSpeech('Hello world', {
      stability: 0.7,
      similarity: 0.75,
      speed: 1.05,
    });

    expect(result.audio).toEqual(mockAudio);
    expect(result.mimeType).toBe('audio/mpeg');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/text-to-speech/voice-123'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'xi-api-key': 'test-key',
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});

