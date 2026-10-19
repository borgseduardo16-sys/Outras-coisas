#!/usr/bin/env bash
# Criativo em vídeo (Reels/Stories 9:16): 3 cenas + tela final do anúncio, com locução e legendas.
# Uso: montar_video.sh <cena1> <cena2> <cena3> <imagem-final> <voz.mp3> <legendas.ass> <fontsdir> <saida.mp4>
set -euo pipefail
C1=$1; C2=$2; C3=$3; IMG=$4; VOZ=$5; ASS=$6; FONTS=$7; OUT=$8
# durações alinhadas às pausas da locução: cortes em 4,78 / 11,83 / 18,28 s; fim em 22,35 s
D1=4.78; D2=7.05; D3=6.45; D4=4.07; TOT=22.35
# aproximação lenta em cada cena (1.00 -> 1.07)
Z() { echo "scale=w='trunc(1080*(1+0.07*t/$1)/2)*2':h=-2:eval=frame,crop=1080:1920"; }
ffmpeg -v error -y -ss 0.5 -t $D1 -i "$C1" -ss 0.5 -t $D2 -i "$C2" -ss 0.5 -t $D3 -i "$C3" \
  -loop 1 -t $D4 -framerate 30 -i "$IMG" -i "$VOZ" -filter_complex "
[0:v]fps=30,scale=1080:1920,setsar=1,$(Z $D1),setsar=1,eq=contrast=1.05:saturation=1.06[a];
[1:v]fps=30,scale=1080:1920,setsar=1,$(Z $D2),setsar=1,eq=contrast=1.05:saturation=1.06[b];
[2:v]fps=30,scale=1080:1920,setsar=1,$(Z $D3),setsar=1,eq=contrast=1.05:saturation=1.06[c];
[3:v]fps=30,scale=1080:1920,setsar=1,format=yuv420p,fade=t=in:st=0:d=0.3[d];
[a][b][c][d]concat=n=4:v=1:a=0,format=yuv420p,unsharp=5:5:0.3,ass=$ASS:fontsdir=$FONTS,format=yuv420p[v];
[4:a]loudnorm=I=-16:TP=-1.5:LRA=7,apad=whole_dur=$TOT,aformat=sample_rates=44100:channel_layouts=stereo[a]" \
  -map "[v]" -map "[a]" -t $TOT -c:v libx264 -preset slow -crf 19 -r 30 -c:a aac -b:a 160k -movflags +faststart "$OUT"
echo ok
