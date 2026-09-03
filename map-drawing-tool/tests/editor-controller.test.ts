import test from "node:test";
import assert from "node:assert/strict";

import {
    EditorController,
    EditorTool,
    EditorView,
} from "../src/editor-controller";
import { HexCell } from "../src/hex-geometry";
import { HexMapState } from "../src/map-state";

class RecordingView implements EditorView {
    rendered: Array<{ cell: HexCell; color: string }> = [];
    exportEnabled: boolean[] = [];
    activeTools: EditorTool[] = [];

    renderCell(cell: HexCell, color: string): void {
        this.rendered.push({ cell, color });
    }

    setExportEnabled(enabled: boolean): void {
        this.exportEnabled.push(enabled);
    }

    setActiveTool(tool: EditorTool): void {
        this.activeTools.push(tool);
    }
}

test("controller starts with Paint active and export disabled", () => {
    const view = new RecordingView();

    new EditorController(new HexMapState(), view);

    assert.deepEqual(view.activeTools, ["paint"]);
    assert.deepEqual(view.exportEnabled, [false]);
});

test("selected color applies only to later painting", () => {
    const state = new HexMapState();
    const view = new RecordingView();
    const controller = new EditorController(state, view);

    controller.pointerDown({ row: 1, column: 1 }, 0);
    controller.pointerUp();
    controller.setColor("#123456");
    controller.pointerDown({ row: 1, column: 2 }, 0);

    assert.equal(state.getColor({ row: 1, column: 1 }), "#ffffff");
    assert.equal(state.getColor({ row: 1, column: 2 }), "#123456");
});

test("primary-button dragging paints each newly entered cell once", () => {
    const state = new HexMapState();
    const view = new RecordingView();
    const controller = new EditorController(state, view);

    controller.pointerDown({ row: 5, column: 5 }, 0);
    controller.pointerMove({ row: 5, column: 5 }, 1);
    controller.pointerMove({ row: 5, column: 6 }, 1);
    controller.pointerMove({ row: 5, column: 6 }, 1);
    controller.pointerUp();

    assert.equal(state.size, 2);
    assert.deepEqual(view.rendered, [
        { cell: { row: 5, column: 5 }, color: "#ffffff" },
        { cell: { row: 5, column: 6 }, color: "#ffffff" },
    ]);
    assert.equal(view.exportEnabled[view.exportEnabled.length - 1], true);
});

test("non-primary buttons and invalid coordinates do not paint", () => {
    const state = new HexMapState();
    const view = new RecordingView();
    const controller = new EditorController(state, view);

    controller.pointerDown({ row: 1, column: 1 }, 2);
    controller.pointerDown(null, 0);
    controller.pointerMove(null, 1);

    assert.equal(state.size, 0);
    assert.deepEqual(view.rendered, []);
});

test("fast dragging paints and erases the cells between pointer samples", () => {
    const state = new HexMapState();
    const controller = new EditorController(state, new RecordingView());
    controller.pointerDown({ row: 5, column: 5 }, 0);
    controller.pointerMove({ row: 5, column: 9 }, 1);
    for (let column = 5; column <= 9; column += 1) {
        assert.equal(state.getColor({ row: 5, column }), "#ffffff");
    }
    assert.equal(state.size, 5);
    controller.pointerUp();
    controller.setTool("erase");
    controller.pointerDown({ row: 5, column: 9 }, 0);
    controller.pointerMove({ row: 5, column: 5 }, 1);
    assert.equal(state.size, 0);
});

test("drag interpolation crosses odd and even rows", () => {
    const state = new HexMapState();
    const controller = new EditorController(state, new RecordingView());
    controller.pointerDown({ row: 2, column: 2 }, 0);
    controller.pointerMove({ row: 6, column: 4 }, 1);
    assert.deepEqual(state.getPaintedCells(), [
        { row: 2, column: 2 }, { row: 3, column: 2 },
        { row: 4, column: 3 }, { row: 5, column: 3 },
        { row: 6, column: 4 },
    ]);
});

test("leaving the grid breaks the interpolation path", () => {
    const state = new HexMapState();
    const controller = new EditorController(state, new RecordingView());
    controller.pointerDown({ row: 5, column: 5 }, 0);
    controller.pointerMove(null, 1);
    controller.pointerMove({ row: 5, column: 9 }, 1);
    assert.equal(state.size, 2);
});

test("boundary dragging never paints outside the offset grid", () => {
    const state = new HexMapState();
    const controller = new EditorController(state, new RecordingView());
    controller.pointerDown({ row: 1, column: 99 }, 0);
    controller.pointerMove({ row: 3, column: 99 }, 1);
    assert.equal(state.getColor({ row: 2, column: 100 }), undefined);
    assert.ok(state.getPaintedCells().every((cell) =>
        cell.row >= 0 && cell.row < 100 && cell.column >= 0 && cell.column < 100,
    ));
});

test("dragging stops when the primary button is no longer pressed", () => {
    const state = new HexMapState();
    const view = new RecordingView();
    const controller = new EditorController(state, view);

    controller.pointerDown({ row: 1, column: 1 }, 0);
    controller.pointerMove({ row: 1, column: 2 }, 0);
    controller.pointerMove({ row: 1, column: 3 }, 1);

    assert.equal(state.size, 1);
});

test("Eraser drag removes painted cells, renders black, and disables export when empty", () => {
    const state = new HexMapState();
    const view = new RecordingView();
    const controller = new EditorController(state, view);
    const firstCell = { row: 3, column: 4 };
    const secondCell = { row: 3, column: 5 };
    controller.pointerDown(firstCell, 0);
    controller.pointerUp();
    controller.pointerDown(secondCell, 0);
    controller.pointerUp();

    controller.setTool("erase");
    controller.pointerDown(firstCell, 0);
    controller.pointerMove(secondCell, 1);

    assert.equal(state.size, 0);
    assert.deepEqual(view.activeTools, ["paint", "erase"]);
    assert.deepEqual(view.rendered.slice(-2), [
        { cell: firstCell, color: "#000000" },
        { cell: secondCell, color: "#000000" },
    ]);
    assert.equal(view.exportEnabled[view.exportEnabled.length - 1], false);
});
