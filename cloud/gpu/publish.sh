#!/usr/bin/env bash
# Run as root after install-host.sh completes. Auth is supplied separately.
set -euo pipefail
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
cat > /etc/caddy/Caddyfile <<'CADDY'
polar.35-245-246-78.sslip.io {
  reverse_proxy 127.0.0.1:8080
}
CADDY
systemctl reload caddy
