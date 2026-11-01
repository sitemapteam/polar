#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
dpkg --configure -a
apt-get update
apt-get install -y --no-install-recommends ca-certificates curl gnupg2 docker.io
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey -o /tmp/nvidia-container-key.asc
gpg --batch --yes --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg /tmp/nvidia-container-key.asc
curl -fsSL https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list -o /tmp/nvidia-container.list
sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' /tmp/nvidia-container.list > /etc/apt/sources.list.d/nvidia-container-toolkit.list
curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key -o /tmp/caddy-key.asc
gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg /tmp/caddy-key.asc
curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt -o /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y nvidia-container-toolkit=1.20.1-1 nvidia-container-toolkit-base=1.20.1-1 libnvidia-container-tools=1.20.1-1 libnvidia-container1=1.20.1-1 caddy
nvidia-ctk runtime configure --runtime=docker
systemctl enable docker caddy
systemctl restart docker
docker pull ghcr.io/selkies-project/selkies/desktop:2.2.0-ubuntu26.04
docker image inspect ghcr.io/selkies-project/selkies/desktop:2.2.0-ubuntu26.04 --format '{{index .RepoDigests 0}}' > /opt/polar-gpu/desktop-image
