#!/usr/bin/env bash
set -eu
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp/runtime-ubuntu}"
until [ -f "${XDG_RUNTIME_DIR}/container-env" ]; do sleep 0.5; done
. "${XDG_RUNTIME_DIR}/container-env"
export DISPLAY="${DISPLAY:-:20}"
until [ -S "/tmp/.X11-unix/X${DISPLAY#*:}" ]; do sleep 0.5; done
cd /home/ubuntu
python3 -m http.server 8091 --bind 127.0.0.1 --directory /opt/polar-app &
openbox --sm-disable &
exec google-chrome --no-first-run --no-default-browser-check \
  --disable-session-crashed-bubble --disable-background-networking \
  --autoplay-policy=no-user-gesture-required --ignore-gpu-blocklist \
  --use-gl=angle --use-angle=gl-egl --ozone-platform=x11 \
  --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 \
  --user-data-dir=/tmp/polar-chrome \
  --kiosk --app=http://127.0.0.1:8091/scene.html
