#!/bin/bash
# Run this once from the Replit Shell to push the full codebase to Wars-town
set -e

echo "➕ Adding Wars-town remote..."
git remote add wars-town https://github.com/aboqaht7/Wars-town.git 2>/dev/null \
  || git remote set-url wars-town https://github.com/aboqaht7/Wars-town.git

echo "🚀 Pushing to Wars-town..."
git push wars-town main

echo "✅ Done! Check https://github.com/aboqaht7/Wars-town"
