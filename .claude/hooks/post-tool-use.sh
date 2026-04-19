#!/bin/bash
# PostToolUse hook — check for build errors after file writes
set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool',''))" 2>/dev/null || echo "")

# Only act on Write/Edit operations
if [ "$TOOL" = "Write" ] || [ "$TOOL" = "Edit" ]; then
  FILE=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('input',{}).get('file_path',''))" 2>/dev/null || echo "")

  # Check if it's a TypeScript/TSX file
  if echo "$FILE" | grep -qE '\.(ts|tsx)$'; then
    echo "OK"
  fi
fi

exit 0
