# ElevenLabs Voice Config (TradeLine 24/7)

Required backend env vars:

- `ELEVENLABS_API_KEY` or `ELEVEN_LABS_API_KEY` — ElevenLabs API key (server only).
- `ELEVEN_VOICE_ID` — default TradeLine receptionist voice id (server only).
- `ELEVEN_MODEL_ID` (optional) — defaults to `eleven_multilingual_v2` if unset.

Notes:
- These env vars MUST be set only on backend runtimes (no `VITE_` prefix).
- Frontend must never call ElevenLabs directly; it calls backend voice endpoints instead.
- Do not expose these values to client bundles, mobile apps, or logs.





