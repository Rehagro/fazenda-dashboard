@echo off
title Fazenda Dashboard
chcp 65001 >nul

echo ==========================================
echo   Fazenda Dashboard - Nutricao Leiteira
echo ==========================================
echo.
echo  Portas exclusivas: frontend=4000  backend=8001
echo  (nao conflita com outros projetos)
echo.

:: ── Backend ────────────────────────────────
echo [1/2] Iniciando backend (porta 8001)...
start "Fazenda-Backend" cmd /c "cd /d "%~dp0backend-node" && node --experimental-sqlite server.js"

timeout /t 2 /nobreak >nul

:: ── Frontend ───────────────────────────────
echo [2/2] Iniciando frontend (porta 4000)...
start "Fazenda-Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak >nul

:: ── Abrir ──────────────────────────────────
echo.
echo  Abrindo http://localhost:4000 ...
echo.
start http://localhost:4000
