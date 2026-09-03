import test from "node:test";
import assert from "node:assert/strict";

import { CanvasContext } from "../src/canvas-renderer";
import { ExportCanvas, exportMapPng, getExportRegion } from "../src/png-export";
import { HEX_RADIUS, getCellsPixelBounds } from "../src/hex-geometry";
import { HexMapState } from "../src/map-state";

class ExportContext implements CanvasContext {
    fillStyle: string | CanvasGradient | CanvasPattern = "";
    strokeStyle: string | CanvasGradient | CanvasPattern = "";
    lineWidth = 0;
    fillCount = 0;
    strokeCount = 0;
    backgrounds: Array<{ color: string; width: number; height: number }> = [];
    translations: Array<{ x: number; y: number }> = [];

    beginPath(): void {}
    moveTo(_x: number, _y: number): void {}
    lineTo(_x: number, _y: number): void {}
    closePath(): void {}
    fill(): void {
        this.fillCount += 1;
    }
    stroke(): void {
        this.strokeCount += 1;
    }
    fillRect(_x: number, _y: number, width: number, height: number): void {
        this.backgrounds.push({ color: String(this.fillStyle), width, height });
    }
    translate(x: number, y: number): void {
        this.translations.push({ x, y });
    }
}

class FakeExportCanvas implements ExportCanvas {
    readonly context = new ExportContext();

    constructor(
        public width: number,
        public height: number,
        private readonly blob: Blob | null = new Blob(["png"]),
    ) {}

    getContext(): ExportContext {
        return this.context;
    }

    toBlob(callback: (blob: Blob | null) => void): void {
        callback(this.blob);
    }
}

test("empty maps do not have an export region", () => {
    assert.equal(getExportRegion(new HexMapState()), null);
});

test("an explicitly black cell defines export bounds with one-radius margin", () => {
    const state = new HexMapState();
    const cell = { row: 0, column: 0 };
    state.paint(cell, "#000000");
    const bounds = getCellsPixelBounds([cell]);
    assert.ok(bounds);

    const region = getExportRegion(state);
    assert.ok(region);
    assert.equal(region.x, 0);
    assert.equal(region.y, 0);
    assert.equal(region.width, Math.ceil(bounds.maxX + HEX_RADIUS));
    assert.equal(region.height, Math.ceil(bounds.maxY + HEX_RADIUS));
});

test("PNG export uses a black background, painted fills, and no grid strokes", async () => {
    const state = new HexMapState();
    state.paint({ row: 10, column: 10 }, "#ff0000");
    const region = getExportRegion(state);
    assert.ok(region);
    const canvases: FakeExportCanvas[] = [];
    const downloads: Array<{ blob: Blob; filename: string }> = [];

    const exported = await exportMapPng(state, {
        createCanvas: (width: number, height: number) => {
            const canvas = new FakeExportCanvas(width, height);
            canvases.push(canvas);
            return canvas;
        },
        download: (blob: Blob, filename: string) => downloads.push({ blob, filename }),
    });

    assert.equal(exported, true);
    const canvas = canvases[0];
    assert.deepEqual(
        { width: canvas.width, height: canvas.height },
        { width: region.width, height: region.height },
    );
    assert.deepEqual(canvas.context.backgrounds, [
        { color: "#000000", width: region.width, height: region.height },
    ]);
    assert.equal(canvas.context.fillCount, 1);
    assert.equal(canvas.context.strokeCount, 0);
    assert.deepEqual(canvas.context.translations, [{ x: -region.x, y: -region.y }]);
    assert.equal(downloads.length, 1);
    assert.equal(downloads[0].filename, "map.png");
});

test("empty map export returns without creating a canvas", async () => {
    let createCount = 0;

    const exported = await exportMapPng(new HexMapState(), {
        createCanvas: () => {
            createCount += 1;
            return new FakeExportCanvas(1, 1);
        },
        download: () => undefined,
    });

    assert.equal(exported, false);
    assert.equal(createCount, 0);
});

test("PNG generation failure rejects without downloading", async () => {
    const state = new HexMapState();
    state.paint({ row: 10, column: 10 }, "#ff0000");
    let downloadCount = 0;

    await assert.rejects(
        exportMapPng(state, {
            createCanvas: (width: number, height: number) =>
                new FakeExportCanvas(width, height, null),
            download: () => {
                downloadCount += 1;
            },
        }),
        /PNG image/,
    );
    assert.equal(downloadCount, 0);
    assert.equal(state.getColor({ row: 10, column: 10 }), "#ff0000");
});
