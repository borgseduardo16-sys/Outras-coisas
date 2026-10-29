@echo off
chcp 65001 >nul
title Persona Studio
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   O Node.js nao esta instalado neste computador.
  echo   Vou abrir a pagina de download: instale a versao LTS e depois abra este arquivo de novo.
  echo.
  start "" "https://nodejs.org/pt-br/download"
  pause
  exit /b
)
node servidor.mjs
if errorlevel 1 pause
