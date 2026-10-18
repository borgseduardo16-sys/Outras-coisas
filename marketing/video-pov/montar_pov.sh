#!/usr/bin/env bash
# Junta os dois clipes do boneco transparente (8 s cada) num vídeo vertical para TikTok, sem som.
# Transições aos 4 s (meio do clipe 1), 8 s (troca de clipe) e 12 s (meio do clipe 2).
# Uso: montar_pov.sh <clipe1.mp4 horizontal> <clipe2.mp4 vertical> <textos.ass> <fontsdir> <saida.mp4>
set -euo pipefail
A=$1; B=$2; ASS=$3; FONTS=$4; OUT=$5
XF=7.6          # início da transição entre os clipes (duração 0,4 s) -> vídeo final de 15,6 s

# "Soco" de zoom curto no meio de cada clipe (t=4 local) + aproximação lenta contínua
PUNCH="(1+0.035*t/8+0.16*max(0,1-abs(t-4)/0.22))"

ffmpeg -v error -y -i "$A" -i "$B" -f lavfi -i anullsrc=r=44100:cl=stereo -filter_complex "
[0:v]fps=30,setsar=1,split[a1][a2];
[a1]scale=-2:1920,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.18[abg];
[a2]crop=600:720:340:0,scale=1080:1296[afg];
[abg][afg]overlay=0:312,
 scale=w='trunc(1080*$PUNCH/2)*2':h=-2:eval=frame,crop=1080:1920,setsar=1,format=yuv420p[va];
[1:v]fps=30,scale=1080:1920,setsar=1,
 scale=w='trunc(1080*$PUNCH/2)*2':h=-2:eval=frame,crop=1080:1920,setsar=1,format=yuv420p[vb];
[va][vb]xfade=transition=slideup:duration=0.4:offset=$XF,
 eq=contrast=1.04:saturation=1.05,unsharp=5:5:0.35,ass=$ASS:fontsdir=$FONTS,format=yuv420p[v]" \
  -map "[v]" -map 2:a -t 15.6 -c:v libx264 -preset slow -crf 19 -r 30 -c:a aac -b:a 64k -movflags +faststart "$OUT"
echo ok
