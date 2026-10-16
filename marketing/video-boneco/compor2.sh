#!/bin/bash
set -e
cd "$(dirname "$0")"
FONTS=/tmp/claude-0/-home-user-Outras-coisas/9be03038-ce9d-53a4-bb85-80f67314b342/scratchpad/edit/fonts
# parte 3D (320 quadros) + cartão final preto (1,78 s); textos e música por cima
ffmpeg -v error -y -framerate 30 -i frames2/f%04d.jpg -f lavfi -i "color=c=black:s=1080x1920:r=30:d=1.78" -i musica.wav -filter_complex \
"[0:v]scale=1080:1920:flags=lanczos,unsharp=5:5:0.6,noise=alls=3:allf=t,format=yuv420p,fade=t=out:st=10.47:d=0.2[a];[1:v]format=yuv420p[b];[a][b]concat=n=2:v=1:a=0,ass=textos.ass:fontsdir=$FONTS,format=yuv420p[v]" \
-map "[v]" -map 2:a -t 12.444 -c:v libx264 -preset slow -crf 19 -maxrate 10M -bufsize 20M -profile:v high -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart coluna_v2.mp4
ffprobe -v error -show_entries format=duration,size -of compact coluna_v2.mp4
