#!/bin/bash
# Notification hook — macOS desktop notifications
set -euo pipefail

INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message','Claude Code notification'))" 2>/dev/null || echo "Claude Code notification")

# Escape quotes for AppleScript
SAFE_MSG=$(echo "$MESSAGE" | sed 's/"/\\"/g' | head -c 200)

osascript -e "display notification \"$SAFE_MSG\" with title \"studypod.ai\"" 2>/dev/null || true

exit 0
