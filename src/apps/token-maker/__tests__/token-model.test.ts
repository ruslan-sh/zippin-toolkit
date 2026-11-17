import assert from "node:assert/strict";
import test from "node:test";
import { containFit, DEFAULT_SETTINGS, shapePoints, imageRect, TOKEN_SIZE } from "../token-model";
import type { TokenSettings } from "../token-model";
import { renderLayers, renderToken } from "../token-renderer";
import type { TokenRenderContext } from "../token-renderer";

test("contain fit keeps portrait images inside the square and centers them", () => {
    const fit = containFit({ width: 400, height: 800 });
    assert.deepEqual(fit, { x: 128, y: 0, width: 256, height: 512 });

    const landscape = containFit({ width: 800, height: 400 });
    assert.deepEqual(landscape, { x: 0, y: 128, width: 512, height: 256 });
});

test("manual image scale and position are relative to the centered fit", () => {
    const rect = imageRect({ width: 400, height: 800 }, {
        imageScale: 200,
        imageOffsetX: 10,
        imageOffsetY: -20,
    });
    assert.deepEqual(rect, { x: 10, y: -276, width: 512, height: 1024 });
});

test("hex orientations point on the requested axis and fit inside the output square", () => {
    const vertical = shapePoints("vertical-hex");
    const horizontal = shapePoints("horizontal-hex");
    assert.ok(Math.abs((vertical[0]?.[0] ?? 0) - TOKEN_SIZE / 2) < 0.0001);
    assert.equal(vertical[0]?.[1], 0);
    assert.equal(horizontal[0]?.[0], TOKEN_SIZE);
    assert.equal(horizontal[0]?.[1], TOKEN_SIZE / 2);
    for (const point of [...vertical, ...horizontal]) {
        assert.ok(point[0] >= 0 && point[0] <= TOKEN_SIZE);
        assert.ok(point[1] >= 0 && point[1] <= TOKEN_SIZE);
    }
    for (const points of [vertical, horizontal]) {
        const sideLengths = points.map((point, index) => {
            const next = points[(index + 1) % points.length];
            return Math.hypot((next?.[0] ?? 0) - point[0], (next?.[1] ?? 0) - point[1]);
        });
        for (const length of sideLengths) assert.ok(Math.abs(length - TOKEN_SIZE / 2) < 0.0001);
    }
});

test("Lancer footprints have the requested cell areas and no internal edges", () => {
    const variants = [
        ["1", 1, 6], ["2", 3, 12], ["2A", 3, 12],
        ["3", 7, 18], ["4", 12, 24], ["4A", 12, 24],
    ] as const;
    const cellCounts = variants.map(([size]) => {
        const points = shapePoints("vertical-hex", TOKEN_SIZE, size);
        const area = Math.abs(points.reduce((sum, [x, y], index) => {
            const next = points[(index + 1) % points.length];
            return sum + x * (next?.[1] ?? 0) - (next?.[0] ?? 0) * y;
        }, 0)) / 2;
        const first = points[0];
        const next = points[1];
        const sideLength = Math.hypot((next?.[0] ?? 0) - (first?.[0] ?? 0), (next?.[1] ?? 0) - (first?.[1] ?? 0));
        return area / ((3 * Math.sqrt(3) / 2) * sideLength ** 2);
    });
    variants.forEach(([size, cells, edges], index) => {
        assert.ok(Math.abs((cellCounts[index] ?? 0) - cells) < 0.0001);
        assert.equal(shapePoints("vertical-hex", TOKEN_SIZE, size).length, edges);
    });
});

test("Lancer A variants reflect their base footprints vertically", () => {
    for (const [base, mirrored] of [["2", "2A"], ["4", "4A"]] as const) {
        const original = shapePoints("vertical-hex", TOKEN_SIZE, base).map(([x, y]) => [x, TOKEN_SIZE - y]);
        const reflected = new Set(shapePoints("vertical-hex", TOKEN_SIZE, mirrored)
            .map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`));
        assert.ok(original.every(([x, y]) => reflected.has(`${(x ?? 0).toFixed(4)},${(y ?? 0).toFixed(4)}`)));
    }
});

test("render plan clips behind images before the frame and draws front images after it", () => {
    assert.deepEqual(renderLayers("behind-frame", true), ["background", "behind-image", "frame"]);
    assert.deepEqual(renderLayers("in-front", true), ["background", "frame", "front-image"]);
    assert.deepEqual(renderLayers("behind-frame", false), ["background", "frame"]);
});

test("renderer clips transparent fill, insets a dotted frame, and uses round separated dots", () => {
    const events: string[] = [];
    const vertices: [number, number][] = [];
    const lineCapStack: TokenRenderContext["lineCap"][] = [];
    let dash: number[] = [];
    let lineCapAtStroke: TokenRenderContext["lineCap"] = "butt";
    let context: TokenRenderContext;
    context = {
        clearRect: () => events.push("clear"),
        save: () => { lineCapStack.push(context.lineCap); events.push("save"); },
        restore: () => { context.lineCap = lineCapStack.pop() ?? "butt"; events.push("restore"); },
        beginPath: () => events.push("begin"),
        moveTo: (x, y) => { vertices.push([x, y]); events.push("move"); },
        lineTo: (x, y) => { vertices.push([x, y]); events.push("line"); },
        closePath: () => events.push("close"),
        clip: () => events.push("clip"),
        fillRect: () => events.push("fill"),
        drawImage: () => events.push("image"),
        setLineDash: (segments) => { dash = segments; events.push("dash"); },
        stroke: () => { lineCapAtStroke = context.lineCap; events.push("stroke"); },
        lineCap: "butt",
        arc: () => events.push("arc"),
        fillStyle: "#ffffff",
        strokeStyle: "#000000",
        lineWidth: 0,
    };
    const settings = {
        ...DEFAULT_SETTINGS,
        shape: "vertical-hex",
        frameStyle: "dotted",
        frameThickness: 40,
        backgroundColor: "#336699",
        backgroundOpacity: 25,
    } satisfies TokenSettings;

    renderToken(context, settings);

    assert.ok(events.indexOf("clip") < events.indexOf("fill"));
    assert.equal(events[events.length - 2], "stroke");
    assert.equal(context.fillStyle, "rgba(51, 102, 153, 0.25)");
    assert.equal(lineCapAtStroke, "round");
    assert.deepEqual(dash, [0, 60]);
    const frameVertices = vertices.slice(-6);
    const miterInset = 40 / Math.sqrt(3);
    assert.ok(frameVertices.every(([x, y]) => x >= miterInset - 0.00000001 && x <= TOKEN_SIZE - miterInset + 0.00000001 && y >= miterInset - 0.00000001 && y <= TOKEN_SIZE - miterInset + 0.00000001));
    assert.ok(Math.abs((frameVertices[0]?.[1] ?? 0) - miterInset) < 0.0001);
    assert.ok(miterInset - (40 / Math.sqrt(3)) >= 0);
});
