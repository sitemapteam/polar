# Northbound — The Polar Express

A local, cinematic winter railway journey with the supplied audiobook, Polar Express locomotive, four passenger coaches and a rear observation car.

## Build and run

Requires Node.js 22.12 or later. Install build tools once with `npm ci`.

```sh
npm run build
npm start
```

Open http://127.0.0.1:4173, or double-click **Big Boy 4014.html** after building. **Big Boy 4014 Portable.html** is the generated, self-contained offline edition.

Use **Begin journey** to start the recording. **Cab** enters the locomotive; drag to look around and scroll to change the field of view. The other camera buttons return outside. **Hide controls** also hides titles; its button remains available to restore the interface.

## Web build and deployment

```sh
npm ci
npm run check
npm run build:web
npm run preview:web
```

Publish **only `dist/`**. The web build copies the generated page's script dependencies, the assets explicitly used by those bundles, and attribution records. Screenshots, repository archives, build inputs, original model/audio duplicates, and portable HTML exports are excluded. The output directory is recreated on every web build to prevent stale files from being published. `web-build-manifest.json` lists every output file and its size outside the public directory.

Models are served as losslessly compressed binary files; textures and recordings keep their original bytes. Asset filenames contain content hashes for reliable long-term caching. The offline build remains available via `npm run build`.

The hosted app uses the original Polar rendering, scenery, lighting, audio mix, camera behavior and quality settings from commit `d4b9ff1`. Deployment changes are limited to external asset loading, content-hashed filenames, cache headers and an isolated `dist/` directory. No model simplification, replacement lighting, scene partitioning or automatic quality controller is applied by the web build.

With the web preview running and Chrome installed, `npm run check:browser` checks the large Retina viewport for black rectangles, then exercises resize, audio, cab view, pause/resume and seeking. Set `POLAR_URL` to check a deployed site.

Firebase Hosting is configured to publish `dist/` to the `sitemap-polar` site. Build before deploying; never upload the repository root.

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
