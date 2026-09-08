## Context

See proposal.md for the need. The exporter fills a cropped canvas with black before it draws painted cells. The editor starts export directly. Browser save support varies.

## Goals / Non-Goals

Goals: Keep background selection separate from map paint and preserve the export crop and margin size.

Non-goals: Saved settings, preview changes, and new export formats.

## Decisions

- Use a native modal dialog with a title, Background color input, Transparent background checkbox, Cancel, and primary Export action. Native dialog behavior supports keyboard focus and Escape without a new dependency.
- Default to solid black. Disable the color input while transparent is selected, retaining its value. Keep settings during the page session.
- Pass a color or null into export. For null, leave the new canvas clear. Do not change map state, crop calculation, painted colors, grid exclusion, or tracing image exclusion.
- Request the native save picker directly from the dialog Export action before asynchronous PNG generation, to preserve user activation. Suggest map.png and PNG files. Await file writing and closing. Treat picker cancellation as a normal outcome.
- Feature-detect the save picker. When unavailable, use the existing download path. Do not download after a picker cancellation or real save error. Report real generation and write errors with the existing status message.
- Prevent duplicate submission while saving and allow retry after failure. Close the dialog after successful export; keep it available after cancellation or error.

## Risks / Trade-offs

- Browser save picker support varies: use a standard download when the API is absent. Browser settings control whether that fallback asks for a location.
- Save cancellation and failure can look alike: handle AbortError as cancellation and display other errors.
- Automated DOM tests do not prove native picker behavior: validate the integration with injected save dependencies and report this limit.
