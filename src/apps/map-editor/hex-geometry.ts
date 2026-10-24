export interface HexCell {
    row: number;
    column: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface PixelBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export const GRID_ROWS = 100;
export const GRID_COLUMNS = 100;
export const HEX_RADIUS = 20;

export function getHexLine(start: HexCell, end: HexCell): HexCell[] {
    const startX = start.column - (start.row - (start.row & 1)) / 2;
    const endX = end.column - (end.row - (end.row & 1)) / 2;
    const startZ = start.row;
    const endZ = end.row;
    const steps = Math.max(
        Math.abs(endX - startX), Math.abs(endZ - startZ),
        Math.abs(endX + endZ - startX - startZ),
    );
    if (steps === 0) {
        return [start];
    }
    return Array.from({ length: steps + 1 }, (_unused, index) => {
        const fraction = index / steps;
        const x = startX + (endX - startX) * fraction;
        const z = startZ + (endZ - startZ) * fraction;
        const y = -x - z;
        let roundedX = Math.round(x);
        const roundedY = Math.round(y);
        let roundedZ = Math.round(z);
        const xError = Math.abs(roundedX - x);
        const yError = Math.abs(roundedY - y);
        const zError = Math.abs(roundedZ - z);
        if (xError > yError && xError > zError) {
            roundedX = -roundedY - roundedZ;
        } else if (zError >= yError) {
            roundedZ = -roundedX - roundedY;
        }
        return {
            row: roundedZ,
            column: roundedX + (roundedZ - (roundedZ & 1)) / 2,
        };
    }).filter(isValidCell);
}

const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const ROW_HEIGHT = HEX_RADIUS * 1.5;
const CANVAS_PADDING = HEX_RADIUS;

export function getHexCenter(cell: HexCell): Point {
    return {
        x:
            CANVAS_PADDING +
            HEX_WIDTH / 2 +
            cell.column * HEX_WIDTH +
            (cell.row % 2 === 1 ? HEX_WIDTH / 2 : 0),
        y: CANVAS_PADDING + HEX_RADIUS + cell.row * ROW_HEIGHT,
    };
}

export function getHexVertices(cell: HexCell): Point[] {
    const center = getHexCenter(cell);

    return Array.from({ length: 6 }, (_unused, index) => {
        const angle = (Math.PI / 180) * (60 * index - 90);
        return {
            x: center.x + HEX_RADIUS * Math.cos(angle),
            y: center.y + HEX_RADIUS * Math.sin(angle),
        };
    });
}

export function getCanvasSize(): { width: number; height: number } {
    const lastOddRowOffset = GRID_ROWS > 1 ? HEX_WIDTH / 2 : 0;

    return {
        width: Math.ceil(
            CANVAS_PADDING * 2 + GRID_COLUMNS * HEX_WIDTH + lastOddRowOffset,
        ),
        height: Math.ceil(
            CANVAS_PADDING * 2 + HEX_RADIUS * 2 + (GRID_ROWS - 1) * ROW_HEIGHT,
        ),
    };
}

function isValidCell(cell: HexCell): boolean {
    return (
        cell.row >= 0 &&
        cell.row < GRID_ROWS &&
        cell.column >= 0 &&
        cell.column < GRID_COLUMNS
    );
}

function containsPoint(cell: HexCell, x: number, y: number): boolean {
    const vertices = getHexVertices(cell);
    let inside = false;

    for (let current = 0, previous = vertices.length - 1; current < vertices.length; previous = current++) {
        const currentVertex = vertices[current];
        const previousVertex = vertices[previous];
        const crosses =
            currentVertex.y > y !== previousVertex.y > y &&
            x <
                ((previousVertex.x - currentVertex.x) * (y - currentVertex.y)) /
                    (previousVertex.y - currentVertex.y) +
                    currentVertex.x;
        if (crosses) {
            inside = !inside;
        }
    }

    return inside;
}

export function pixelToCell(x: number, y: number): HexCell | null {
    const estimatedRow = Math.round((y - CANVAS_PADDING - HEX_RADIUS) / ROW_HEIGHT);

    for (let row = estimatedRow - 1; row <= estimatedRow + 1; row += 1) {
        const rowOffset = row % 2 === 1 ? HEX_WIDTH / 2 : 0;
        const estimatedColumn = Math.round(
            (x - CANVAS_PADDING - HEX_WIDTH / 2 - rowOffset) / HEX_WIDTH,
        );

        for (
            let column = estimatedColumn - 1;
            column <= estimatedColumn + 1;
            column += 1
        ) {
            const cell = { row, column };
            if (isValidCell(cell) && containsPoint(cell, x, y)) {
                return cell;
            }
        }
    }

    return null;
}

export function getCellsPixelBounds(cells: HexCell[]): PixelBounds | null {
    if (cells.length === 0) {
        return null;
    }

    const vertices = cells.flatMap(getHexVertices);
    return {
        minX: Math.min(...vertices.map((point) => point.x)),
        minY: Math.min(...vertices.map((point) => point.y)),
        maxX: Math.max(...vertices.map((point) => point.x)),
        maxY: Math.max(...vertices.map((point) => point.y)),
    };
}
