## Why

PNG export always uses black. Users need a selected color or transparency so the map fits its target document or virtual tabletop.

## What Changes

- Open an export settings dialog from the editor Export button.
- Offer a background color and a transparent background option, with black as the default.
- Use the dialog Export action to open a system save dialog where supported, with a standard download fallback.

## Capabilities

### New Capabilities

### Modified Capabilities

- `hex-map-editor`: Select PNG background in a dialog and save the result.

## Impact

Map Drawing Tool controls, export rendering, browser save integration, and related tests. No new dependencies.
