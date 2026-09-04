## ADDED Requirements

### Requirement: Load one tracing image
The system SHALL let the user select one local PNG, JPEG, or WebP image with
an image upload control. The system SHALL display the image above the painted
hexes at 50 percent opacity. It SHALL keep the aspect ratio and place the
image at the center of the visible map area, reduced to fit that area if
necessary. The image SHALL remain at its map position during scrolling.

#### Scenario: User adds an image
- **WHEN** the user selects a supported image that can be decoded
- **THEN** the editor shows that image above the hexes without changing painted cells
- **AND** the image is centered in the visible map area at 50 percent opacity

#### Scenario: User replaces the image
- **WHEN** the user selects another valid image through the same upload control
- **THEN** the new image replaces the current image with the initial position, size, and opacity
- **AND** only one tracing image remains

#### Scenario: Image loading fails
- **WHEN** the selected file has an unsupported format or cannot be decoded
- **THEN** the editor shows a short error message and keeps the current image and painted cells unchanged

#### Scenario: User cancels selection
- **WHEN** the user closes the file chooser without selecting a file
- **THEN** the current image and painted cells remain unchanged

#### Scenario: Latest image request wins
- **WHEN** a previous image load finishes after a newer selection or removal
- **THEN** the previous load does not replace or restore the tracing image

#### Scenario: User scrolls the map
- **WHEN** the user scrolls with a tracing image present
- **THEN** the image stays aligned with the same map coordinates

### Requirement: Adjust the tracing image
The system SHALL provide a Move image mode, a size control that preserves
the aspect ratio, and an opacity control from 0 to 100 percent. Size SHALL
range from 10 to 400 percent of the initial fitted size. Resizing SHALL keep
the image center fixed. Image controls SHALL have accessible labels and be
disabled when no image is present.

#### Scenario: User moves the image
- **WHEN** Move image is active and the user drags the image with the primary pointer button
- **THEN** the image moves with the pointer without painting or erasing cells
- **AND** at least part of the image stays inside the map workspace

#### Scenario: User resizes the image
- **WHEN** the user changes the size control
- **THEN** the image changes size with a fixed aspect ratio and fixed center
- **AND** the painted cells remain unchanged

#### Scenario: User changes opacity
- **WHEN** the user changes the opacity control
- **THEN** only the image opacity changes, with 0 percent invisible and 100 percent opaque

#### Scenario: User paints through the image
- **WHEN** Paint or Eraser is active and the user presses or drags over the image
- **THEN** the editor paints or erases the underlying hexes using the existing tool behavior
- **AND** the image position remains unchanged

### Requirement: Remove the tracing image
The system SHALL provide a Remove image button. Removal SHALL clear the
image without changing painted cells. If Move image is active, removal SHALL
return the editor to Paint mode.

#### Scenario: User removes an image
- **WHEN** the user activates Remove image
- **THEN** the image is removed and its adjustment controls are disabled
- **AND** the painted map remains unchanged

### Requirement: Keep the tracing image out of exports
The system SHALL exclude the tracing image from PNG output, export bounds,
and the decision to enable Export. The tracing image SHALL exist only in the
current page session.

#### Scenario: Image is present during export
- **WHEN** the user exports painted cells while a tracing image is present
- **THEN** the PNG contains only the painted map with the existing background, margin, and crop behavior

#### Scenario: Only an image is present
- **WHEN** an image is present and no hex is painted
- **THEN** Export remains disabled

#### Scenario: User reloads the page
- **WHEN** the user reloads the editor
- **THEN** no tracing image is restored
