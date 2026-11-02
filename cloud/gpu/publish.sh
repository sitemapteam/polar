#!/usr/bin/env bash
# Run as root after install-host.sh completes. Auth is supplied separately.
set -euo pipefail
# This hostname is an infrastructure endpoint embedded by the Firebase portal.
# The user's address remains https://sitemap-polar.web.app.
: "${POLAR_STREAM_HOST:?An explicitly approved streaming hostname is required}"
if [[ ! "$POLAR_STREAM_HOST" =~ ^[a-zA-Z0-9.-]+$ ]]; then
  echo 'Invalid streaming hostname' >&2
  exit 1
fi
cd /opt/polar-gpu
test -f app/scene.html
if [ ! -f polar-session.env ]; then
  umask 077
  python3 -c 'import secrets; print("SELKIES_MASTER_TOKEN=" + secrets.token_urlsafe(48))' > polar-session.env
fi
POLAR_IMAGE="$(cat desktop-image)"
docker rm -f polar-stream 2>/dev/null || true
docker run -d --name polar-stream --restart=unless-stopped \
  --gpus 1 --runtime=nvidia --shm-size=4g \
  --log-opt max-size=20m --log-opt max-file=3 \
  -p 127.0.0.1:8080:8080 \
  --env-file stream.env --env-file polar-gpu-auth.env --env-file polar-session.env \
  --mount type=bind,src=/opt/polar-gpu/run-polar.sh,dst=/etc/service/lxqt/run,readonly \
  --mount type=bind,src=/opt/polar-gpu/app,dst=/opt/polar-app,readonly \
  --mount type=volume,src=polar-browser-home,dst=/home/ubuntu \
  "$POLAR_IMAGE"
cat > /etc/caddy/Caddyfile <<CADDY
${POLAR_STREAM_HOST} {
  @broker path /polar/* /player.html
  handle @broker {
    reverse_proxy 127.0.0.1:8090
  }
  @private path /api/tokens /api/switch /api/files/* /api/upload /api/recording /api/file-manager/*
  respond @private 404
  reverse_proxy 127.0.0.1:8080
}
CADDY
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
install -m 0644 polar-session.service /etc/systemd/system/polar-session.service
systemctl daemon-reload
systemctl enable polar-session.service
systemctl restart polar-session.service
