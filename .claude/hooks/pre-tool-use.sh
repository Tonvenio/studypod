#!/bin/bash
# PreToolUse hook — block dangerous commands
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('input',{}).get('command',''))" 2>/dev/null || echo "")

# Block dangerous commands
if echo "$COMMAND" | grep -qE '(rm\s+-rf\s+/|git\s+push\s+--force|git\s+reset\s+--hard|DROP\s+TABLE|DROP\s+DATABASE)'; then
  echo '{"decision": "block", "reason": "Blocked: destructive command detected"}'
  exit 0
fi

echo '{"decision": "approve"}'
exit 0
