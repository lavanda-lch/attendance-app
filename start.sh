#!/bin/bash

echo "启动上班打卡小程序..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 启动后端
echo "→ 启动 Python 后端 (:8765)"
(cd "$SCRIPT_DIR/backend" && python server.py) &
BACKEND_PID=$!

# 启动前端
echo "→ 启动 Vue 前端 (:5173)"
(cd "$SCRIPT_DIR" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "前端: http://localhost:5173"
echo "后端: http://localhost:8765"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT

wait
