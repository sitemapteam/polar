#!/usr/bin/env bash
set -eu
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp/runtime-ubuntu}"
until [ -f "${XDG_RUNTIME_DIR}/container-env" ]; do sleep 0.5; done
. "${XDG_RUNTIME_DIR}/container-env"
export DISPLAY="${DISPLAY:-:20}"
until [ -S "/tmp/.X11-unix/X${DISPLAY#*:}" ]; do sleep 0.5; done
cd /home/ubuntu
openbox --sm-disable &
exec google-chrome --no-first-run --no-default-browser-check \
  --disable-session-crashed-bubble --disable-background-networking \
  --autoplay-policy=no-user-gesture-required --ignore-gpu-blocklist \
  --use-gl=angle --use-angle=gl-egl --ozone-platform=x11 \
  --user-data-dir=/home/ubuntu/.config/polar-chrome \
  --kiosk --app=https://sitemap-polar.web.app/
