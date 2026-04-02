#!/bin/bash
# ============================================================
# entrypoint.sh - Container initialization
# ============================================================
set -euo pipefail

echo "============================================"
echo "  pocket-data-backup container starting"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "============================================"

# ----------------------------------------------------------
# 1. Configure SSH key
# ----------------------------------------------------------
echo "[init] Configuring SSH..."

if [ ! -f /root/.ssh/id_rsa ]; then
    echo "❌ SSH key not found at /root/.ssh/id_rsa"
    echo "   Mount your SSH key: -v /path/to/ssh_key:/root/.ssh/id_rsa:ro"
    exit 1
fi

# Copy read-only mounted key to writable location and set permissions
cp /root/.ssh/id_rsa /root/.ssh/id_rsa_copy
chmod 600 /root/.ssh/id_rsa_copy

# Add GitHub to known hosts to avoid interactive prompt
ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> /root/.ssh/known_hosts 2>/dev/null

# Configure SSH to use the copied key
cat > /root/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile /root/.ssh/id_rsa_copy
    IdentitiesOnly yes
    StrictHostKeyChecking no
EOF
chmod 600 /root/.ssh/config

echo "✅ SSH configured"

# ----------------------------------------------------------
# 2. Configure Git identity
# ----------------------------------------------------------
echo "[init] Configuring Git..."
git config --global user.name "${GIT_USER_NAME:-pocket-data-backup}"
git config --global user.email "${GIT_USER_EMAIL:-backup@dailyreading.app}"
echo "✅ Git identity: $(git config --global user.name) <$(git config --global user.email)>"

# ----------------------------------------------------------
# 3. Export env vars for cron (cron has a clean environment)
# ----------------------------------------------------------
echo "[init] Persisting environment for cron..."
env | grep -E '^(PB_|GIT_|EXPORT_|TZ=)' > /app/.env.cron
echo "✅ Environment variables persisted"

# Wrap the backup script to source env vars
cat > /app/scripts/backup-cron-wrapper.sh << 'WRAPPER'
#!/bin/bash
set -a
source /app/.env.cron
set +a
exec /bin/bash /app/scripts/backup.sh
WRAPPER
chmod +x /app/scripts/backup-cron-wrapper.sh

# Update cron to use wrapper
echo "30 0 * * * /bin/bash /app/scripts/backup-cron-wrapper.sh >> /app/logs/backup.log 2>&1" > /etc/crontabs/root

# ----------------------------------------------------------
# 4. Run initial backup if requested
# ----------------------------------------------------------
if [ "${RUN_ON_START:-true}" = "true" ]; then
    echo ""
    echo "[init] Running initial backup..."
    /bin/bash /app/scripts/backup.sh || echo "⚠️ Initial backup failed, will retry on cron schedule"
fi

# ----------------------------------------------------------
# 5. Start cron daemon in foreground
# ----------------------------------------------------------
echo ""
echo "============================================"
echo "  ✅ Initialization complete"
echo "  📅 Cron schedule: 00:30 daily (${TZ})"
echo "  📁 Logs: /app/logs/backup.log"
echo "============================================"
echo ""

exec crond -f -l 2
