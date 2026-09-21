#!/usr/bin/env bash
set -euo pipefail

if command -v supabase >/dev/null 2>&1; then
  SUPABASE=(supabase)
elif command -v npx >/dev/null 2>&1; then
  SUPABASE=(npx --yes supabase)
else
  echo "Supabase CLI dan npx belum tersedia." >&2
  exit 1
fi

: "${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF dari URL Supabase sebelum menjalankan script}"

"${SUPABASE[@]}" link --project-ref "$SUPABASE_PROJECT_REF"
"${SUPABASE[@]}" db push
printf '%s\n' "Migration Supabase berhasil dikirim ke project $SUPABASE_PROJECT_REF"
