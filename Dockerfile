# 第一阶段：编译前端静态文件
FROM node:20-alpine AS builder

WORKDIR /app

# 为了更好的利用 Docker 缓存层，先仅拷贝 package 配置
COPY package.json ./

# 由于项目在国内，替换 npm 源为淘宝源来加速下载，并安装依赖包
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --legacy-peer-deps

# 拷贝项目中剩余的源代码
COPY . .

# 执行打包命令，Vite 会自动将编译好的纯静态资源输出到 /app/dist
RUN npm run build

# 极简模式导出：使用空白基础镜像将需要提取的文件放置在根目录
FROM scratch AS export-stage
COPY --from=builder /app/dist /
