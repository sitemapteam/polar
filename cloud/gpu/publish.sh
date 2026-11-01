#!/usr/bin/env bash
# Run as root after install-host.sh completes. Auth is supplied separately.
set -euo pipefail
# Set only to an explicitly approved origin; no alternate domain is assumed.
: "${POLAR_STREAM_HOST:?An explicitly approved streaming hostname is required}"
if [[ ! "$POLAR_STREAM_HOST" =~ ^[a-zA-Z0-9.-]+$ ]]; then
  echo 'Invalid streaming hostname' >&2
  exit 1
fi
cd /opt/polar-gpu
POLAR_IMAGE="$(cat desktop-image)"
docker run -d --name polar-stream --restart=unless-stopped \
  --gpus 1 --runtime=nvidia --shm-size=4g \
  --log-opt max-size=20m --log-opt max-file=3 \
  -p 127.0.0.1:8080:8080 \
  --env-file stream.env --env-file polar-gpu-auth.env \
  --mount type=bind,src=/opt/polar-gpu/run-polar.sh,dst=/etc/service/lxqt/run,readonly \
  --mount type=volume,src=polar-browser-home,dst=/home/ubuntu \
  "$POLAR_IMAGE"
cat > /etc/caddy/Caddyfile <<CADDY
${POLAR_STREAM_HOST} {
  reverse_proxy 127.0.0.1:8080
}
CADDY
systemctl reload caddy
