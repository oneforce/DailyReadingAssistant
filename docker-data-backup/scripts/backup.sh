#!/bin/bash
# ============================================================
# backup.sh - PocketBase data export → Git push -f pipeline
# No clone needed. Init a local repo and force-push each day.
# ============================================================
set -euo pipefail

REPO_DIR="/app/backup-repo"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
TODAY=$(date '+%Y%m%d')
BRANCH_NAME="pocket-data-backup-${TODAY}"
BRANCH_PREFIX="pocket-data-backup-"
RETENTION_DAYS=30

echo ""
echo "${LOG_PREFIX} =========================================="
echo "${LOG_PREFIX}  Starting PocketBase Backup Pipeline"
echo "${LOG_PREFIX} =========================================="

# ----------------------------------------------------------
# Step 1: Prepare local Git workspace (no clone)
# ----------------------------------------------------------
echo "${LOG_PREFIX} [1/5] Preparing local Git workspace..."

mkdir -p "${REPO_DIR}"
cd "${REPO_DIR}"

if [ ! -d ".git" ]; then
    git init
    git remote add origin "${GIT_REPO_URL}"
    echo "${LOG_PREFIX}   Initialized new local repo"
else
    echo "${LOG_PREFIX}   Local repo already initialized"
fi

# ----------------------------------------------------------
# Step 2: Export PocketBase data
# ----------------------------------------------------------
echo "${LOG_PREFIX} [2/5] Exporting PocketBase data..."
cd /app
node scripts/export-data.mjs

# ----------------------------------------------------------
# Step 3: Commit locally
# ----------------------------------------------------------
echo "${LOG_PREFIX} [3/5] Committing..."
cd "${REPO_DIR}"

git add -A
if git diff --cached --quiet; then
    echo "${LOG_PREFIX}   No changes detected, skipping commit."
else
    git commit -m "backup: PocketBase data export ${TODAY} $(date '+%H:%M:%S')"
    echo "${LOG_PREFIX}   ✅ Committed"
fi

# ----------------------------------------------------------
# Step 4: Force push to dated branch
# ----------------------------------------------------------
echo "${LOG_PREFIX} [4/5] Force pushing to origin/${BRANCH_NAME}..."
git push -f origin "HEAD:${BRANCH_NAME}"
echo "${LOG_PREFIX}   ✅ Pushed to origin/${BRANCH_NAME}"

# ----------------------------------------------------------
# Step 5: Cleanup old branches (older than RETENTION_DAYS)
# ----------------------------------------------------------
echo "${LOG_PREFIX} [5/5] Cleaning up branches older than ${RETENTION_DAYS} days..."

# Calculate cutoff date using epoch arithmetic (BusyBox compatible)
CUTOFF_EPOCH=$(( $(date +%s) - RETENTION_DAYS * 86400 ))
CUTOFF_DATE=$(date -u -d "@${CUTOFF_EPOCH}" '+%Y%m%d' 2>/dev/null || date -u -r "${CUTOFF_EPOCH}" '+%Y%m%d')

# List remote backup branches via ls-remote (no fetch needed)
REMOTE_BRANCHES=$(git ls-remote --heads origin "${BRANCH_PREFIX}*" 2>/dev/null | awk '{print $2}' | sed 's|refs/heads/||')

DELETED_COUNT=0
for branch in ${REMOTE_BRANCHES}; do
    # Extract date from branch name (pocket-data-backup-YYYYMMDD)
    branch_date=$(echo "${branch}" | sed "s/${BRANCH_PREFIX}//")

    # Validate date format (8 digits)
    if [[ ! "${branch_date}" =~ ^[0-9]{8}$ ]]; then
        echo "${LOG_PREFIX}   ⚠️  Skipping non-standard branch: ${branch}"
        continue
    fi

    if [[ "${branch_date}" < "${CUTOFF_DATE}" ]]; then
        echo "${LOG_PREFIX}   🗑️  Deleting old branch: ${branch} (date: ${branch_date})"
        git push origin --delete "${branch}" 2>/dev/null || true
        DELETED_COUNT=$((DELETED_COUNT + 1))
    fi
done

echo "${LOG_PREFIX}   Deleted ${DELETED_COUNT} old branch(es)"

echo ""
echo "${LOG_PREFIX} =========================================="
echo "${LOG_PREFIX}  ✅ Backup Pipeline Complete"
echo "${LOG_PREFIX} =========================================="
echo ""
