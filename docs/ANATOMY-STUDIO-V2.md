# Anatomy Studio v2 integration notes

The first integration candidate is Open Anatomy 3D:
https://github.com/MervinR07/open-anatomy-3d

The app uses the upstream npm package for the male/female GLB files, catalog and attribution. During the production build, the two GLBs are copied from `node_modules/open-anatomy-3d/models/` into `public/models/` so the app serves its own local copies rather than fetching models from a runtime CDN. Generated binaries are ignored by Git to avoid adding large third-party assets directly to the source repository.

The viewer uses Three.js GLTFLoader with MeshoptDecoder, switches between separate male and female models, defaults to the exterior skin surface, and offers an optional muscle layer. Skeleton, organs, vessels and nerves are intentionally excluded from the user-facing controls. Skin materials receive a warmer, less metallic finish; the viewer includes a restrained surface-inflation slider for an illustrative body-fat reference range. The slider is not a physiological model or measurement.

## Current prototype limitations

- Muscle meshes now receive distinct deterministic colours by structure key; palette tuning and visual comparison with the supplied reference remain.
- The body-fat percentage control is a visual reference slider only. It applies a small reversible displacement to meshes classified as skin; it is not a validated mapping from percentage to body shape or regional fat distribution.
- Search selects a catalog entry and enables its system; selected-mesh highlighting and camera framing need visual verification.
- Confirm actual system grouping and classification in both GLBs before claiming every structure is individually classified correctly.
- Model loading and memory/performance need verification on the target MacBook Air M1 and mobile browsers.
- No clinical interpretation, body-fat estimate, or photo-based inference is performed.

## Licence

The upstream project states that its code is MIT and model assets/catalog are CC BY 4.0. Keep the upstream attribution visible in the viewer and preserve licence notices. The models are for education/visualisation and not diagnosis.
