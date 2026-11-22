# Anatomy asset decision: Open Anatomy 3D

**Status:** Selected as the first integration candidate; not yet accepted as the final visual asset.

## Why this candidate

MyoSphere will evaluate the Open Anatomy 3D project:
- Repository: https://github.com/MervinR07/open-anatomy-3d
- Demo: https://mervinr07.github.io/open-anatomy-3d/
- npm packages: `open-anatomy-3d` and `open-anatomy-3d-react`

The project publishes separate male and female GLB models, named structure meshes, a typed catalog and a React/Three.js viewer. Its documented models contain 147 catalogued structures overall (140 in the male model and 145 in the female model); this is not a claim of 147 muscles per model. We must inspect actual muscle coverage before promising muscle-by-muscle interaction.

## Licence and attribution

The project's documentation states:
- Package/viewer code: MIT.
- Model assets/catalog: CC BY 4.0, adapted from BodyParts3D (DBCLS), HuBMAP Human Reference Atlas and MakeHuman.
- Required attribution is exposed by the package as `ATTRIBUTION`.

Before redistributing model files in MyoSphere, preserve the complete upstream attribution and licence notices, verify the current exact asset provenance and include a visible attribution entry in the app and repository. MyoSphere's AGPL-3.0 licence does not replace the model's separate licence.

## Product requirements

### First release
- Male/female body selector backed by separate anatomical models, not a gender-swapped mesh.
- Colour-coded muscle view with a stable MyoSphere palette.
- Individual structure selection only for structures actually present and correctly classified as muscles.
- Front/back/left/right camera presets, orbit, zoom and reset.
- Muscle search and detail panel using source catalog labels.
- Layer controls for systems available in the source asset.

### Fat-region visualisation

The selected upstream asset documents skin, skeleton, muscles, organs, vessels and nerves; it does not document a dedicated adipose/fat layer. Therefore:
- Do not describe the initial overlay as anatomical fat tissue or measured fat distribution.
- Implement an optional self-reported body-region concern overlay using clearly labelled approximate surface regions, only after validating region mapping for both models.
- Explain that selections are subjective and do not estimate body-fat percentage, visceral fat, or actual tissue thickness.
- Do not infer fat distribution from progress photos.

## Technical constraints and validation

- The upstream GLBs use `EXT_meshopt_compression`; configure the Three.js `MeshoptDecoder` or use the upstream viewer package. Do not assume Draco decoding is sufficient.
- The source documentation reports roughly 1 million triangles per body. Lazy-load the selected sex/model and avoid loading both models simultaneously.
- Benchmark loading time, memory, frame rate, selection responsiveness and mobile behaviour on the target MacBook Air M1 and a representative mobile browser.
- Inspect actual mesh names, catalog system/category labels, materials, mesh counts and missing structures before implementing muscle classification.
- The upstream viewer documents React 18 / R3F 8 / Drei 9 compatibility. MyoSphere currently uses React 19 and a direct Three.js renderer. Validate peer dependencies before adopting the React viewer; a direct Three.js integration may be safer.
- Never fetch model assets from an uncontrolled runtime CDN in the finished local-first experience. Bundle self-hosted assets only after licence and performance validation.

## Acceptance criteria

- [ ] Male and female models both load correctly.
- [ ] Source licence and full attribution are included.
- [ ] All selectable muscles are verified against the upstream catalog; no organs, vessels, nerves or joints are mislabeled as muscles.
- [ ] MyoSphere colour palette is applied without corrupting source geometry.
- [ ] Selection, isolation, search, camera presets and reset work.
- [ ] Fat-region overlay is clearly described as self-reported/illustrative, not a measured adipose layer.
- [ ] Performance and memory budgets pass on target devices.
- [ ] Automated tests cover catalog mapping and model loading failure states.
- [ ] Visual comparison against the user's supplied reference is reviewed before merging.

## Decision

Proceed with Open Anatomy 3D as the first candidate for a dedicated anatomy v2 branch and pull request. Keep the existing anatomy implementation intact until the new viewer passes the acceptance criteria. Do not merge or remove the old asset prematurely.
