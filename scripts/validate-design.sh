#!/bin/bash
# Run the mainstream design validator against all source files
echo "Running studypod.ai mainstream design validator..."
echo ""
npx tsx src/lib/design/mainstream-validator.ts "${1:-src/app}"
