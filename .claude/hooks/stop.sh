#!/bin/bash
# Stop hook — detect incomplete work
set -euo pipefail

INPUT=$(cat)
REASON=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('reason',''))" 2>/dev/null || echo "")

# Check for TODO markers in recently modified files
if [ "$REASON" = "end_turn" ]; then
  RECENT_TODOS=$(git diff --name-only HEAD 2>/dev/null | head -10 | xargs grep -l "TODO\|FIXME\|HACK" 2>/dev/null | head -3 || true)
  if [ -n "$RECENT_TODOS" ]; then
    echo "Note: TODOs found in modified files: $RECENT_TODOS"
  fi
fi

exit 0
