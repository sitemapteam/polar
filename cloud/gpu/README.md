# Polar streaming deployment

The public address is **https://sitemap-polar.web.app**. The browser stays there.
The infrastructure hostname in `portal.html` is only the TLS streaming endpoint.

`npm run build:web` still builds the native page by default. Setting
`POLAR_GPU_STREAM=1` replaces only the public index with the streaming portal;
`scene.html` and its exact source assets remain available for the renderer.
Never publish that portal before verifying its backend and a decoded picture.

The GPU container mounts a built `dist/` at `/opt/polar-app`, serves it on its
own loopback interface, and opens `/scene.html` in kiosk Chrome. This avoids recursively opening the
streaming portal. Rendering code, quality settings, source textures, models,
and original audio must remain unchanged: this integration only connects the
existing GPU app to the existing public address.

The broker listens on host loopback port 8090. It exchanges the existing Polar
access code for a random session token, held in browser session storage and
passed to the embedded player in its URL fragment. No master credentials are
published in Firebase. Tokens expire 90 seconds after the last heartbeat.
The renderer supports one active interactive session; another device gets a
clear busy response rather than competing for display size or input.

`publish.sh` requires `POLAR_STREAM_HOST`, the app directory, the pinned image
record, and the existing private `polar-gpu-auth.env`. It creates a separate
random master token if absent, recreates the container while retaining its
home volume, configures Caddy, and starts the broker. External access to
administrative APIs is blocked. Desktop uploads, commands, clipboard,
microphone, and webcam are disabled. Keep all credential files outside Git.

The player uses Selkies 2.2.0's hardware codec negotiation and Opus fallback.
It uses the existing streaming configuration and native resize behavior.
Do not add quality presets, reduce bitrate, alter rendering, or change scene
content as part of a URL integration. Connection success does not establish
an animation frame-rate guarantee.

Before release, inspect an actual decoded desktop stream, touch input, resize,
audio playback, reconnection, expired credentials, and the busy-device message.
Device emulation does not establish compatibility with every physical phone.
Only switch the Firebase release after the backend works; retain the previous
Firebase version for rollback.

Running the L4 VM incurs hourly compute charges plus storage and traffic.
Stopped VMs still incur retained disk and reserved-address charges. Remove
temporary relocation snapshots and failed-provisioning disks once no longer
needed, and never leave a second GPU running unintentionally.
