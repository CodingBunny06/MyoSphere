# Anatomy Studio v2 integration notes

The first integration candidate is Open Anatomy 3D:
https://github.com/MervinR07/open-anatomy-3d

The app uses the upstream npm package for the male/female GLB files, catalog and attribution. During the production build, the two GLBs are copied from `node_modules/open-anatomy-3d/models/` into `public/models/` so the app serves its own local copies rather than fetching models from a runtime CDN. Generated binaries are ignored by Git to avoid adding large third-party assets directly to the source repository.

The viewer uses Three.js GLTFLoader with MeshoptDecoder, switches between separate male and female models, exposes upstream body-system toggles, assigns a distinct deterministic colour to each muscle mesh, supports mesh selection and catalog search, and displays the upstream attribution.

## Current prototype limitations

- Muscle meshes now receive distinct deterministic colours by structure key; palette tuning and visual comparison with the supplied reference remain.
- The self-reported fat-region selector is currently a UI/interaction prototype only. It does not yet draw anatomically mapped overlays on the body surface.
- Search selects a catalog entry and enables its system; selected-mesh highlighting and camera framing need visual verification.
- Confirm actual system grouping and classification in both GLBs before claiming every structure is individually classified correctly.
- Model loading and memory/performance need verification on the target MacBook Air M1 and mobile browsers.
- No clinical interpretation, body-fat estimate, or photo-based inference is performed.

## Licence

The upstream project states that its code is MIT and model assets/catalog are CC BY 4.0. Keep the upstream attribution visible in the viewer and preserve licence notices. The models are for education/visualisation and not diagnosis.
