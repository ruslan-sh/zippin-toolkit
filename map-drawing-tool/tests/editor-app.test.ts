import test from "node:test";
import assert from "node:assert/strict";

import { CanvasContext } from "../src/canvas-renderer";
import { AppElements, initializeEditor } from "../src/editor-app";
import { getHexCenter } from "../src/hex-geometry";

class FakeContext implements CanvasContext {
    fillStyle: string | CanvasGradient | CanvasPattern = "";
    strokeStyle: string | CanvasGradient | CanvasPattern = "";
    lineWidth = 0;
    fillStyles: string[] = [];

    beginPath(): void {}
    moveTo(_x: number, _y: number): void {}
    lineTo(_x: number, _y: number): void {}
    closePath(): void {}
    fill(): void {
        this.fillStyles.push(String(this.fillStyle));
    }
    stroke(): void {}
}

class FakeButton {
    disabled = false;
    onclick: (() => void | Promise<void>) | null = null;
    private readonly attributes = new Map<string, string>();

    setAttribute(name: string, value: string): void {
        this.attributes.set(name, value);
    }

    getAttribute(name: string): string | null {
        return this.attributes.get(name) ?? null;
    }
}

function createElements(): {
    elements: AppElements;
    context: FakeContext;
    canvas: {
        width: number;
        height: number;
        onpointerdown: ((event: PointerEvent) => void) | null;
        onpointermove: ((event: PointerEvent) => void) | null;
        onpointerup: (() => void) | null;
    };
    colorInput: { value: string; oninput: (() => void) | null };
    paintButton: FakeButton;
    eraserButton: FakeButton;
    exportButton: FakeButton;
    viewport: {
        scrollWidth: number;
        scrollHeight: number;
        clientWidth: number;
        clientHeight: number;
        scrollLeft: number;
        scrollTop: number;
    };
    status: { textContent: string | null };
} {
    const context = new FakeContext();
    const canvas = {
        width: 0,
        height: 0,
        onpointerdown: null as ((event: PointerEvent) => void) | null,
        onpointermove: null as ((event: PointerEvent) => void) | null,
        onpointerup: null as (() => void) | null,
        onpointerleave: null as (() => void) | null,
        getContext: () => context,
        getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: canvas.width,
            height: canvas.height,
        }),
    };
    const colorInput = { value: "#ffffff", oninput: null as (() => void) | null };
    const paintButton = new FakeButton();
    const eraserButton = new FakeButton();
    const exportButton = new FakeButton();
    const viewport = {
        scrollWidth: 3600,
        scrollHeight: 3040,
        clientWidth: 900,
        clientHeight: 600,
        scrollLeft: 0,
        scrollTop: 0,
    };
    const status = { textContent: null as string | null };

    return {
        elements: {
            canvas: canvas as unknown as HTMLCanvasElement,
            colorInput: colorInput as unknown as HTMLInputElement,
            paintButton: paintButton as unknown as HTMLButtonElement,
            eraserButton: eraserButton as unknown as HTMLButtonElement,
            exportButton: exportButton as unknown as HTMLButtonElement,
            viewport: viewport as unknown as HTMLElement,
            status: status as unknown as HTMLElement,
        },
        context,
        canvas,
        colorInput,
        paintButton,
        eraserButton,
        exportButton,
        viewport,
        status,
    };
}

function pointerAt(x: number, y: number, button = 0, buttons = 1): PointerEvent {
    return { clientX: x, clientY: y, button, buttons } as PointerEvent;
}

test("editor initializes centered with Paint active and an empty black grid", () => {
    const fixture = createElements();

    initializeEditor(fixture.elements, async () => true);

    assert.equal(fixture.paintButton.getAttribute("aria-pressed"), "true");
    assert.equal(fixture.eraserButton.getAttribute("aria-pressed"), "false");
    assert.equal(fixture.exportButton.disabled, true);
    assert.equal(
        fixture.viewport.scrollLeft,
        (fixture.viewport.scrollWidth - fixture.viewport.clientWidth) / 2,
    );
    assert.equal(
        fixture.viewport.scrollTop,
        (fixture.viewport.scrollHeight - fixture.viewport.clientHeight) / 2,
    );
});

test("page controls paint with a selected color and erase the same cell", () => {
    const fixture = createElements();
    initializeEditor(fixture.elements, async () => true);
    const center = getHexCenter({ row: 50, column: 50 });
    fixture.context.fillStyles.length = 0;

    fixture.colorInput.value = "#123456";
    fixture.colorInput.oninput?.();
    fixture.canvas.onpointerdown?.(pointerAt(center.x, center.y));

    assert.deepEqual(fixture.context.fillStyles, ["#123456"]);
    assert.equal(fixture.exportButton.disabled, false);

    fixture.eraserButton.onclick?.();
    fixture.canvas.onpointerup?.();
    fixture.canvas.onpointerdown?.(pointerAt(center.x, center.y));

    assert.deepEqual(fixture.context.fillStyles, ["#123456", "#000000"]);
    assert.equal(fixture.exportButton.disabled, true);
    assert.equal(fixture.eraserButton.getAttribute("aria-pressed"), "true");
});

test("export failure keeps the map available and reports a short error", async () => {
    const fixture = createElements();
    initializeEditor(fixture.elements, async () => {
        throw new Error("Could not create the PNG image.");
    });
    const center = getHexCenter({ row: 50, column: 50 });
    fixture.canvas.onpointerdown?.(pointerAt(center.x, center.y));

    await fixture.exportButton.onclick?.();

    assert.equal(fixture.status.textContent, "Could not create the PNG image.");
    assert.equal(fixture.exportButton.disabled, false);
});
