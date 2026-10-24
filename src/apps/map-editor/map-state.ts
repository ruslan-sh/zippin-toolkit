import { HexCell } from "./hex-geometry";

export interface PaintedEntry {
    cell: HexCell;
    color: string;
}

function cellKey(cell: HexCell): string {
    return `${cell.row},${cell.column}`;
}

function keyCell(key: string): HexCell {
    const [row, column] = key.split(",").map(Number);
    return { row, column };
}

export class HexMapState {
    private readonly colors = new Map<string, string>();

    get size(): number {
        return this.colors.size;
    }

    paint(cell: HexCell, color: string): boolean {
        const key = cellKey(cell);
        if (this.colors.get(key) === color) {
            return false;
        }

        this.colors.set(key, color);
        return true;
    }

    erase(cell: HexCell): boolean {
        return this.colors.delete(cellKey(cell));
    }

    getColor(cell: HexCell): string | undefined {
        return this.colors.get(cellKey(cell));
    }

    getPaintedCells(): HexCell[] {
        return Array.from(this.colors.keys(), keyCell);
    }

    getPaintedEntries(): PaintedEntry[] {
        return Array.from(this.colors, ([key, color]) => ({
            cell: keyCell(key),
            color,
        }));
    }
}
