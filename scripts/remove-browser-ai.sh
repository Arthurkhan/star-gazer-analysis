#!/bin/bash

# Script to remove browser AI files from the project

echo "Removing browser AI files..."

# Navigate to the project root
cd "$(git rev-parse --show-toplevel)"

# Remove browser AI files
rm -f src/services/ai/browserAI.ts
rm -f src/services/ai/BrowserAIService.ts
rm -f src/services/ai/browserAIService.ts
rm -f src/services/ai/ai-worker.js
rm -f src/services/ai/aiWorker.ts
rm -f src/services/ai/worker.ts

echo "Browser AI files removed successfully"

# Stage the deletions
git add -A

echo "Files staged for deletion"
