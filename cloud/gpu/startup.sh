#!/usr/bin/env bash
# Google Compute Engine startup script; resumes after the driver install reboots.
set -euo pipefail
exec >> /var/log/polar-gpu-setup.log 2>&1
export DEBIAN_FRONTEND=noninteractive
install -d -m 0755 /opt/polar-gpu
cd /opt/polar-gpu
if ! nvidia-smi >/dev/null 2>&1; then
  if [ ! -f cuda_installer.pyz ]; then
    curl -fSL --retry 3 https://storage.googleapis.com/compute-gpu-installation-us/installer/latest/cuda_installer.pyz -o cuda_installer.pyz
  fi
  echo '7357f300bbdfcc629b2ddaf52a63ebd4fd6a31a140ecee9c89ee5d16c03da30c  cuda_installer.pyz' | sha256sum -c -
  python3 cuda_installer.pyz install_driver --installation-branch=lts
fi
nvidia-smi
touch /opt/polar-gpu/driver-ready
