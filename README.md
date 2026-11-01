# Northbound — The Polar Express

A local, cinematic winter railway journey with the supplied audiobook, Polar Express locomotive, four passenger coaches and a rear observation car.

## Build and run

Requires Node.js 22.12 or later. Install build tools once with `npm ci`.

```sh
npm run build
npm start
```

Open http://127.0.0.1:4173, or double-click **Big Boy 4014.html** after building. **Big Boy 4014 Portable.html** is the generated, self-contained offline edition.

Choose **Load journey** to initialize the scene, then **Begin journey** to start the recording. Opening the page alone does not allocate a WebGL scene. **Cab** enters the locomotive; drag to look around and scroll to change the field of view. The other camera buttons return outside. **Hide controls** also hides titles; its button remains available to restore the interface.

## Web build and deployment

```sh
npm ci
npm run check
npm run build:web
npm run preview:web
```

Publish **only `dist/`**. The web build copies the generated page's script dependencies, the assets explicitly used by those bundles, and attribution records. Screenshots, repository archives, build inputs, original model/audio duplicates, and portable HTML exports are excluded. The output directory is recreated on every web build to prevent stale files from being published. `web-build-manifest.json` lists every output file and its size outside the public directory.

Models are served as losslessly compressed binary files; textures and recordings keep their original bytes. Asset filenames contain content hashes for reliable long-term caching. The offline build remains available via `npm run build`.

The hosted app retains the original Polar models, textures, lighting, audio mix, camera behavior and HDR/FXAA rendering path from commit `d4b9ff1`. The direct-canvas Retina experiment was rolled back. Default-framebuffer multisampling is disabled because antialiasing already occurs in the compositor. Rendering stops while paused after camera motion settles, and opening the page waits for **Load journey** before creating the scene.

The web build extracts embedded binary data from six large scene scripts into compressed binary packs and original texture files. Their JavaScript changes from 184.6 MiB of embedded data to 86.5 KiB of manifests; the complete published payload is about 243 MiB. Array offsets are four-byte aligned, and runtime typed arrays use their exact byte ranges. The original geometry and image bytes are preserved. The offline build still supports embedded assets. `web-build-manifest.json` records the packaging sizes. Cliff and alpine source geometries are released after their runtime copies are prepared.

This reduces packaging and idle overhead; it does not establish a frame-rate or crash-free guarantee. No browser tests or performance benchmarks were run for this change, at the user's request.

With the web preview running and Chrome installed, `npm run check:browser` checks the large Retina viewport for black rectangles, then exercises resize, audio, cab view, pause/resume and seeking. Set `POLAR_URL` to check a deployed site.

Firebase Hosting is configured to publish `dist/` to the `sitemap-polar` site. Build before deploying; never upload the repository root.

## Cloud GPU infrastructure

The app's public address remains **https://sitemap-polar.web.app**. Do not introduce another user-facing domain without explicit authorization.

The separate GPU deployment on `polar-gpu-1` (`g2-standard-8`, NVIDIA L4, `us-east4-a`) is stopped following rejection of the alternate domain. It is not serving the public app. Its infrastructure scripts remain under `cloud/gpu/`, outside the web build. Any future integration must preserve the existing public address. Restarting this machine alone does not integrate it with Firebase Hosting.

Compute/GPU charges stop while the VM is stopped; its retained disk and reserved IP still incur charges.

## Assets and startup

Runtime inputs are stored losslessly in `.assets/` as small compressed parts to stay below GitHub's individual-file limits. `asset-manifest.json` records their original paths, sizes and SHA-256 checksums. Building restores missing inputs automatically; `npm run check` verifies them.

The original terrain cache and offline build remain available. Restored model, texture and recording files are not transcoded or simplified for deployment.

The original Big Boy source and its preserved portable edition remain in the original local project; the active build in this repository uses the requested Polar Express model. They have not been deleted from that workspace.

## Recent changes

- Four regular coaches, followed by one observation car, with animated wheelsets.
- Front pony and rear trailing trucks swivel independently of the locomotive body.
- Crossheads follow the cylinder axes; fixed-length rods follow the driving-wheel crank pins.
- Animated Baker gear with a constrained combination lever and fixed valve axis.
- A tall movie-style mountain crest and steep descent into the valley.
- Distinct four-beat recorded exhaust synchronized to the drivers and mixed below narration.
- Detailed coach interiors and a short interior cinematic shot during the cocoa passage.
- A drivable Cab camera, dark aged tunnels, an original illuminated masonry viaduct and a Nordic North Pole village.

## Credits

See `MODEL-CREDITS.txt` and `reference-assets/licenses/`. Third-party model and recording rights remain with their respective owners. The included narration is the recording supplied for this project. The landscape is imagined scenery rather than a surveyed railway or a physical railway simulation.
