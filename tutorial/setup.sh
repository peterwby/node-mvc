#!/bin/bash

echo "开始安装开发环境..."

# 检查并安装 volta
if ! command -v volta &> /dev/null; then
    echo "正在安装 volta..."
    curl https://get.volta.sh | bash
    export VOLTA_HOME="$HOME/.volta"
    export PATH="$VOLTA_HOME/bin:$PATH"
    source ~/.bashrc
    source ~/.zshrc 2>/dev/null || true
fi

# 使用 volta 安装 Node.js v22
echo "正在安装 Node.js v22..."
volta install node@22

# 检查并安装 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "正在安装 pnpm..."
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    source ~/.bashrc
    source ~/.zshrc 2>/dev/null || true
fi

# 安装全局 @adonisjs/cli
echo "正在安装 @adonisjs/cli..."
pnpm add -g @adonisjs/cli

# 安装项目依赖
echo "正在安装项目依赖..."
pnpm install

# 检查并安装 Redis（仅支持 macOS）
if ! command -v redis-server &> /dev/null; then
    echo "正在安装 Redis..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install redis
        brew services start redis
    else
        echo "请手动安装 Redis，本脚本仅支持在 macOS 上自动安装 Redis"
    fi
fi

# 检查环境
echo "正在检查环境..."
echo "Node.js 版本："
node -v
echo "pnpm 版本："
pnpm -v
echo "Redis 版本："
redis-server -v

echo "环境安装完成！"
echo "请运行 'pnpm dev' 启动开发服务器"
