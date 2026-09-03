## Purpose

The hex map editor lets users create a simple color-coded pointy-top hex map
and export the painted portion as a portable PNG image.

## ADDED Requirements

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
hexes plus a small black margin. The PNG SHALL use a black background, SHALL
exclude editor grid lines, and SHALL download as `map.png`.

#### Scenario: Painted map is exported
- **WHEN** at least one hex is painted and the user activates Export
- **THEN** the system downloads `map.png` cropped to the painted bounds with a black margin and no grid lines

#### Scenario: Black is used as paint
- **WHEN** the user paints a hex black
- **THEN** the system treats that hex as painted when calculating export bounds

#### Scenario: Empty map cannot be exported
- **WHEN** no hex is painted
- **THEN** the Export control is disabled

#### Scenario: PNG generation fails
- **WHEN** the browser cannot generate or download the PNG
- **THEN** the system keeps the current map unchanged and shows a short error message

### Requirement: Map Drawing Tool is discoverable
The system SHALL present the Map Drawing Tool as a standalone Toolkit page and
link to it from the Toolkit landing page.

#### Scenario: User opens the tool from the Toolkit
- **WHEN** the user activates the Map Drawing Tool link on the Toolkit landing page
- **THEN** the browser opens the standalone Map Drawing Tool page
