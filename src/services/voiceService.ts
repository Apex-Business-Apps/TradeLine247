/**
 * ElevenLabs Text-to-Speech client (server-side only).
 *
 * Reads credentials from environment variables:
 *  - ELEVEN_LABS_API_KEY
 *  - ELEVEN_VOICE_ID
 *  - ELEVEN_MODEL_ID
 *
 * NOTE: Do NOT call this from the browser; keep execution on the server to avoid
 * exposing the API key. Throw if we detect a browser environment.
 */

export interface VoiceOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarity?: number;
  speed?: number;
}

export interface VoiceResponse {
  audio: ArrayBuffer;
  mimeType: string;
}

function getEnv(name: string): string | undefined {
  // Prefer server-side env; fall back to Vite-style env if available.
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[name];
  }
  return undefined;
}

function assertServer() {
  const allowBrowser = getEnv('ALLOW_VOICE_IN_BROWSER');
  if (typeof window !== 'undefined' && allowBrowser !== 'true') {
    throw new Error('voiceService must not be invoked in the browser. Proxy via a server route.');
  }
}

export async function generateSpeech(
  text: string,
  options: VoiceOptions = {}
): Promise<VoiceResponse> {
  assertServer();

  const apiKey = getEnv('ELEVEN_LABS_API_KEY');
  const voiceId = options.voiceId || getEnv('ELEVEN_VOICE_ID');
  const modelId = options.modelId || getEnv('ELEVEN_MODEL_ID') || 'eleven_multilingual_v2';

  if (!apiKey) throw new Error('ELEVEN_LABS_API_KEY is not set');
  if (!voiceId) throw new Error('ELEVEN_VOICE_ID is not set');

  const stability = options.stability ?? 0.7;
  const similarity = options.similarity ?? 0.75;
  const speed = options.speed ?? 1.0;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const body = {
    model_id: modelId,
    text,
    voice_settings: {
      stability,
      similarity_boost: similarity,
      style: 0,
      use_speaker_boost: true,
      speed,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`ElevenLabs TTS failed: ${response.status} ${response.statusText} ${errText}`);
  }

  const audio = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type') || 'audio/mpeg';

  return { audio, mimeType };
}

