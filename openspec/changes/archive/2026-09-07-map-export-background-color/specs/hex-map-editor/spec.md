## MODIFIED Requirements

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

## ADDED Requirements

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
