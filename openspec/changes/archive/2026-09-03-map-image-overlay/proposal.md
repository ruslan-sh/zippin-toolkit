## Why

Users need a reference image to trace a map onto the hex grid. The editor must
show this image while users paint and keep it out of the exported PNG.

## What Changes

- Add one local tracing image above the painted hexes.
- Use the same file control to add an image or replace the current image.
- Add controls to move the image by dragging, change its size with a fixed
  aspect ratio, and change its opacity.
- Add a Remove image button.
- Keep the image fixed to its map position when the user scrolls.
- Keep painting and erasing available through the image.
- Keep the image out of PNG exports and export bounds.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `hex-map-editor`: Add a tracing image with upload, replacement, removal,
  position, size, and opacity controls.

## Impact

Changes are limited to the Map Drawing Tool UI, image handling, and tests.
The painted map state and PNG export keep their current purpose. No new
package, shared build change, or saved map format is required.
