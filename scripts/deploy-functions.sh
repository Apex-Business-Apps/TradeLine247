#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Please install it from https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

supabase functions deploy ops-voice-config-update
supabase functions deploy secure-analytics
supabase functions deploy send-lead-email

supabase functions logs --follow
