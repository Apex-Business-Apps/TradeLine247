const warnedKeys = new Set<string>();

function warnOnce(key: string, message: string) {
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(message);
}

function resolveConfig() {
  const apiKey =
    process.env.ELEVEN_LABS_API_KEY ??
    process.env.ELEVENLABS_API_KEY ??
    null;

  const modelId = process.env.ELEVEN_MODEL_ID ?? 'eleven_multilingual_v2';
  const voiceId = process.env.ELEVEN_VOICE_ID ?? null;

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    if (!apiKey) {
      throw new Error(
        'ElevenLabs API key missing. Set ELEVENLABS_API_KEY or ELEVEN_LABS_API_KEY on the backend.'
      );
    }
    if (!voiceId) {
      throw new Error(
        'ELEVEN_VOICE_ID is missing. Set it to the default TradeLine receptionist voice id on the backend.'
      );
    }
  } else {
    if (!apiKey) {
      warnOnce(
        'ELEVEN_API_KEY',
        'ElevenLabs API key missing (ELEVENLABS_API_KEY or ELEVEN_LABS_API_KEY). Set it on the backend.'
      );
    }
    if (!voiceId) {
      warnOnce(
        'ELEVEN_VOICE_ID',
        'ELEVEN_VOICE_ID is missing. Set it to the TradeLine receptionist voice id on the backend.'
      );
    }
  }

  return {
    apiKey,
    modelId,
    voiceId,
  };
}

export function getElevenConfig() {
  return resolveConfig();
}


