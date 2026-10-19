#!/usr/bin/env bash
# Vídeo de 12 s: 6 s do anúncio em imagem + 6 s do anúncio em vídeo, com a interface dos Stories por cima.
# Uso: mockup_montar.sh <imagem-9x16.png> <video.mp4> <camada_img> <camada_vid> <camada_callout> <saida.mp4>
set -euo pipefail
IMG=$1; VID=$2; CI=$3; CV=$4; CC=$5; OUT=$6
# barra de progresso do Stories: preenche em cada metade, em passos de 0,5 s
barra() { python3 - "$1" <<'PY'
import sys
ini = float(sys.argv[1]); f = []
for i in range(12):
    a, z = ini + i * 0.5, ini + (i + 1) * 0.5
    f.append(f"drawbox=x=40:y=58:w={1000 * (i + 1) // 12}:h=8:color=white:t=fill:enable='between(t,{a},{z})'")
print(",".join(f))
PY
}
B1=$(barra 0); B2=$(barra 6)
ffmpeg -v error -y -loop 1 -t 6 -framerate 30 -i "$IMG" -t 6 -i "$VID" -i "$CI" -i "$CV" -i "$CC" -filter_complex "
[0:v]fps=30,scale=1080:1920,setsar=1,format=yuv420p[a];
[1:v]fps=30,scale=1080:1920,setsar=1,format=yuv420p[b];
[a][b]concat=n=2:v=1:a=0[bg];
[bg][2:v]overlay=0:0:enable='lt(t,6)'[o1];
[o1][3:v]overlay=0:0:enable='gte(t,6)'[o2];
[o2][4:v]overlay=0:0:enable='between(t,1.2,4.8)+between(t,7.2,10.8)'[o3];
[o3]$B1,$B2[v];
[1:a]adelay=6000|6000,apad=whole_dur=12,aformat=sample_rates=44100:channel_layouts=stereo[au]" \
  -map "[v]" -map "[au]" -t 12 -c:v libx264 -preset slow -crf 19 -c:a aac -b:a 128k -movflags +faststart "$OUT"
echo ok
