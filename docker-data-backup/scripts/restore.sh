#!/bin/bash
# ============================================================
# restore.sh - Restore PocketBase data from Git backup
#
# Usage:
#   ./restore.sh [BRANCH_NAME]
#
# Examples:
#   ./restore.sh                              # Restore from latest backup
#   ./restore.sh pocket-data-backup-20260401  # Restore from specific date
#
# Environment variables:
#   PB_RESTORE_API_URL        → PB_API_URL        (fallback)
#   PB_RESTORE_ADMIN_EMAIL    → PB_ADMIN_EMAIL    (fallback)
#   PB_RESTORE_ADMIN_PASSWORD → PB_ADMIN_PASSWORD (fallback)
#   GIT_REPO_URL      - Git repository URL
# ============================================================
set -euo pipefail

BRANCH=${1:-""}
REPO_DIR="/tmp/restore-repo"
BRANCH_PREFIX="pocket-data-backup-"

# Resolve restore target: prefer PB_RESTORE_* (target B), fallback PB_* (source A)
RESTORE_URL="${PB_RESTORE_API_URL:-${PB_API_URL:-}}"
RESTORE_EMAIL="${PB_RESTORE_ADMIN_EMAIL:-${PB_ADMIN_EMAIL:-}}"
RESTORE_PASS="${PB_RESTORE_ADMIN_PASSWORD:-${PB_ADMIN_PASSWORD:-}}"

echo ""
echo "============================================"
echo "  PocketBase Data Restore"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Target: ${RESTORE_URL}"
echo "============================================"

# Validate required vars
if [ -z "${RESTORE_URL}" ] || [ -z "${RESTORE_EMAIL}" ] || [ -z "${RESTORE_PASS}" ] || [ -z "${GIT_REPO_URL:-}" ]; then
    echo "❌ Missing required env variables."
    echo "   Need: PB_RESTORE_API_URL (or PB_API_URL), PB_RESTORE_ADMIN_EMAIL (or PB_ADMIN_EMAIL),"
    echo "         PB_RESTORE_ADMIN_PASSWORD (or PB_ADMIN_PASSWORD), GIT_REPO_URL"
    exit 1
fi

# ----------------------------------------------------------
# Step 1: Clone repo and checkout backup branch
# ----------------------------------------------------------
echo "[1/3] Fetching backup data..."

rm -rf "${REPO_DIR}"
git clone "${GIT_REPO_URL}" "${REPO_DIR}"
cd "${REPO_DIR}"

if [ -z "${BRANCH}" ]; then
    # Find latest backup branch
    BRANCH=$(git branch -r | grep "${BRANCH_PREFIX}" | sort -r | head -1 | sed 's|origin/||' | xargs)
    if [ -z "${BRANCH}" ]; then
        echo "❌ No backup branch found!"
        exit 1
    fi
    echo "  Auto-selected latest branch: ${BRANCH}"
fi

git checkout "${BRANCH}"

DATA_DIR="${REPO_DIR}/data"
if [ ! -d "${DATA_DIR}" ]; then
    echo "❌ No data directory found in branch ${BRANCH}"
    exit 1
fi

echo "  ✅ Checked out: ${BRANCH}"
echo "  📁 Data directory: ${DATA_DIR}"

# ----------------------------------------------------------
# Step 2: Show backup info
# ----------------------------------------------------------
echo ""
echo "[2/3] Backup contents:"
if [ -f "${DATA_DIR}/_metadata.json" ]; then
    echo "  Export time: $(jq -r '.exportTime' ${DATA_DIR}/_metadata.json)"
    echo "  Collections:"
    jq -r '.collections[] | "    - \(.name): \(.recordCount) records"' "${DATA_DIR}/_metadata.json"
fi

# ----------------------------------------------------------
# Step 3: Restore via Node.js
# ----------------------------------------------------------
echo ""
echo "[3/3] Restoring data to PocketBase..."
echo ""
echo "  ⚠️  This will import records into PocketBase at: ${RESTORE_URL}"
echo "  ⚠️  Existing records with same IDs will be skipped."
echo ""

cd /app
RESTORE_DATA_DIR="${DATA_DIR}" node scripts/restore-data.mjs

echo ""
echo "============================================"
echo "  ✅ Restore Complete"
echo "============================================"
echo ""

# Cleanup
rm -rf "${REPO_DIR}"
