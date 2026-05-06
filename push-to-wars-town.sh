#!/bin/bash
# Push the full codebase to the Wars-town GitHub repo via SSH.
#
# Prerequisites (one-time setup):
#   1. GITHUB_SSH_KEY secret must be set in Replit Secrets with the private key.
#   2. The corresponding public key must be added to your GitHub account:
#      https://github.com/settings/ssh/new
set -e

REPO="git@github.com:aboqaht7/Wars-town.git"
WORKDIR="$(cd "$(dirname "$0")" && pwd)"
PERSISTENT_KEY="$HOME/.ssh/wars_town_github"

# Validate that the SSH key secret is set
if [ -z "$GITHUB_SSH_KEY" ] && [ ! -f "$PERSISTENT_KEY" ]; then
  echo "❌ GITHUB_SSH_KEY secret is not set and no key found at $PERSISTENT_KEY." >&2
  echo "   Add the SSH private key to Replit Secrets as GITHUB_SSH_KEY." >&2
  exit 1
fi

# Prefer the persistent key file if it exists (avoids libcrypto encoding issues).
# Otherwise reconstruct it from the secret.
if [ -f "$PERSISTENT_KEY" ]; then
  SSH_KEY_FILE="$PERSISTENT_KEY"
  CLEANUP_KEY=false
else
  SSH_KEY_FILE="$(mktemp)"
  CLEANUP_KEY=true
  # Normalize: handle literal \n and spaces-instead-of-newlines variants
  printf '%s' "$GITHUB_SSH_KEY" \
    | sed 's/\\n/\n/g' \
    | sed 's/ \(-----\)/\n\1/g; s/\(-----\) /\1\n/g; s/ \([A-Za-z0-9+/=]\{1,\}\) /\n\1\n/g' \
    > "$SSH_KEY_FILE"
  chmod 600 "$SSH_KEY_FILE"
fi

cleanup() {
  [ "$CLEANUP_KEY" = true ] && rm -f "$SSH_KEY_FILE"
  rm -rf "${TMP_DIR:-}"
}
trap cleanup EXIT

# Add GitHub's known host key to avoid interactive prompt
mkdir -p ~/.ssh
grep -qF "github.com" ~/.ssh/known_hosts 2>/dev/null || \
  ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null

GIT_SSH="ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=yes"

echo "🔑 Testing SSH connection to GitHub..."
if ! GIT_SSH_COMMAND="$GIT_SSH" ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=yes -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  echo "❌ SSH authentication to GitHub failed. Check that GITHUB_SSH_KEY is correct" >&2
  echo "   and the public key is added at https://github.com/settings/ssh" >&2
  exit 1
fi
echo "   ✓ Authenticated"

echo "📦 Preparing clean copy of codebase..."
TMP_DIR="$(mktemp -d)"

cp -r "$WORKDIR/." "$TMP_DIR/"
rm -rf "$TMP_DIR/.git"

cd "$TMP_DIR"
git init -b main
git config user.email "aboqaht7789@gmail.com"
git config user.name "aboqaht7"
git add -A
git commit -q -m "Wars-town bot update - $(date '+%Y-%m-%d %H:%M')"

echo "🚀 Pushing to Wars-town..."
# --force is intentional: this script mirrors the current codebase snapshot
# to GitHub each run. Git history is not preserved by design (fresh init each time).
GIT_SSH_COMMAND="$GIT_SSH" git push --force "$REPO" main

echo "✅ Done! Check https://github.com/aboqaht7/Wars-town"
