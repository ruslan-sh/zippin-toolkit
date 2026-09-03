import test from "node:test";
import assert from "node:assert/strict";

import { HexMapState } from "../src/map-state";

test("painting stores a color for one coordinate", () => {
    const state = new HexMapState();

    assert.equal(state.paint({ row: 4, column: 7 }, "#ff0000"), true);
    assert.equal(state.getColor({ row: 4, column: 7 }), "#ff0000");
    assert.equal(state.size, 1);
});

test("painting the same color reports no state change", () => {
    const state = new HexMapState();
    state.paint({ row: 4, column: 7 }, "#ff0000");

    assert.equal(state.paint({ row: 4, column: 7 }, "#ff0000"), false);
    assert.equal(state.size, 1);
});

test("painting a new color replaces only the selected coordinate", () => {
    const state = new HexMapState();
    state.paint({ row: 4, column: 7 }, "#ff0000");
    state.paint({ row: 8, column: 3 }, "#00ff00");

    assert.equal(state.paint({ row: 4, column: 7 }, "#0000ff"), true);
    assert.equal(state.getColor({ row: 4, column: 7 }), "#0000ff");
    assert.equal(state.getColor({ row: 8, column: 3 }), "#00ff00");
});

test("black paint remains an explicit painted cell", () => {
    const state = new HexMapState();
    state.paint({ row: 50, column: 50 }, "#000000");

    assert.equal(state.size, 1);
    assert.equal(state.getColor({ row: 50, column: 50 }), "#000000");
    assert.deepEqual(state.getPaintedCells(), [{ row: 50, column: 50 }]);
});

test("erasing removes paint and distinguishes an absent coordinate", () => {
    const state = new HexMapState();
    state.paint({ row: 4, column: 7 }, "#ff0000");

    assert.equal(state.erase({ row: 4, column: 7 }), true);
    assert.equal(state.erase({ row: 4, column: 7 }), false);
    assert.equal(state.getColor({ row: 4, column: 7 }), undefined);
    assert.equal(state.size, 0);
});

test("painted entries retain coordinates and colors", () => {
    const state = new HexMapState();
    state.paint({ row: 8, column: 3 }, "#00ff00");
    state.paint({ row: 2, column: 9 }, "#000000");

    assert.deepEqual(state.getPaintedEntries(), [
        { cell: { row: 8, column: 3 }, color: "#00ff00" },
        { cell: { row: 2, column: 9 }, color: "#000000" },
    ]);
});
