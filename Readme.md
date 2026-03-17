# VELOX — Vintage Car Experiment

An immersive 3D automotive showcase built with Three.js, featuring dual theme switching, iridescent car shaders, postprocessing effects, and cinematic UI animations.

## Preview

| Inferno Edition | Glacier Edition |
|---|---|
| Warm orange HDRI · bloom · ember gradient | Cool skyblue HDRI · soft bloom · arctic gradient |

## Tech Stack

- **Three.js** — 3D scene, PBR materials, HDRI lighting
- **GSAP** — text split animations, theme transitions
- **Vite** — dev server and bundler
- **GLSL** — custom background blob shader with animated grain
- **Postprocessing** — UnrealBloomPass + AfterimagePass via EffectComposer

## Features

- Dual car models with separate PBR materials and HDRI env maps
- Theme switcher (Inferno / Glacier) with:
  - Blob background color lerp
  - Bloom settings swap
  - GSAP char-level title animations
  - Nav title reveal
- Floating car animation (sine wave)
- Mouse-driven X/Y rotation with lerp
- Frosted glass nav with sliding pill indicator
- Responsive layout (desktop → tablet → mobile → tiny)
- Film grain via GLSL `fract(sin(...))` noise

## Project Structure

```
├── public/
│   ├── hdris/
│   │   ├── hdri1.hdr        # Orange/warm environment
│   │   └── hdri2.hdr        # Skyblue/cool environment
│   ├── draco/               # Draco WASM decoder
│   ├── car_body.glb         # Car body mesh
│   └── car_glass.glb        # Car glass mesh
├── src/
│   ├── main.js              # Three.js scene, animation loop, theme logic
│   ├── ui.js                # GSAP animations, theme content, DOM updates
│   ├── style.css            # Full UI styles + responsive breakpoints
│   └── index.html           # HTML structure
├── vite.config.js
└── package.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Theme Config

Both themes are fully configurable in `main.js`:

```js
const THEME_CONFIG = {
  orange: {
    bloom: { strength: 0.4, radius: 0.65, threshold: 0.1 },
    colorIndices: [7, 4],   // indices into COLORS array
  },
  skyblue: {
    bloom: { strength: 0.25, radius: 0.8, threshold: 0.15 },
    colorIndices: [10, 6],
  },
};
```

Content (title, body copy, stats, colorway) is configured in `ui.js` under `THEME_CONTENT`.

## Animation Config

```js
const CAR_ANIM = {
  floatAmplitude: 0.3,   // vertical float height in units
  floatSpeed: 0.3,       // cycles per second
};

const LERP_SPEED = 0.75; // car visibility transition speed
```

## Vite Config Note

Three.js JSM submodules must be excluded from Vite's dep optimizer:

```js
// vite.config.js
optimizeDeps: {
  exclude: ["three", "lil-gui", ...]
}
```

If you see missing dep errors, delete `node_modules/.vite` and restart.

## License

MIT