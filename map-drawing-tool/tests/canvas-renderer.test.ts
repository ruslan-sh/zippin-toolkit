import test from "node:test";
import assert from "node:assert/strict";

import {
    CanvasContext,
    centerViewport,
    renderCell,
    renderGrid,
} from "../src/canvas-renderer";

class RecordingContext implements CanvasContext {
    fillStyle = "";
    strokeStyle = "";
    lineWidth = 0;
    fillCount = 0;
    strokeCount = 0;
    fillStyles: string[] = [];

    beginPath(): void {}
    moveTo(_x: number, _y: number): void {}
    lineTo(_x: number, _y: number): void {}
    closePath(): void {}

    fill(): void {
        this.fillCount += 1;
        this.fillStyles.push(String(this.fillStyle));
    }

    stroke(): void {
        this.strokeCount += 1;
    }
}

test("initial grid rendering fills every unpainted cell black with grid strokes", () => {
    const context = new RecordingContext();

    renderGrid(context);

    assert.equal(context.fillCount, 10_000);
    assert.equal(context.strokeCount, 10_000);
    assert.equal(context.fillStyles.every((color) => color === "#000000"), true);
});

test("changed-cell rendering uses its current color and redraws its grid stroke", () => {
    const context = new RecordingContext();

    renderCell(context, { row: 9, column: 12 }, "#aabbcc", true);

    assert.deepEqual(context.fillStyles, ["#aabbcc"]);
    assert.equal(context.strokeCount, 1);
});

test("cell rendering can omit grid strokes", () => {
    const context = new RecordingContext();

    renderCell(context, { row: 9, column: 12 }, "#aabbcc", false);

    assert.equal(context.fillCount, 1);
    assert.equal(context.strokeCount, 0);
});

test("initial viewport centers both scroll axes", () => {
    const viewport = {
        scrollWidth: 3600,
        scrollHeight: 3040,
        clientWidth: 900,
        clientHeight: 600,
        scrollLeft: 0,
        scrollTop: 0,
    };

    centerViewport(viewport);

    assert.equal(viewport.scrollLeft, 1350);
    assert.equal(viewport.scrollTop, 1220);
});

test("centering does not produce negative scroll positions", () => {
    const viewport = {
        scrollWidth: 400,
        scrollHeight: 300,
        clientWidth: 800,
        clientHeight: 600,
        scrollLeft: 20,
        scrollTop: 20,
    };

    centerViewport(viewport);

    assert.equal(viewport.scrollLeft, 0);
    assert.equal(viewport.scrollTop, 0);
});
