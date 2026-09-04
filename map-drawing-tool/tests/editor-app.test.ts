import test from "node:test";
import assert from "node:assert/strict";

import { CanvasContext } from "../src/canvas-renderer";
import { AppElements, initializeEditor } from "../src/editor-app";
import { getHexCenter } from "../src/hex-geometry";
import { HexMapState } from "../src/map-state";
import { exportMapPng, getExportRegion } from "../src/png-export";

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

class FakeRangeInput {
    disabled = false;
    value = "100";
    oninput: (() => void) | null = null;
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
    moveImageButton: FakeButton;
    image: { style: CSSStyleDeclaration };
    imageInput: { value: string; files: File[] | null; onchange: (() => Promise<void>) | null };
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
    const moveImageButton = new FakeButton();
    const image = {
        hidden: true,
        style: {} as CSSStyleDeclaration,
        onpointerdown: null,
        onpointermove: null,
        onpointerup: null,
        onpointercancel: null,
        setPointerCapture: () => {},
        removeAttribute: () => {},
    };
    const imageInput = {
        value: "", files: null as File[] | null, onchange: null as (() => Promise<void>) | null,
    };
    const removeImageButton = new FakeButton();
    const imageSizeInput = new FakeRangeInput();
    const imageOpacityInput = new FakeRangeInput();
    imageOpacityInput.value = "50";
    const workspace = { querySelector: () => image };
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
            moveImageButton: moveImageButton as unknown as HTMLButtonElement,
            imageInput: imageInput as unknown as HTMLInputElement,
            removeImageButton: removeImageButton as unknown as HTMLButtonElement,
            imageSizeInput: imageSizeInput as unknown as HTMLInputElement,
            imageSizeValue: { textContent: "100%" } as HTMLElement,
            imageOpacityInput: imageOpacityInput as unknown as HTMLInputElement,
            imageOpacityValue: { textContent: "50%" } as HTMLElement,
            workspace: workspace as unknown as HTMLElement,
            exportButton: exportButton as unknown as HTMLButtonElement,
            viewport: viewport as unknown as HTMLElement,
            status: status as unknown as HTMLElement,
        },
        context,
        canvas,
        colorInput,
        paintButton,
        eraserButton,
        moveImageButton,
        image,
        imageInput,
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
    assert.equal(fixture.moveImageButton.disabled, true);
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

test("a loaded image supports tracing and tool transitions without entering PNG output", async (t) => {
    class DecodedImage {
        naturalWidth = 600;
        naturalHeight = 400;
        onload: (() => void) | null = null;
        set src(_value: string) {
            this.onload?.();
        }
    }
    const imageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Image");
    Object.defineProperty(globalThis, "Image", { configurable: true, value: DecodedImage });
    t.after(() => {
        if (imageDescriptor) {
            Object.defineProperty(globalThis, "Image", imageDescriptor);
        } else {
            Reflect.deleteProperty(globalThis, "Image");
        }
    });
    t.mock.method(URL, "createObjectURL", () => "blob:tracing-image");
    t.mock.method(URL, "revokeObjectURL", () => {});
    const fixture = createElements();
    const exports: Array<{ width: number; height: number; fills: string[] }> = [];
    initializeEditor(fixture.elements, async (state) => exportMapPng(state, {
        createCanvas: (width, height) => {
            const context = Object.assign(new FakeContext(), {
                fillRect: () => context.fill(),
                translate: () => {},
            });
            exports.push({ width, height, fills: context.fillStyles });
            return { width, height, getContext: () => context,
                toBlob: (callback) => callback(new Blob(["png"])) };
        },
        download: () => {},
    }));
    const load = async () => {
        fixture.imageInput.files = [{ type: "image/png" } as File];
        await fixture.imageInput.onchange?.();
    };
    await load();
    assert.equal(fixture.moveImageButton.disabled, false);
    assert.equal(fixture.exportButton.disabled, true);
    assert.equal(fixture.imageInput.value, "");
    const cell = { row: 50, column: 50 };
    const center = getHexCenter(cell);
    fixture.context.fillStyles.length = 0;

    fixture.moveImageButton.onclick?.();
    fixture.canvas.onpointerdown?.(pointerAt(center.x, center.y));

    assert.deepEqual(fixture.context.fillStyles, []);
    assert.equal(fixture.moveImageButton.getAttribute("aria-pressed"), "true");
    assert.equal(fixture.image.style.pointerEvents, "auto");

    fixture.paintButton.onclick?.();
    assert.equal(fixture.image.style.pointerEvents, "none");
    fixture.canvas.onpointerdown?.(pointerAt(center.x, center.y));

    assert.deepEqual(fixture.context.fillStyles, ["#ffffff"]);
    assert.equal(fixture.exportButton.disabled, false);
    await fixture.exportButton.onclick?.();
    const expected = new HexMapState();
    expected.paint(cell, "#ffffff");
    const region = getExportRegion(expected)!;
    assert.deepEqual(exports, [{ width: region.width, height: region.height,
        fills: ["#000000", "#ffffff"] }]);

    fixture.eraserButton.onclick?.();
    assert.equal(fixture.image.style.pointerEvents, "none");
    fixture.canvas.onpointerdown?.(pointerAt(center.x, center.y));
    assert.equal(fixture.exportButton.disabled, true);
    fixture.elements.imageSizeInput.value = "200";
    fixture.elements.imageSizeInput.oninput?.call(fixture.elements.imageSizeInput, {} as Event);
    fixture.elements.imageOpacityInput.value = "10";
    fixture.elements.imageOpacityInput.oninput?.call(fixture.elements.imageOpacityInput, {} as Event);
    await load();
    assert.equal(fixture.eraserButton.getAttribute("aria-pressed"), "true");
    assert.equal(fixture.elements.imageSizeInput.value, "100");
    assert.equal(fixture.elements.imageOpacityInput.value, "50");
    fixture.moveImageButton.onclick?.();
    await load();
    assert.equal(fixture.paintButton.getAttribute("aria-pressed"), "true");
    fixture.canvas.onpointerdown?.(pointerAt(center.x, center.y));
    fixture.moveImageButton.onclick?.();
    fixture.elements.removeImageButton.onclick?.call(fixture.elements.removeImageButton, {} as PointerEvent);
    assert.equal(fixture.paintButton.getAttribute("aria-pressed"), "true");
    assert.equal(fixture.moveImageButton.disabled, true);
    assert.equal(fixture.elements.imageSizeInput.disabled, true);
    assert.equal(fixture.exportButton.disabled, false);
    await fixture.exportButton.onclick?.();
    assert.deepEqual(exports[1], exports[0]);
});
