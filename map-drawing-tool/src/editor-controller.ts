import { HexCell, getHexLine } from "./hex-geometry";
import { HexMapState } from "./map-state";
import { EDITOR_EMPTY_COLOR } from "./visual-policy";

export type EditorTool = "paint" | "erase";

export interface EditorView {
    renderCell: (cell: HexCell, color: string) => void;
    setExportEnabled: (enabled: boolean) => void;
    setActiveTool: (tool: EditorTool) => void;
}

function cellKey(cell: HexCell): string {
    return `${cell.row},${cell.column}`;
}

export class EditorController {
    private color = "#ffffff";
    private tool: EditorTool = "paint";
    private dragging = false;
    private lastCellKey: string | null = null;
    private lastCell: HexCell | null = null;

    constructor(
        private readonly state: HexMapState,
        private readonly view: EditorView,
    ) {
        this.view.setActiveTool(this.tool);
        this.view.setExportEnabled(false);
    }

    setColor(color: string): void {
        this.color = color;
    }

    setTool(tool: EditorTool): void {
        this.tool = tool;
        this.view.setActiveTool(tool);
    }

    pointerDown(cell: HexCell | null, button: number): void {
        if (button !== 0) {
            return;
        }

        this.dragging = true;
        this.lastCellKey = null;
        this.lastCell = cell;
        this.apply(cell);
    }

    pointerMove(cell: HexCell | null, buttons: number): void {
        if (!this.dragging) {
            return;
        }

        if ((buttons & 1) === 0) {
            this.pointerUp();
            return;
        }

        if (cell && this.lastCell) {
            getHexLine(this.lastCell, cell).forEach((entry) => this.apply(entry));
        } else {
            this.apply(cell);
        }
        this.lastCell = cell;
    }

    pointerUp(): void {
        this.dragging = false;
        this.lastCellKey = null;
        this.lastCell = null;
    }

    private apply(cell: HexCell | null): void {
        if (!cell) {
            this.lastCellKey = null;
            return;
        }

        const key = cellKey(cell);
        if (key === this.lastCellKey) {
            return;
        }
        this.lastCellKey = key;

        const changed =
            this.tool === "paint"
                ? this.state.paint(cell, this.color)
                : this.state.erase(cell);
        if (!changed) {
            return;
        }

        this.view.renderCell(
            cell,
            this.tool === "paint" ? this.color : EDITOR_EMPTY_COLOR,
        );
        this.view.setExportEnabled(this.state.size > 0);
    }
}
