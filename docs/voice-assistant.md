# Voice Assistant Pipeline (ElevenLabs + Sentiment)

## Overview
- Sentiment is computed via the lightweight `sentiment` npm package (`src/services/sentimentService.ts`).
- Empathy cues are injected before the response text (`voicePipeline.ts`) to guide prosody.
- ElevenLabs TTS is called server-side via `src/services/voiceService.ts`.
- Keep UI unchanged; this pipeline is backend/audio only.

## Environment
Set these in CI/secrets (GitHub Actions or Codemagic):
```
ELEVEN_LABS_API_KEY=...
ELEVEN_VOICE_ID=...
ELEVEN_MODEL_ID=eleven_multilingual_v2    # e.g., multilingual v2 or flash v2.5
```
Do not expose them to the browser. The service will throw if executed client-side.

## Usage
```ts
import { synthesizeEmpatheticSpeech } from '@/services/voicePipeline';

const { voice, sentiment, text } = await synthesizeEmpatheticSpeech(
  transcriptText,
  llmResponseText,
  { stability: 0.7, similarity: 0.75 }
);
// voice.audio is an ArrayBuffer (audio/mpeg). Stream/play via audio element or native bridge.
```

Empathy cues:
- negative → “I’m sorry to hear that.”
- positive → “That’s great to hear!”
- neutral → no prefix

## Tuning
- Stability (0..1): higher = steadier delivery. Default 0.7.
- Similarity (0..1): higher = closer to reference voice. Default 0.75.
- Speed: optional multiplier (default 1.0).

## Testing
- Unit tests cover sentiment classification and ElevenLabs request shape (mocked fetch).
- Run: `npm run lint && npm run typecheck && npm run test`.

## Playbook: Voice Assistant Deployment (APEX)
- **When**: shipping/updating voice assistant TTS + empathy.
- **Goal**: empathetic, low-latency speech with ElevenLabs and sentiment mapping.
- **Preconditions**: ELEVEN_* secrets set in CI; staging key verified; tests passing.
- **Steps**:
  1) Configure ELEVEN_* secrets in GitHub/Codemagic (no .env committed).
  2) Run `npm run lint && npm run typecheck && npm run test`.
  3) Deploy as usual (Goodbuild/Codemagic); verify audio on staging with pos/neg inputs.
  4) Monitor logs for TTS errors; roll back if failures spike.
- **Owner**: Voice/AI squad.
- **Gotchas**: Never call `generateSpeech` in-browser; rotate keys on leakage; adjust stability/similarity to balance naturalness vs consistency.

