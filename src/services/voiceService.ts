/**
 * ElevenLabs Text-to-Speech client (server-side only).
 *
 * NOTE: Do NOT call this from the browser; keep execution on the server to avoid
 * exposing the API key. Throw if we detect a browser environment.
 */

import { getElevenConfig } from './elevenEnv';

function getEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  return undefined;
}

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

  const { apiKey, voiceId: defaultVoiceId, modelId: defaultModelId } = getElevenConfig();
  const voiceId = options.voiceId || defaultVoiceId;
  const modelId = options.modelId || defaultModelId;

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
      'xi-api-key': apiKey!,
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

