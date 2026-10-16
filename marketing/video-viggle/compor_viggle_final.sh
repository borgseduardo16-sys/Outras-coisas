#!/bin/bash
set -e
cd "$(dirname "$0")"
ffmpeg -v error -y -i viggle_base.mp4 -f lavfi -i "color=c=black:s=1080x1920:r=30:d=1.92" -i musica3.wav -filter_complex \
"[0:v]unsharp=5:5:0.45,eq=contrast=1.06:saturation=1.04,vignette=PI/4.6,noise=alls=4:allf=t,format=yuv420p,fade=t=out:st=12.66:d=0.2[a];[1:v]format=yuv420p[b];[a][b]concat=n=2:v=1:a=0,ass=textos_viggle.ass:fontsdir=/tmp/claude-0/-home-user-Outras-coisas/9be03038-ce9d-53a4-bb85-80f67314b342/scratchpad/edit/fonts,format=yuv420p[v]" \
-map "[v]" -map 2:a -t 14.77 -c:v libx264 -preset slow -crf 19 -maxrate 10M -bufsize 20M -profile:v high -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart coluna_viggle.mp4
ffprobe -v error -show_entries format=duration,size -of compact coluna_viggle.mp4
