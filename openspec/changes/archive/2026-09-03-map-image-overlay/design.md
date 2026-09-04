## Context

See proposal.md for the purpose and specs/hex-map-editor/spec.md for behavior.
The editor draws hexes on one canvas and updates cells as the user paints.
PNG export uses a separate canvas and reads only HexMapState. The viewport
scrolls across a fixed map at one zoom level.

## Goals / Non-Goals

**Goals:** Keep image handling separate from paint data. Retain the current
cell rendering and export paths. Use existing browser features and no new
dependencies.

**Non-Goals:** Rotation, multiple images, saved images, remote image URLs,
image export, and general changes to map navigation.

## Decisions

### Display the image in a separate element

Place an image above the canvas in a positioned wrapper with the same size
as the map. Clip the image to that wrapper so it does not extend the scroll
area. Store its position in map pixels. This keeps it aligned during scroll.
Drawing the image on the paint canvas would require repeated full redraws
and would couple tracing to cell rendering.

Use a small image module to own the image load, position, size, opacity,
and pointer handling. Connect it through editor-app.ts and index.ts. Keep
HexMapState and png-export.ts independent of the image.

### Give movement an explicit mode

Add Move image beside Paint and Eraser. It is mutually exclusive with those
tools. In Paint and Eraser modes the image ignores pointer input. In Move
image mode it receives drag input, and canvas paint gestures are disabled.
End any current paint gesture when changing modes. Use pointer capture for
movement and end movement on pointer up, cancellation, or mode change.

Use labeled range inputs for Size (10 to 400 percent of the fitted size)
and Opacity (0 to 100 percent), with visible values. Start at 100 percent
size and 50 percent opacity. Resizing keeps the image center fixed. Limit
movement so at least one map pixel of the image remains inside the workspace.
The image element can still receive move input at zero opacity.

This explicit mode avoids a modifier-key gesture and prevents normal tracing
from moving the reference by accident.

### Commit a new image only after it loads

Use a single file input for PNG, JPEG, and WebP. Decode a candidate before
replacing the current image. Fit it within the visible map area without
enlarging it, then center it in that area. Reset size and opacity on each
successful upload. Keep the current paint or erase mode; return to Paint if
replacement interrupts Move image.

Track the latest request so an older load cannot replace a newer image or
restore a removed image. Revoke object URLs when no longer needed. Reset the
file input after selection so the same file can be loaded again. Show load
errors through the existing status element. Keep all image data local to the
page session.

### Keep exports independent

Continue passing only HexMapState to exportMapPng. The image has no role in
painted bounds or Export enablement. Verify this at the editor integration
boundary as well as through the existing PNG export tests.

## Risks / Trade-offs

- Image input can intercept painting: use mutually exclusive modes and test
  gestures over the image in each mode.
- A load can finish after replacement or removal: ignore stale requests and
  release their object URLs.
- A large decoded image can use substantial browser memory: retain only one
  active image and release replaced resources. No arbitrary file limit is
  introduced in this change.
- Automated tests do not prove visual alignment: verify scroll alignment,
  sizing, and tracing manually when browser use is authorized. Record any
  visual check that could not be performed.

## Migration Plan

No saved data or dependency migration is needed. Deploy with the normal
production build. Revert the scoped UI and image changes to roll back.
