## 1. Tool Foundation

- [ ] 1.1 Add the Map Drawing Tool source, test, HTML, and SCSS structure and wire it into the root TypeScript, webpack, lint, style-lint, and test configuration.
- [ ] 1.2 Add the standalone tool shell with labeled color, Paint, Eraser, and disabled Export PNG controls plus a scrollable canvas and status region.

## 2. Hex Model and Geometry

- [ ] 2.1 Add failing unit tests for the 100 by 100 odd-row pointy-top coordinate model, pixel centers, vertices, hit detection, bounds, and outside-grid behavior.
- [ ] 2.2 Implement the shared hex geometry functions and make the geometry tests pass.
- [ ] 2.3 Add failing unit tests for sparse painted-cell state, color replacement, black painted cells, erasing, and painted bounds.
- [ ] 2.4 Implement the map state operations and make the state tests pass.

## 3. Editor Rendering and Input

- [ ] 3.1 Add tests for black unpainted cells, editor-only grid strokes, changed-cell rendering, and initial center-scroll calculations.
- [ ] 3.2 Implement Canvas grid rendering and center the scrollable viewport after initial rendering.
- [ ] 3.3 Add tests for color selection, Paint and Eraser modes, primary-button drag painting, repeated-cell handling, invalid coordinates, and export-control state.
- [ ] 3.4 Implement the editor controller and accessible active-tool and status presentation.

## 4. PNG Export

- [ ] 4.1 Add failing tests for empty-map handling, black painted-cell bounds, one-radius margin cropping, black background rendering, omitted grid lines, and `map.png` download setup.
- [ ] 4.2 Implement temporary-canvas PNG export and non-destructive error reporting, then make the export tests pass.

## 5. Toolkit Integration and Verification

- [ ] 5.1 Add the Map Drawing Tool link to the Toolkit landing page and confirm the production route and assets are generated.
- [ ] 5.2 Run focused tests and manually check painting, erasing, centered initial scrolling, scrollbar navigation, and cropped grid-free PNG export on desktop.
- [ ] 5.3 Run the repository OpenSpec checks, full tests, TypeScript and style linting, production build, and `git diff --check` before the independent verification gate.
