#!/bin/bash
# Push the full git history to the Wars-town GitHub repo via SSH.
#
# First run: force-pushes to replace the old squashed snapshots with the real
#            commit history from this Repl.
# Subsequent runs: incremental push (only new commits since last push).
#
# Prerequisites (one-time setup):
#   1. GITHUB_SSH_KEY secret must be set in Replit Secrets with the private key,
#      OR the key file must exist at ~/.ssh/wars_town_github
#   2. The corresponding public key must be added to your GitHub account:
#      https://github.com/settings/ssh/new

set -e

REPO="git@github.com:aboqaht7/Wars-town.git"
WORKDIR="$(cd "$(dirname "$0")" && pwd)"
PERSISTENT_KEY="$HOME/.ssh/wars_town_github"

# ── SSH key setup ────────────────────────────────────────────────────────────

if [ -z "$GITHUB_SSH_KEY" ] && [ ! -f "$PERSISTENT_KEY" ]; then
  echo "❌ GITHUB_SSH_KEY secret is not set and no key found at $PERSISTENT_KEY." >&2
  echo "   Add the SSH private key to Replit Secrets as GITHUB_SSH_KEY." >&2
  exit 1
fi

CLEANUP_KEY=false
if [ -f "$PERSISTENT_KEY" ]; then
  SSH_KEY_FILE="$PERSISTENT_KEY"
else
  SSH_KEY_FILE="$(mktemp)"
  CLEANUP_KEY=true
  printf '%s' "$GITHUB_SSH_KEY" \
    | sed 's/\\n/\n/g' \
    | sed 's/ \(-----\)/\n\1/g; s/\(-----\) /\1\n/g; s/ \([A-Za-z0-9+/=]\{1,\}\) /\n\1\n/g' \
    > "$SSH_KEY_FILE"
  chmod 600 "$SSH_KEY_FILE"
fi

cleanup() {
  [ "$CLEANUP_KEY" = true ] && rm -f "$SSH_KEY_FILE"
}
trap cleanup EXIT

GIT_SSH_CMD="ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=yes -o BatchMode=yes"

# ── Add GitHub host key ───────────────────────────────────────────────────────

mkdir -p ~/.ssh
grep -qF "github.com" ~/.ssh/known_hosts 2>/dev/null || \
  ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null

# ── Test authentication ───────────────────────────────────────────────────────

echo "🔑 Testing SSH connection to GitHub..."
if ! GIT_SSH_COMMAND="$GIT_SSH_CMD" ssh -i "$SSH_KEY_FILE" \
      -o StrictHostKeyChecking=yes -o BatchMode=yes \
      -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  echo "❌ SSH authentication to GitHub failed." >&2
  echo "   Check GITHUB_SSH_KEY secret and ensure the public key is at:" >&2
  echo "   https://github.com/settings/ssh" >&2
  exit 1
fi
echo "   ✓ Authenticated"

# ── Local repo health check and repair ───────────────────────────────────────
# Run before any push attempt so corruption doesn't cause a confusing failure.

cd "$WORKDIR"

echo "🔍 Checking local repo health..."

# 1. Remove any stale .lock files left by interrupted git operations.
#    These cause badRefContent errors and block normal git commands.
LOCK_COUNT=0
while IFS= read -r -d '' lockfile; do
  echo "   🔧 Removing stale lock file: $lockfile"
  rm -f "$lockfile"
  LOCK_COUNT=$((LOCK_COUNT + 1))
done < <(find .git -name "*.lock" -print0 2>/dev/null)
[ "$LOCK_COUNT" -gt 0 ] && echo "   ✓ Removed $LOCK_COUNT stale lock file(s)" || echo "   ✓ No stale lock files"

# 2. Run fsck to detect corruption.  We capture the output; dangling objects
#    are harmless and handled by gc below, so only fatal errors abort the push.
FSCK_OUT="$(git fsck --no-dangling 2>&1)" || true
FSCK_ERRORS="$(echo "$FSCK_OUT" | grep -v "^Checking" | grep -v "^$" | grep -v "notice:" || true)"
if [ -n "$FSCK_ERRORS" ]; then
  echo "   ⚠️  git fsck reported issues:"
  echo "$FSCK_ERRORS" | sed 's/^/      /'

  # Attempt safe auto-repair: prune unreachable objects and repack.
  echo "   🔧 Attempting repair (prune + repack)..."
  git reflog expire --expire=now --all 2>/dev/null || true
  git gc --prune=now --quiet 2>/dev/null || true

  # Re-run fsck to see if repair resolved the issues.
  FSCK_RECHECK="$(git fsck --no-dangling 2>&1 | grep -v "^Checking" | grep -v "^$" | grep -v "notice:" || true)"
  if [ -n "$FSCK_RECHECK" ]; then
    echo "   ❌ Repo still has unresolved corruption after repair attempt:" >&2
    echo "$FSCK_RECHECK" | sed 's/^/      /' >&2
    echo "   Manual recovery may be required. Aborting push." >&2
    exit 1
  fi
  echo "   ✓ Repo repaired successfully"
else
  # No errors — still run gc to clean up any dangling objects quietly.
  git gc --quiet 2>/dev/null || true
  echo "   ✓ Repo is healthy"
fi

# ── Configure the wars-town remote in the real local repo ────────────────────

if git remote get-url wars-town &>/dev/null; then
  git remote set-url wars-town "$REPO"
else
  git remote add wars-town "$REPO"
fi

# Make sure git identity is set (needed in Replit's non-interactive environment)
git config user.email "aboqaht7789@gmail.com" 2>/dev/null || true
git config user.name  "aboqaht7"             2>/dev/null || true

# ── Push real git history ─────────────────────────────────────────────────────

echo "🚀 Pushing git history to Wars-town..."

# Try a normal incremental push first.
PUSH_OUT="$(GIT_SSH_COMMAND="$GIT_SSH_CMD" git push wars-town main 2>&1)" && {
  echo "$PUSH_OUT"
} || {
  PUSH_EXIT=$?
  echo "$PUSH_OUT"

  # Only force-push when the rejection is specifically a non-fast-forward error.
  # This is expected exactly once — when GitHub still holds the old squashed
  # snapshot history from the previous push approach.  Any other failure
  # (auth, network, permission denied, etc.) should abort without force.
  if echo "$PUSH_OUT" | grep -qE "\[rejected\]|non-fast-forward|fetch first"; then
    echo "⚠️  Push rejected due to non-fast-forward (GitHub has old snapshot history)."
    echo "   Force-pushing once to establish the real commit history..."
    GIT_SSH_COMMAND="$GIT_SSH_CMD" git push --force wars-town main
    echo "   ✓ Real history established on GitHub. All future pushes will be incremental."
  else
    echo "❌ Push failed for a non-history reason (see output above). Not force-pushing." >&2
    exit $PUSH_EXIT
  fi
}

echo "✅ Done! Check https://github.com/aboqaht7/Wars-town"
