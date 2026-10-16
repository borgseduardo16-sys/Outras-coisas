#!/usr/bin/env bash
# Vídeo sem narração: quadros 3D + "pulos" de zoom nas trocas de cena + textos + tela final; áudio vazio
# (a música é escolhida no próprio TikTok). Uso: compor_semvoz.sh <pasta_quadros> <textos.ass> <fontsdir> <saida.mp4>
set -euo pipefail
Q=$1; ASS=$2; FONTS=$3; OUT=$4
DUR=19.6
P="0.2*if(gte(t,6.0),exp(-(t-6.0)/0.14),0)+0.06*(if(gte(t,8.1),exp(-(t-8.1)/0.1),0)+if(gte(t,10.1),exp(-(t-10.1)/0.1),0)+if(gte(t,12.1),exp(-(t-12.1)/0.1),0))"

ffmpeg -v error -y -framerate 30 -i "$Q/f%04d.jpg" -f lavfi -i anullsrc=r=44100:cl=stereo -filter_complex "
[0:v]scale=1080:1920:flags=lanczos,
 scale=w='trunc(1080*(1+$P)/2)*2':h=-2:eval=frame:flags=bicubic,crop=1080:1920:(iw-1080)/2:(ih-1920)/2,setsar=1,
 tpad=stop_mode=add:stop_duration=5:color=black,trim=0:$DUR,
 eq=contrast=1.04:saturation=1.05,vignette=angle=PI/6,noise=alls=3:allf=t,unsharp=5:5:0.4,
 ass=$ASS:fontsdir=$FONTS,format=yuv420p[v]" \
  -map "[v]" -map 1:a -t $DUR -c:v libx264 -preset slow -crf 20 -maxrate 12M -bufsize 24M -r 30 \
  -c:a aac -b:a 128k -movflags +faststart "$OUT"
echo ok
