## Context

See `proposal.md` for motivation and
`specs/hex-map-editor/spec.md` for observable behavior. Existing Toolkit tools
are static TypeScript and SCSS entry points built by the root webpack
configuration. The new tool must follow that pattern, remain dependency-free,
and render 10,000 fixed hexes without adding a UI framework.

## Goals / Non-Goals

**Goals:**

- Keep grid geometry, map state, rendering, input, and export independently
  testable.
- Use one coordinate model for editor hit detection and export cropping.
- Keep the browser integration small and consistent with existing tools.

**Non-Goals:**

- Persistence, editable file import or export, undo and redo, or clear-all.
- Zooming, panning controls, infinite expansion, alternate grid sizes, or
  alternate hex orientations.
- Touch-specific interaction or mobile layout work.

## Decisions

### Render the fixed grid with Canvas

The editor will use one HTML canvas inside a container with `overflow: auto`.
Canvas handles 10,000 hexes in one surface and can use the same drawing
primitives for PNG export. SVG or one DOM element per hex would make hit
targets direct, but would add a large element tree and require a separate
export path.

The canvas will have a fixed hex radius and enough edge padding to draw all
100 rows and columns. It will render black fills and visible editor grid lines.
After initial rendering, the scroll container will set both scroll positions
to center the canvas in the viewport.

### Use offset coordinates with shared geometry functions

Map cells will use zero-based row and column coordinates in an odd-row offset
layout for pointy-top hexes. Pure geometry functions will convert cells to
pixel centers, build hex vertices, convert pointer pixels back to a valid cell,
and calculate pixel bounds. A single implementation avoids drift between hit
detection, editor rendering, and export.

### Store only explicitly painted cells

Map state will use coordinate keys mapped to CSS color strings. An absent key
means unpainted even though its displayed fill is black. A present key with a
black value remains painted, so it contributes to export bounds. Paint and
erase operations will return whether state changed so the UI can avoid
unnecessary rendering.

### Keep input control state separate from map state

The page controller will track the selected color, active Paint or Eraser
tool, and primary-button drag state. It will translate pointer positions from
the canvas coordinate space, ignore invalid cells, and apply each newly
entered cell during a drag. Native color and button controls will expose clear
labels and the active tool state.

### Export through a temporary canvas

Export will calculate the pixel bounds of all explicitly painted hexes, extend
them by one hex radius on every side, and clamp the source region to the map
canvas. A temporary canvas will receive a black background and painted hex
fills only. It will not render grid strokes. The browser will convert it to a
PNG blob and download it as `map.png`.

The Export PNG button will be disabled for an empty map. Blob or download
setup failures will be reported in a visible status region without changing
map state.

### Integrate as an existing-style static tool

The new `map-drawing-tool/` area will contain its HTML template, TypeScript,
SCSS, and tests. Root webpack, TypeScript, lint, style-lint, and test inputs
will include the new area. The landing page will add one normal tool link. No
runtime dependency or shared-theme redesign is required.

## Risks / Trade-offs

- [A full 100 by 100 redraw can make dragging less responsive on slower
  devices] -> Render the static grid once and redraw only cells changed by an
  input operation; keep full rendering available for initialization and tests.
- [Pixel-to-hex conversion can select a neighboring cell near corners] -> Use
  polygon-aware shared geometry and cover centers, edges, corners, and map
  boundaries with unit tests.
- [Browser canvas size limits vary] -> Use a modest fixed hex radius and verify
  the resulting canvas dimensions in supported desktop browsers.
- [Standard scrollbars do not provide zoom or fast panning] -> Accept this as
  the deliberate minimum-control v1 trade-off.

## Migration Plan

Add the new static entry and landing-page link in one release. The change has
no stored data or existing behavior to migrate. Rollback removes the new entry,
page, and link without affecting the existing tools.
