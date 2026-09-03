import test from "node:test";
import assert from "node:assert/strict";

import {
    GRID_COLUMNS,
    GRID_ROWS,
    HEX_RADIUS,
    getCanvasSize,
    getCellsPixelBounds,
    getHexCenter,
    getHexVertices,
    pixelToCell,
} from "../src/hex-geometry";

const closeTo = (actual: number, expected: number): void => {
    assert.ok(Math.abs(actual - expected) < 0.0001, `${actual} was not close to ${expected}`);
};

test("the grid contains exactly 100 rows and 100 columns", () => {
    assert.equal(GRID_ROWS, 100);
    assert.equal(GRID_COLUMNS, 100);
});

test("odd rows are offset by half a hex width", () => {
    const evenCenter = getHexCenter({ row: 0, column: 0 });
    const oddCenter = getHexCenter({ row: 1, column: 0 });

    closeTo(oddCenter.x - evenCenter.x, Math.sqrt(3) * HEX_RADIUS / 2);
    closeTo(oddCenter.y - evenCenter.y, HEX_RADIUS * 1.5);
});

test("pointy-top vertices start at the top and remain inside the hex bounds", () => {
    const center = getHexCenter({ row: 0, column: 0 });
    const vertices = getHexVertices({ row: 0, column: 0 });

    assert.equal(vertices.length, 6);
    closeTo(vertices[0].x, center.x);
    closeTo(vertices[0].y, center.y - HEX_RADIUS);
    closeTo(vertices[1].x, center.x + Math.sqrt(3) * HEX_RADIUS / 2);
    closeTo(vertices[1].y, center.y - HEX_RADIUS / 2);
});

test("pixel hit detection identifies centers on even and odd rows", () => {
    const evenCell = { row: 20, column: 30 };
    const oddCell = { row: 21, column: 30 };

    assert.deepEqual(pixelToCell(getHexCenter(evenCell).x, getHexCenter(evenCell).y), evenCell);
    assert.deepEqual(pixelToCell(getHexCenter(oddCell).x, getHexCenter(oddCell).y), oddCell);
});

test("pixel hit detection distinguishes cells on either side of a shared edge", () => {
    const leftCell = { row: 20, column: 30 };
    const rightCell = { row: 20, column: 31 };
    const leftCenter = getHexCenter(leftCell);
    const rightCenter = getHexCenter(rightCell);
    const edgeX = (leftCenter.x + rightCenter.x) / 2;

    assert.deepEqual(pixelToCell(edgeX - 0.001, leftCenter.y), leftCell);
    assert.deepEqual(pixelToCell(edgeX + 0.001, leftCenter.y), rightCell);
});

test("pixel hit detection accepts points just inside every hex corner", () => {
    const cell = { row: 20, column: 30 };
    const center = getHexCenter(cell);

    getHexVertices(cell).forEach((vertex) => {
        const x = vertex.x + (center.x - vertex.x) * 0.001;
        const y = vertex.y + (center.y - vertex.y) * 0.001;
        assert.deepEqual(pixelToCell(x, y), cell);
    });
});

test("pixel hit detection identifies cells at every map corner", () => {
    const cornerCells = [
        { row: 0, column: 0 },
        { row: 0, column: GRID_COLUMNS - 1 },
        { row: GRID_ROWS - 1, column: 0 },
        { row: GRID_ROWS - 1, column: GRID_COLUMNS - 1 },
    ];

    cornerCells.forEach((cell) => {
        const center = getHexCenter(cell);
        assert.deepEqual(pixelToCell(center.x, center.y), cell);
    });
});

test("pixel hit detection rejects points beyond every grid edge", () => {
    const size = getCanvasSize();

    assert.equal(pixelToCell(-1, size.height / 2), null);
    assert.equal(pixelToCell(size.width + 1, size.height / 2), null);
    assert.equal(pixelToCell(size.width / 2, -1), null);
    assert.equal(pixelToCell(size.width / 2, size.height + 1), null);
});

test("painted bounds contain the complete polygons of distant cells", () => {
    const first = getHexCenter({ row: 2, column: 3 });
    const second = getHexCenter({ row: 8, column: 10 });
    const bounds = getCellsPixelBounds([
        { row: 2, column: 3 },
        { row: 8, column: 10 },
    ]);

    assert.ok(bounds);
    if (!bounds) {
        return;
    }

    closeTo(bounds.minX, first.x - Math.sqrt(3) * HEX_RADIUS / 2);
    closeTo(bounds.minY, first.y - HEX_RADIUS);
    closeTo(bounds.maxX, second.x + Math.sqrt(3) * HEX_RADIUS / 2);
    closeTo(bounds.maxY, second.y + HEX_RADIUS);
});

test("painted bounds are absent when no cells are supplied", () => {
    assert.equal(getCellsPixelBounds([]), null);
});
