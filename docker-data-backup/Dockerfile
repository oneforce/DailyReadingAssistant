# ============================================================
# pocket-data-backup
# Automated PocketBase data export → Git push container
# ============================================================
FROM node:20-alpine

LABEL maintainer="oneforce" \
      description="PocketBase daily data backup to Git with branch management"

# Install system dependencies: git, openssh, cron, curl, jq, tzdata
RUN apk add --no-cache \
    git \
    openssh-client \
    dcron \
    curl \
    jq \
    tzdata \
    bash

# Set timezone to Asia/Shanghai (UTC+8) so cron fires at local midnight
ENV TZ=Asia/Shanghai
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json ./

# Install Node.js dependencies (PocketBase SDK)
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --omit=dev

# Copy application scripts
COPY scripts/ ./scripts/

# Make scripts executable
RUN chmod +x ./scripts/*.sh

# Create necessary directories
RUN mkdir -p /root/.ssh /app/backup-repo /app/logs

# Setup cron: run backup at 00:30 every day (Asia/Shanghai time)
# Offset 30 min from midnight to avoid exact-hour contention
RUN echo "30 0 * * * /bin/bash /app/scripts/backup.sh >> /app/logs/backup.log 2>&1" > /etc/crontabs/root

# Healthcheck: verify cron daemon is alive
HEALTHCHECK --interval=60s --timeout=5s --retries=3 \
    CMD pgrep crond > /dev/null || exit 1

# Entrypoint: configure SSH, run initial backup, then start cron daemon
ENTRYPOINT ["/bin/bash", "/app/scripts/entrypoint.sh"]
