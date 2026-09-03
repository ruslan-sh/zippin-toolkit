## Why

Game masters need a fast way to make simple, color-coded hex maps without a
full virtual tabletop or image editor. A focused browser tool can provide the
minimum drawing and PNG export workflow alongside the existing Toolkit tools.

## What Changes

- Add a standalone Map Drawing Tool with a fixed 100 by 100 pointy-top hex grid.
- Let users select a color and paint or erase individual hexes with a mouse.
- Present the grid at a fixed zoom in a scrollable editor that starts centered.
- Export the painted area, with a black margin, as a grid-free PNG image.
- Add the tool to the Toolkit landing page and shared build integration.

## Capabilities

### New Capabilities

- `hex-map-editor`: Covers editing a fixed pointy-top hex map and exporting its
  painted bounds as a PNG image.

### Modified Capabilities

None.

## Impact

- Adds a new `map-drawing-tool/` source and test area.
- Extends the root webpack and TypeScript integration for the new static tool.
- Adds one entry to the Toolkit landing page.
- Adds no runtime dependency, persistence format, or public API.
