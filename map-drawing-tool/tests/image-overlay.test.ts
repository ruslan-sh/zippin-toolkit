import test from "node:test";
import assert from "node:assert/strict";

import { ImageOverlay } from "../src/image-overlay";

class FakeImage {
    hidden = true;
    src = "";
    naturalWidth = 0;
    naturalHeight = 0;
    style = {} as CSSStyleDeclaration;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onpointerdown: ((event: PointerEvent) => void) | null = null;
    onpointermove: ((event: PointerEvent) => void) | null = null;
    onpointerup: (() => void) | null = null;
    onpointercancel: (() => void) | null = null;
    draggable = true;
    ondragstart: ((event: DragEvent) => void) | null = null;
    setPointerCapture(_pointerId: number): void {}
    hasPointerCapture(_pointerId: number): boolean {
        return false;
    }
    releasePointerCapture(_pointerId: number): void {}
    removeAttribute(_name: string): void {
        this.src = "";
    }
}

const pngFile = { type: "image/png" } as File;

function createOverlay() {
    const image = new FakeImage();
    const candidates: FakeImage[] = [];
    const revoked: string[] = [];
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    let number = 0;
    URL.createObjectURL = () => `blob:${++number}`;
    URL.revokeObjectURL = (url) => revoked.push(url);
    const overlay = new ImageOverlay({
        image: image as unknown as HTMLImageElement,
        workspace: {} as HTMLElement,
        viewport: { clientWidth: 900, clientHeight: 600, scrollLeft: 100, scrollTop: 200 } as HTMLElement,
        canvas: { width: 3600, height: 3040 } as HTMLCanvasElement,
    }, {
        createImage: () => {
            const candidate = new FakeImage();
            candidates.push(candidate);
            return candidate as unknown as HTMLImageElement;
        },
    });
    return { overlay, image, candidates, revoked, restore: () => {
        URL.createObjectURL = originalCreate;
        URL.revokeObjectURL = originalRevoke;
    } };
}

test("loaded image fits the visible map and starts centered at fifty percent opacity", async () => {
    const fixture = createOverlay();
    try {
        const loading = fixture.overlay.load(pngFile);
        fixture.candidates[0].naturalWidth = 1800;
        fixture.candidates[0].naturalHeight = 600;
        fixture.candidates[0].onload?.();

        assert.deepEqual(await loading, { kind: "loaded" });
        assert.equal(fixture.image.hidden, false);
        assert.equal(fixture.image.style.width, "900px");
        assert.equal(fixture.image.style.height, "300px");
        assert.equal(fixture.image.style.left, "100px");
        assert.equal(fixture.image.style.top, "350px");
        assert.equal(fixture.image.style.opacity, "0.5");
    } finally {
        fixture.restore();
    }
});

test("replacement waits for decoding, stale loads do not restore an image, and removal releases it", async () => {
    const fixture = createOverlay();
    try {
        const first = fixture.overlay.load(pngFile);
        const second = fixture.overlay.load(pngFile);
        fixture.candidates[1].naturalWidth = 100;
        fixture.candidates[1].naturalHeight = 100;
        fixture.candidates[1].onload?.();
        await second;
        fixture.overlay.remove();
        fixture.candidates[0].naturalWidth = 100;
        fixture.candidates[0].naturalHeight = 100;
        fixture.candidates[0].onload?.();

        assert.deepEqual(await first, { kind: "ignored" });
        assert.equal(fixture.overlay.present, false);
        assert.deepEqual(fixture.revoked, ["blob:2", "blob:1"]);
    } finally {
        fixture.restore();
    }
});

test("a failed replacement keeps the current image", async () => {
    const fixture = createOverlay();
    try {
        const first = fixture.overlay.load(pngFile);
        fixture.candidates[0].naturalWidth = 100;
        fixture.candidates[0].naturalHeight = 100;
        fixture.candidates[0].onload?.();
        await first;
        const replacement = fixture.overlay.load(pngFile);
        fixture.candidates[1].onerror?.();

        assert.deepEqual(await replacement, { kind: "error", message: "Could not load this image." });
        assert.equal(fixture.overlay.present, true);
        assert.equal(fixture.image.src, "blob:1");
        assert.deepEqual(fixture.revoked, ["blob:2"]);
    } finally {
        fixture.restore();
    }
});

test("resizing keeps the image center, opacity changes independently, and movement stays in the workspace", async () => {
    const fixture = createOverlay();
    try {
        const loading = fixture.overlay.load(pngFile);
        fixture.candidates[0].naturalWidth = 100;
        fixture.candidates[0].naturalHeight = 100;
        fixture.candidates[0].onload?.();
        await loading;
        fixture.overlay.setSize(200);
        assert.equal(fixture.image.style.left, "450px");
        assert.equal(fixture.image.style.top, "400px");
        fixture.overlay.setOpacity(0);
        fixture.overlay.setMoveEnabled(true);
        fixture.image.onpointerdown?.({ button: 0, clientX: 0, clientY: 0, pointerId: 1 } as PointerEvent);
        fixture.image.onpointermove?.({ clientX: -1000, clientY: -1000 } as PointerEvent);

        assert.equal(fixture.image.style.left, "-199px");
        assert.equal(fixture.image.style.top, "-199px");
        assert.equal(fixture.image.style.opacity, "0");
        assert.equal(fixture.overlay.sizePercent, 200);
    } finally {
        fixture.restore();
    }
});

test("unsupported file types are rejected before an object URL is created", async () => {
    const fixture = createOverlay();
    try {
        assert.deepEqual(await fixture.overlay.load({ type: "image/gif" } as File), {
            kind: "error",
            message: "Select a PNG, JPEG, or WebP image.",
        });
        assert.deepEqual(fixture.revoked, []);
    } finally {
        fixture.restore();
    }
});

test("an unsupported selection invalidates an older pending load", async () => {
    const fixture = createOverlay();
    try {
        const pending = fixture.overlay.load(pngFile);
        await fixture.overlay.load({ type: "image/gif" } as File);
        fixture.candidates[0].naturalWidth = 100;
        fixture.candidates[0].naturalHeight = 100;
        fixture.candidates[0].onload?.();
        assert.deepEqual(await pending, { kind: "ignored" });
        assert.equal(fixture.overlay.present, false);
        assert.deepEqual(fixture.revoked, ["blob:1"]);
    } finally {
        fixture.restore();
    }
});
