import {
    GRID_COLUMNS,
    GRID_ROWS,
    HexCell,
    getHexVertices,
} from "./hex-geometry";
import { EDITOR_EMPTY_COLOR, EDITOR_GRID_COLOR } from "./visual-policy";

export interface CanvasContext {
    fillStyle: string | CanvasGradient | CanvasPattern;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
    beginPath: () => void;
    moveTo: (x: number, y: number) => void;
    lineTo: (x: number, y: number) => void;
    closePath: () => void;
    fill: () => void;
    stroke: () => void;
}

export interface ScrollViewport {
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
    scrollLeft: number;
    scrollTop: number;
}

export function renderCell(
    context: CanvasContext,
    cell: HexCell,
    color: string,
    showGrid: boolean,
): void {
    const vertices = getHexVertices(cell);
    context.beginPath();
    context.moveTo(vertices[0].x, vertices[0].y);
    vertices.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.closePath();
    context.fillStyle = color;
    context.fill();

    if (showGrid) {
        context.strokeStyle = EDITOR_GRID_COLOR;
        context.lineWidth = 1;
        context.stroke();
    }
}

export function renderGrid(context: CanvasContext): void {
    for (let row = 0; row < GRID_ROWS; row += 1) {
        for (let column = 0; column < GRID_COLUMNS; column += 1) {
            renderCell(context, { row, column }, EDITOR_EMPTY_COLOR, true);
        }
    }
}

export function centerViewport(viewport: ScrollViewport): void {
    viewport.scrollLeft = Math.max(
        0,
        (viewport.scrollWidth - viewport.clientWidth) / 2,
    );
    viewport.scrollTop = Math.max(
        0,
        (viewport.scrollHeight - viewport.clientHeight) / 2,
    );
}
