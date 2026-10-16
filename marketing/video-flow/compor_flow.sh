#!/usr/bin/env bash
# Monta o vídeo vertical a partir dos dois clipes do Google Flow.
# Uso: compor_flow.sh c1_coluna.mp4 c2.mp4 textos.ass musica.wav fontsdir saida_com_musica.mp4 saida_sem_musica.mp4
set -euo pipefail
C1=$1; C2=$2; ASS=$3; MUS=$4; FONTS=$5; OUT=$6; OUT_MUDO=$7
BEAT=0.46875   # 128 BPM

VF="
[0:v]trim=0:7.5,setpts=PTS-STARTPTS,fps=30,crop=460:720:405:0,scale=1080:1690,pad=1080:1920:0:230:black,
 scale=w='trunc(1080*(1+0.07*t/7.5+0.35*pow(max(0,(t-7.15)/0.35),2))/2)*2':h=-2:eval=frame:flags=bicubic,
 crop=1080:1920:(iw-1080)/2:(ih-1920)*0.62,setsar=1[a];
[1:v]setpts=PTS/1.25,fps=30,crop=500:720:391:0,scale=1080:1556,
 pad=1080:1920:0:364:black,
 scale=w='trunc(1080*(1+0.28*pow(max(0,1-t/0.3),2)+0.045*exp(-mod(t,$BEAT*2)/0.09))/2)*2':h=-2:eval=frame:flags=bicubic,
 crop=1080:1920:(iw-1080)/2:(ih-1920)*0.45,setsar=1,
 tpad=stop_mode=clone:stop_duration=2.75,
 fade=t=out:st=6.25:d=0.15[b];
[a][b]concat=n=2:v=1:a=0,trim=0:16.6,
 eq=contrast=1.07:saturation=1.08,vignette=angle=PI/5,noise=alls=5:allf=t,unsharp=5:5:0.5,
 ass=$ASS:fontsdir=$FONTS,format=yuv420p[v]"

ffmpeg -v error -y -i "$C1" -i "$C2" -i "$MUS" -filter_complex "$VF;[2:a]loudnorm=I=-14:TP=-1.2:LRA=9,atrim=0:16.6[au]" \
  -map "[v]" -map "[au]" -c:v libx264 -preset slow -crf 20 -maxrate 14M -bufsize 28M -r 30 -c:a aac -b:a 192k -movflags +faststart "$OUT"

# Versão sem música (para pôr o som pela biblioteca do próprio TikTok)
ffmpeg -v error -y -i "$OUT" -f lavfi -i anullsrc=r=44100:cl=stereo -map 0:v -map 1:a -c:v copy -c:a aac -shortest -movflags +faststart "$OUT_MUDO"
echo ok
