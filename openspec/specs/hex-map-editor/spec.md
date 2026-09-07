# hex-map-editor Specification

## Purpose
The hex map editor lets users create a simple color-coded pointy-top hex map
and export the painted portion as a portable PNG image.
## Requirements
### Requirement: Fixed hex map workspace
The system SHALL provide a fixed 100 by 100 pointy-top hex grid at a fixed zoom
level. Unpainted hexes SHALL appear black, the editor SHALL show grid lines,
and the editor SHALL use standard scrollbars with the initial viewport centered
on the grid.

#### Scenario: Editor opens
- **WHEN** the user opens the Map Drawing Tool
- **THEN** the system shows the center of a black 100 by 100 pointy-top hex grid

#### Scenario: User navigates the grid
- **WHEN** the grid is larger than the available editor viewport
- **THEN** the system provides horizontal and vertical scrollbars

### Requirement: Paint individual hexes
The system SHALL let the user select a color and paint individual grid hexes
with the primary mouse button. The user SHALL be able to continue painting by
dragging across hexes, and a later color selection SHALL affect only later
painting.

#### Scenario: User paints one hex
- **WHEN** the user selects a color and presses the primary mouse button inside a hex
- **THEN** the system fills that hex with the selected color

#### Scenario: User paints by dragging
- **WHEN** the user holds the primary mouse button and drags across grid hexes
- **THEN** the system fills each entered hex with the selected color

#### Scenario: User changes color
- **WHEN** the user changes the selected color after painting one or more hexes
- **THEN** existing painted hexes keep their colors and later painting uses the new color

#### Scenario: Pointer is outside the grid
- **WHEN** a painting gesture is outside the 100 by 100 grid
- **THEN** the system does not change the map

### Requirement: Erase individual hexes
The system SHALL provide an eraser tool that removes paint from individual
hexes and returns them to the unpainted black state.

#### Scenario: User erases a painted hex
- **WHEN** the eraser is selected and the user presses or drags over a painted hex
- **THEN** the system removes that hex from the painted map

### Requirement: Export the painted map as PNG
The system SHALL export the smallest rectangular image containing all painted
hexes plus the existing small margin. The PNG SHALL use the background selected
in the export dialog, SHALL exclude editor grid lines, and SHALL use `map.png`
as the suggested filename. The system SHALL open a system save dialog when the
browser supports it, and SHALL use a standard download otherwise.

#### Scenario: Painted map is exported
- **WHEN** at least one hex is painted and the user confirms Export in the settings dialog
- **THEN** the system saves a PNG cropped to the painted bounds with the existing margin size, selected background, and no grid lines

#### Scenario: Black is used as paint
- **WHEN** the user paints a hex black
- **THEN** the system treats that hex as painted when calculating export bounds

#### Scenario: Empty map cannot be exported
- **WHEN** no hex is painted
- **THEN** the editor Export control is disabled

#### Scenario: PNG generation fails
- **WHEN** the browser cannot generate the PNG
- **THEN** the system keeps the map unchanged, shows a short error message, and allows another export attempt

#### Scenario: PNG saving fails
- **WHEN** the browser cannot save the PNG
- **THEN** the system keeps the map unchanged, shows a short error message, and allows another export attempt

#### Scenario: System save dialog is supported
- **WHEN** the user confirms Export in a browser with save picker support
- **THEN** the system opens the system save dialog with `map.png` as the suggested filename and writes the PNG to the selected file

#### Scenario: User cancels system save
- **WHEN** the user cancels the system save dialog
- **THEN** the system does not download a file or show an error, and allows another export attempt

#### Scenario: System save dialog is unavailable
- **WHEN** the user confirms Export in a browser without save picker support
- **THEN** the system uses a standard PNG download named `map.png`

### Requirement: Map Drawing Tool is discoverable
The system SHALL present the Map Drawing Tool as a standalone Toolkit page and
link to it from the Toolkit landing page.

#### Scenario: User opens the tool from the Toolkit
- **WHEN** the user activates the Map Drawing Tool link on the Toolkit landing page
- **THEN** the browser opens the standalone Map Drawing Tool page

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

### Requirement: Configure export background in a dialog
The editor Export control SHALL open a labeled modal settings dialog with a
Background color input, a Transparent background option, Cancel, and a primary
Export action. The initial background SHALL be solid black. Settings SHALL
remain selected during the page session. The dialog SHALL support keyboard
use and Escape to cancel. Selecting transparency SHALL disable the color
input and retain its selected color. Background settings SHALL affect only PNG
output. The system SHALL prevent duplicate export submissions while saving.

#### Scenario: User opens export settings
- **WHEN** the user activates the enabled editor Export control
- **THEN** the dialog opens without generating or saving a file

#### Scenario: User selects a solid background
- **WHEN** the user selects a color with transparency off and exports
- **THEN** unpainted areas and margins use that color and painted cells keep their colors

#### Scenario: User selects transparency
- **WHEN** the user selects Transparent background and exports
- **THEN** unpainted areas and margins are transparent and painted cells keep their colors

#### Scenario: User cancels settings
- **WHEN** the user activates Cancel or presses Escape
- **THEN** the dialog closes without saving and focus returns to the editor Export control

#### Scenario: User reopens settings
- **WHEN** the user opens the dialog again during the same page session
- **THEN** the last background selections remain available

#### Scenario: Save is in progress
- **WHEN** an export is still being saved
- **THEN** another activation does not start a duplicate save

