#!/bin/bash
# Mac: dê dois cliques neste arquivo para abrir o Persona Studio.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "O Node.js não está instalado. Instale a versão LTS em https://nodejs.org e abra de novo."
  open "https://nodejs.org"
  read -r -p "Aperte Enter para sair"
  exit 1
fi
node servidor.mjs
