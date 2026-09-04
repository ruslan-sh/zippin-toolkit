Status: done

## 1. Tracing image

- [x] 1.1 Add image upload and display above the map. Support PNG, JPEG, and WebP with initial fit, centered placement, and 50 percent opacity.
- [x] 1.2 Add replacement and removal. Preserve the current image on load failure, ignore stale loads, and release unused object URLs.
- [x] 1.3 Add Move image mode, proportional size control, and opacity control. Keep map alignment during scroll and route paint and erase gestures through the image.

## 2. Behavior checks

- [x] 2.1 Add focused tests for image fit, resize, movement, opacity, replacement, removal, and failed or stale loads.
- [x] 2.2 Add integration tests for tool switching and painting through the image. Verify that the image does not affect Export enablement, bounds, or output.
- [x] 2.3 Run tests, script lint, style lint, and the production build. Record visual checks or their limits without using the built-in browser unless the user asks.

## 3. Required verification

- [x] 3.1 Complete a fresh independent read-only review against all change artifacts. Resolve findings within the repository's three-iteration limit.
- [x] 3.2 Run the complete gate from AGENTS.md without waivers: roadmap validation, workflow validation, OpenSpec integration check, strict pinned OpenSpec validation, tests, script lint, style lint, production build, and git diff --check.
- [x] 3.3 Record evidence in verification.md, finish task status updates, and create the verification receipt with opsx:record-verification. Do not make later non-ignored edits without repeating the gate.
