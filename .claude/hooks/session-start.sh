#!/bin/bash
# SessionStart hook — inject studypod.ai project context
set -euo pipefail

INPUT=$(cat)
SOURCE=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('source',''))" 2>/dev/null || echo "")

if [ "$SOURCE" = "startup" ]; then
  cat <<'CONTEXT'
{
  "additionalContext": "studypod.ai project context:\n- Port: 3000 (default Next.js)\n- Colors: Primary #6C3AED (purple), Accent #10B981 (green), Background #0F172A (dark), Surface #1E293B\n- Font: Inter (loaded via next/font/google)\n- Dark mode default (class 'dark' on html)\n- All corners rounded-2xl\n- Tailwind v4 (CSS-based config in globals.css @theme inline)\n- Supabase for auth + DB\n- Gemini 3-Flash for AI research\n- Hybrid TTS: Edge TTS (female) + Google Cloud TTS (male)"
}
CONTEXT
elif [ "$SOURCE" = "resume" ]; then
  echo '{"additionalContext": "studypod.ai: port 3000, purple #6C3AED, dark mode, Tailwind v4, Supabase, Gemini"}'
else
  echo '{}'
fi

exit 0
