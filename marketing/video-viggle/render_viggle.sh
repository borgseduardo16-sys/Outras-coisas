#!/bin/bash
cd "$(dirname "$0")"
./venv/bin/python /home/user/Outras-coisas/marketing/video-viggle/compor_viggle.py v4/src.mp4 2> viggle_log.txt | ffmpeg -v error -y -f rawvideo -pix_fmt bgr24 -s 1080x1920 -r 30 -i - -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p viggle_base.mp4
echo FEITO; tail -1 viggle_log.txt
