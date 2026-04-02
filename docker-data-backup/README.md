# pocket-data-backup

PocketBase 每日自动数据备份容器。每天凌晨将所有集合数据导出为 JSON，推送到 GitHub 独立分支，并自动清理超过 30 天的旧分支。

## 架构概览

```
┌──────────────────────────────────────────────────────┐
│  pocket-data-backup Container                        │
│                                                      │
│  ┌─────────┐    ┌───────────┐    ┌────────────────┐  │
│  │  crond   │───▶│ backup.sh │───▶│ export-data.mjs│  │
│  │ (00:30)  │    │           │    │ (PB SDK)       │  │
│  └─────────┘    │           │    └────────────────┘  │
│                 │    git     │                        │
│                 │  commit +  │───▶ GitHub Repo        │
│                 │  push -f   │    (dated branch)      │
│                 │           │                        │
│                 │  cleanup   │───▶ Delete old         │
│                 │  branches  │    branches (>30d)     │
│                 └───────────┘                        │
└──────────────────────────────────────────────────────┘
```

## 快速开始

### 1. 配置环境变量

```bash
cd docker-data-backup
cp .env.example .env
# 编辑 .env，填入实际的 PB 密码和 SSH key 路径
```

### 2. 构建并启动

```bash
docker compose up -d --build
```

### 3. 查看日志

```bash
# 实时日志
docker logs -f pocket-data-backup

# 历史备份日志
docker exec pocket-data-backup cat /app/logs/backup.log
```

## 配置说明

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `PB_API_URL` | 备份源 PB 地址 (A) | — (必填) |
| `PB_ADMIN_EMAIL` | 备份源超级管理员邮箱 | — |
| `PB_ADMIN_PASSWORD` | 备份源超级管理员密码 | — |
| `PB_RESTORE_API_URL` | 恢复目标 PB 地址 (B) | 同 `PB_API_URL` |
| `PB_RESTORE_ADMIN_EMAIL` | 恢复目标管理员邮箱 | 同 `PB_ADMIN_EMAIL` |
| `PB_RESTORE_ADMIN_PASSWORD` | 恢复目标管理员密码 | 同 `PB_ADMIN_PASSWORD` |
| `GIT_USER_NAME` | Git 提交者名称 | `pocket-data-backup` |
| `GIT_USER_EMAIL` | Git 提交者邮箱 | `backup@dailyreading.app` |
| `SSH_KEY_PATH` | 宿主机上的 SSH 私钥路径 | `~/.ssh/id_rsa` |
| `RUN_ON_START` | 启动时立即执行一次备份 | `true` |

> **快速测试备份方案**: 配置两组 PB 地址后，可以从 A 备份 → Git → 恢复到 B，验证完整的备份恢复流程。

### SSH Key 配置

容器需要一个具有 push 权限的 SSH 私钥来推送到 `git@github.com:oneforce/DailyReadingAssistant.git`。

```bash
# 如果需要专用 key，生成一个新的：
ssh-keygen -t ed25519 -C "pocket-backup" -f ~/.ssh/pocket_backup_key

# 将公钥添加到 GitHub 仓库的 Deploy Keys（勾选 Allow write access）
cat ~/.ssh/pocket_backup_key.pub

# 在 .env 中指定私钥路径
SSH_KEY_PATH=~/.ssh/pocket_backup_key
```

## 备份策略

- **方式**: 本地 `git init` + `git push -f`，不依赖 `git clone`
- **时间**: 每天 00:30 (Asia/Shanghai)
- **分支命名**: `pocket-data-backup-YYYYMMDD`（例如 `pocket-data-backup-20260402`）
- **保留期限**: 30 天，超过 30 天的分支自动删除
- **同一天多次备份**: 强制推送覆盖当天分支

### 备份内容

脚本会 **自动发现** PocketBase 中所有非系统集合并导出，无需手动配置。新增 collection 后 **无需修改任何代码**，下次备份会自动包含。

每次备份导出以下文件到 `data/` 目录：

```
data/
├── _schemas.json       # 所有集合结构定义（字段、权限规则、索引）
├── _metadata.json      # 备份元信息（时间、记录数统计）
├── <collection>.json   # 每个集合一个文件，自动生成
└── ...                 # 新增的 collection 会自动出现在这里
```

> ⚠️ **注意**: 文件类型字段（如录音 blob）仅导出文件名，不包含二进制文件本身。如需完整备份含附件，请同步备份 PocketBase 的 `pb_data/storage` 目录。

## 数据恢复

### 快速恢复（使用容器内脚本）

```bash
# 从最新备份恢复
docker exec pocket-data-backup bash /app/scripts/restore.sh

# 从指定日期恢复
docker exec pocket-data-backup bash /app/scripts/restore.sh pocket-data-backup-20260401
```

### 手动恢复（不依赖容器）

```bash
# 1. 克隆仓库并切换到目标备份分支
git clone git@github.com:oneforce/DailyReadingAssistant.git /tmp/restore
cd /tmp/restore
git checkout pocket-data-backup-20260401

# 2. 查看备份元信息
cat data/_metadata.json | jq .

# 3. 使用 Node.js 恢复数据
export PB_API_URL=http://your-pb-host:9001
export PB_ADMIN_EMAIL=your_admin_email
export PB_ADMIN_PASSWORD=your_password
export RESTORE_DATA_DIR=/tmp/restore/data

# 安装依赖并执行恢复
npm install pocketbase
node docker-data-backup/scripts/restore-data.mjs
```

### 恢复到全新 PocketBase 实例

```bash
# 1. 启动一个新的 PocketBase
./pocketbase serve --http 0.0.0.0:9001

# 2. 通过管理面板创建超级管理员账号
#    访问 http://localhost:9001/_/

# 3. 执行恢复脚本（会自动创建集合+导入数据）
export PB_API_URL=http://localhost:9001
export PB_ADMIN_EMAIL=admin@example.com
export PB_ADMIN_PASSWORD=your_new_password
docker exec pocket-data-backup bash /app/scripts/restore.sh pocket-data-backup-20260401
```

## 手动操作

```bash
# 手动触发一次备份
docker exec pocket-data-backup bash /app/scripts/backup.sh

# 查看当前 cron 计划
docker exec pocket-data-backup crontab -l

# 查看容器内的备份仓库状态
docker exec pocket-data-backup git -C /app/backup-repo log --oneline -5

# 列出所有备份分支
docker exec pocket-data-backup git -C /app/backup-repo ls-remote --heads origin 'pocket-data-backup-*'
```

## 文件结构

```
docker-data-backup/
├── Dockerfile              # 容器镜像定义
├── docker-compose.yml      # 一键部署配置
├── package.json            # Node.js 依赖（PocketBase SDK）
├── .env.example            # 环境变量模板
├── .dockerignore           # Docker 构建排除规则
├── README.md               # 本文档
└── scripts/
    ├── entrypoint.sh       # 容器入口（SSH/Git初始化 → 首次备份 → 启动cron）
    ├── backup.sh           # 备份主流程（导出 → commit → push -f → 清理旧分支）
    ├── export-data.mjs     # PocketBase SDK 数据导出
    ├── restore.sh          # 恢复入口（clone → checkout → 导入）
    └── restore-data.mjs    # PocketBase SDK 数据导入
```
