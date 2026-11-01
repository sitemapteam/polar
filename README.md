# Northbound — The Polar Express

A local, cinematic winter railway journey with the supplied audiobook, Polar Express locomotive, four passenger coaches and a rear observation car.

## Build and run

Requires Node.js 18 or later. No packages are needed for the build.

```sh
npm run build
npm start
```

Open http://127.0.0.1:4173, or double-click **Big Boy 4014.html** after building. **Big Boy 4014 Portable.html** is the generated, self-contained offline edition.

Use **Begin journey** to start the recording. **Cab** enters the locomotive; drag to look around and scroll to change the field of view. The other camera buttons return outside. **Hide controls** also hides titles; its button remains available to restore the interface.

## Assets and startup

Runtime inputs are stored losslessly in `.assets/` as small compressed parts to stay below GitHub's individual-file limits. `asset-manifest.json` records their original paths, sizes and SHA-256 checksums. Building restores missing inputs automatically; `npm run check` verifies them.

The terrain cache contains the exact generated landscape, avoiding a fresh heightfield build each time the page opens. GLBs use lossless compression and native byte decoding. Coaches share geometry and textures; full interior detail is selected for nearby cars. Original source model detail is retained.

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
