#!/bin/bash
set -e
cd "$(dirname "$0")"
# 3D (388 quadros = 7 compassos) + cartão final (1 compasso); grade de cor cinematográfica, grão e vinheta
ffmpeg -v error -y -framerate 30 -i frames3/f%04d.jpg -f lavfi -i "color=c=black:s=1080x1920:r=30:d=1.85" -i musica2.wav -filter_complex \
"[0:v]scale=1080:1920:flags=lanczos,unsharp=5:5:0.5,eq=contrast=1.08:saturation=1.05:gamma=0.97,colorbalance=rs=-0.04:bs=0.06:rh=0.04:bh=-0.03,vignette=PI/4.5,noise=alls=4:allf=t,format=yuv420p,fade=t=out:st=12.72:d=0.2[a];[1:v]format=yuv420p[b];[a][b]concat=n=2:v=1:a=0,ass=textos3.ass:fontsdir=/tmp/claude-0/-home-user-Outras-coisas/9be03038-ce9d-53a4-bb85-80f67314b342/scratchpad/edit/fonts,format=yuv420p[v]" \
-map "[v]" -map 2:a -t 14.77 -c:v libx264 -preset slow -crf 19 -maxrate 10M -bufsize 20M -profile:v high -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart coluna_v3.mp4
ffprobe -v error -show_entries format=duration,size -of compact coluna_v3.mp4
