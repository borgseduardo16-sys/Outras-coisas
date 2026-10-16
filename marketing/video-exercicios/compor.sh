#!/usr/bin/env bash
# Monta o vídeo final: quadros 3D (30 fps) + tela final preta, textos ASS, voz e música calma com "ducking".
# Uso: compor.sh <pasta_quadros> <voz.mp3> <musica.wav> <textos.ass> <fontsdir> <saida.mp4>
set -euo pipefail
Q=$1; VOZ=$2; MUS=$3; ASS=$4; FONTS=$5; OUT=$6
DUR=50.2

ffmpeg -v error -y -framerate 30 -i "$Q/f%04d.jpg" -i "$VOZ" -i "$MUS" -filter_complex "
[0:v]scale=1080:1920:flags=lanczos,tpad=stop_mode=add:stop_duration=7:color=black,trim=0:$DUR,
 eq=contrast=1.05:saturation=1.06:gamma=0.98,vignette=angle=PI/5.5,noise=alls=4:allf=t,unsharp=5:5:0.4,
 ass=$ASS:fontsdir=$FONTS,format=yuv420p[v];
[1:a]aresample=44100,highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,volume=1.0,apad,atrim=0:$DUR,asplit=2[voz][sc];
[2:a]aresample=44100,volume=0.30,atrim=0:$DUR[mus];
[mus][sc]sidechaincompress=threshold=0.02:ratio=5:attack=30:release=450:makeup=1[musd];
[voz][musd]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.3:LRA=9[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 20 -maxrate 12M -bufsize 24M -r 30 \
  -c:a aac -b:a 192k -ar 44100 -movflags +faststart "$OUT"
echo ok
