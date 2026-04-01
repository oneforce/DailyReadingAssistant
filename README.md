# 每日朗读APP (Daily Reading Assistant)

每日朗读APP是一个专注于**英语和语文课文朗读**的Web辅助应用，旨在为学生提供丰富的文章测试、句子练习和录音跟踪，同时为家长提供方便的作业下发入口与进度看板。

本系统采用了先进的**“纯前端渲染 + Serverless / BaaS架构”**，完全抛弃了笨重的传统 Node/Java 后端，让其拥有极致部署效率与零门槛运行优势！

---

## 🎯 核心需求与业务场景

- **学生端：**
  - 在移动端/PC端直接查看当天的“古诗”、“单词”、“句子”、“长文”等多维度作业。
  - 点击卡片进行直接的朗读录音测试，提交后自动归档到云端。
  - **PWA 桌面级安装**：支持像操作原生APP一样，把本应用安装到移动端桌面或 PC 桌面，享受沉浸式体验与离线框架加载。
- **家长端：**
  - 独立的家长控制台，可以可视化管理并主动发起一键式本地 JSON “导入课程” 以云同步给所有的学生端（多端漫游数据）。
  - 可以查看孩子过往的历史任务和成长勋章。

---

## 🛠 技术架构 & 存储生态

该项目是一个100%前端分离环境的单页应用：
- **前端核心框架**：`React 18` + `Vite` + `React Router v6`
- **状态管理中心**：`Zustand` 
- **离线增强缓存**：`vite-plugin-pwa` (提供Service Worker与资源级拦截)
- **UI 设计原则**：响应式玻璃拟态（Glassmorphism）、微动画。

### 📡 唯一后端与数据中台：PocketBase

本项目没有传统后台！所有的“数据库表引擎”和“多媒体对象云存储（录音WebM文件）”等全权委派给了一个单一的无头 CMS 云服务程序——**[PocketBase](https://pocketbase.io)**。
1. `src/utils/pb.js` 统一封装并初始化了底层的 `PocketBase SDK`。
2. 数据请求均采用异步模式操作远程 `tasks` 与 `recordings` 集合。
3. **混合环境安全处理**：前端自动判断 `import.meta.env.DEV`，打包生产环境走同源 Nginx HTTPS 反代（`/api`），解决浏览器混合内容 (Mixed Content) 阻止策略。

---

## 🚀 部署与打包指南 (Docker)

本工程特别提供了由前端开发者定制化的 **无痕镜像抽离（Scratch Output）** Docker 部署流，意味着**您的宿主机（或者服务器）甚至不需要安装任何一丁点的 Node.js 或 Npm，只需利用 Docker 的临时沙盒，即可打包出纯粹的 HTML/JS 静态文件。**

### 第一步：一键打包并提出 Dist
在本项目根菜单下运行：
```bash
DOCKER_BUILDKIT=1 docker build --output type=local,dest=./dist_output .
\cp -rf  /root/workspace/DailyReadingAssistant/dist_output/* /var/www/dailyreading/
```
执行完毕后，当前目录会出现一个叫 `dist_output/` 的文件夹，里面存放的即是生产环境下最小、最优化的前端文件。

> **背景原理**：Dockerfile 被分为了两个阶段，第一阶段用自带 `Node:20-alpine` 去淘宝源拉包构建。第二阶段直接通过空白镜像 (`scratch`) 将第一天的结果挂载到系统 I/O 完成“导出”，最后销毁临时容器。不会给服务器留下一点垃圾。

### 第二步：将成果放入 Nginx

由于我们是一个 PWA HTTPS 级应用且带有跨域保护，**绝对推荐您使用 Nginx 去托管上一步产出的 `dist_output`**。
在您的项目根目录下存在一个专门写好的示例化配置文件 `nginx.yuxi.conf`，如果您部署在 `https://yuxi.uyhnm.cn` 下，只需：
1. 将 `dist_output` 移入您的目标网站目录，比如 `/var/www/yuxi.uyhnm.cn/dist`
2. 将 `nginx.yuxi.conf` 原样放到机器里的 `/etc/nginx/conf.d/`
3. 执行 `nginx -s reload`。 

*(注：该配置文件已经帮您无缝配置好了针对 PocketBase 9001 端口的反向代理逻辑，以彻底规避前端 HTTP/HTTPS 的协议安全隔离限制。)*

---

## 🗄️ 数据库自动搭建与初始化

由于项目依赖远程（或独立部署的）PocketBase，初次部署前需在云端开启您的 PB 服务。
您可以使用项目自带的初始化脚手架脚本：

```bash
node init_pb.mjs
```
该脚本会：
1. 自动利用根账号登录您配置的 PocketBase (`106.54.239.44:9001`)。
2. 如果存在无用的旧表，会优雅清理。
3. 使用适配 PB SDK v0.26+ 版本最新的 `fields` 语法。
4. **一键生成具备多达 16 个核心参数字段的 `tasks` 表以及包含 blob audio 的 `recordings` 表**。 

完成后即可在页面愉快地导入 `.json` 完成业务验证！
