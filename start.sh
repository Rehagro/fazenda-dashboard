#!/usr/bin/env bash
set -e

echo "======================================"
echo "  Fazenda Dashboard - Nutrição Leiteira"
echo "======================================"

# Backend
cd "$(dirname "$0")/backend"
echo "[1/3] Instalando dependências Python..."
pip install -r requirements.txt -q

echo "[2/3] Iniciando backend (porta 8000)..."
uvicorn main:app --reload --port 8000 &
BACK_PID=$!

# Frontend
cd "$(dirname "$0")/frontend"
echo "[3/3] Instalando e iniciando frontend (porta 5173)..."
[ ! -d node_modules ] && npm install
npm run dev &
FRONT_PID=$!

echo ""
echo "  Frontend: http://localhost:5173"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "  Ctrl+C para encerrar tudo."
trap "kill $BACK_PID $FRONT_PID 2>/dev/null" INT
wait
