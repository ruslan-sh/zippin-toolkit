import { hexColorWithOpacity, imageRect, shapePoints, TOKEN_SIZE } from "./token-model";
import type { ImageDimensions, TokenSettings } from "./token-model";

export type TokenImage = CanvasImageSource & ImageDimensions;

export interface TokenRenderContext {
    clearRect(x: number, y: number, width: number, height: number): void;
    save(): void;
    restore(): void;
    beginPath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    closePath(): void;
    clip(): void;
    fillRect(x: number, y: number, width: number, height: number): void;
    drawImage(image: CanvasImageSource, x: number, y: number, width: number, height: number): void;
    setLineDash(segments: number[]): void;
    stroke(): void;
    lineCap: CanvasRenderingContext2D["lineCap"];
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
    fillStyle: CanvasRenderingContext2D["fillStyle"];
    strokeStyle: CanvasRenderingContext2D["strokeStyle"];
    lineWidth: number;
}

export type RenderLayer = "background" | "behind-image" | "frame" | "front-image";

export function renderLayers(imageLayer: TokenSettings["imageLayer"], hasImage: boolean): RenderLayer[] {
    const layers: RenderLayer[] = ["background"];
    if (hasImage && imageLayer === "behind-frame") layers.push("behind-image");
    layers.push("frame");
    if (hasImage && imageLayer === "in-front") layers.push("front-image");
    return layers;
}

function tracePoints(context: TokenRenderContext, points: readonly [number, number][]): void {
    const first = points[0];
    if (!first) return;
    context.beginPath();
    context.moveTo(first[0], first[1]);
    for (const [x, y] of points.slice(1)) context.lineTo(x, y);
    context.closePath();
}

function shapePolygon(settings: TokenSettings): readonly [number, number][] {
    return shapePoints(settings.shape, TOKEN_SIZE, settings.lancerSize);
}

function clipToShape(context: TokenRenderContext, settings: TokenSettings): void {
    if (settings.shape === "circle") {
        context.beginPath();
        context.arc(TOKEN_SIZE / 2, TOKEN_SIZE / 2, TOKEN_SIZE / 2, 0, Math.PI * 2);
        context.clip();
        return;
    }
    tracePoints(context, shapePolygon(settings));
    context.clip();
}

function insetPolygon(points: readonly [number, number][], inset: number): [number, number][] {
    const area = points.reduce((sum, [x, y], index) => {
        const next = points[(index + 1) % points.length];
        return sum + x * (next?.[1] ?? 0) - (next?.[0] ?? 0) * y;
    }, 0);
    const direction = area >= 0 ? 1 : -1;
    const edges = points.map(([x1, y1], index) => {
        const next = points[(index + 1) % points.length] ?? [x1, y1];
        const dx = next[0] - x1;
        const dy = next[1] - y1;
        const length = Math.hypot(dx, dy);
        const nx = direction * -dy / length;
        const ny = direction * dx / length;
        return { x: x1 + nx * inset, y: y1 + ny * inset, dx, dy };
    });
    return edges.map((edge, index) => {
        const previous = edges[(index + edges.length - 1) % edges.length];
        if (!previous) return [edge.x, edge.y];
        const determinant = previous.dx * edge.dy - previous.dy * edge.dx;
        if (Math.abs(determinant) < 0.000001) return [edge.x, edge.y];
        const t = ((edge.x - previous.x) * edge.dy - (edge.y - previous.y) * edge.dx) / determinant;
        return [previous.x + previous.dx * t, previous.y + previous.dy * t];
    });
}

function drawFrame(context: TokenRenderContext, settings: TokenSettings): void {
    context.save();
    context.lineWidth = settings.frameThickness;
    context.strokeStyle = settings.frameColor;
    context.lineCap = settings.frameStyle === "dotted" ? "round" : "butt";
    context.setLineDash(settings.frameStyle === "dashed"
        ? [settings.frameThickness * 2, settings.frameThickness * 1.5]
        : settings.frameStyle === "dotted"
            ? [0, settings.frameThickness * 1.5]
            : []);
    if (settings.shape === "circle") {
        context.beginPath();
        context.arc(TOKEN_SIZE / 2, TOKEN_SIZE / 2, (TOKEN_SIZE - settings.frameThickness) / 2, 0, Math.PI * 2);
    } else {
        tracePoints(context, insetPolygon(shapePolygon(settings), settings.frameThickness / 2));
    }
    context.stroke();
    context.restore();
}

export function renderToken(
    context: TokenRenderContext,
    settings: TokenSettings,
    image?: TokenImage,
): void {
    context.clearRect(0, 0, TOKEN_SIZE, TOKEN_SIZE);
    for (const layer of renderLayers(settings.imageLayer, image !== undefined)) {
        if (layer === "background") {
            context.save();
            clipToShape(context, settings);
            context.fillStyle = hexColorWithOpacity(settings.backgroundColor, settings.backgroundOpacity);
            context.fillRect(0, 0, TOKEN_SIZE, TOKEN_SIZE);
            context.restore();
        } else if (layer === "behind-image" || layer === "front-image") {
            if (!image) continue;
            const rect = imageRect(image, settings);
            if (layer === "behind-image") {
                context.save();
                clipToShape(context, settings);
                context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
                context.restore();
            } else {
                context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
            }
        } else {
            drawFrame(context, settings);
        }
    }
}
