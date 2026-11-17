export const TOKEN_SIZE = 512;

export type TokenShape = "circle" | "square" | "vertical-hex" | "horizontal-hex";
export type LancerSize = "1" | "2" | "2A" | "3" | "4" | "4A";
export type FrameStyle = "solid" | "dashed" | "dotted";
export type ImageLayer = "behind-frame" | "in-front";

export interface TokenSettings {
    shape: TokenShape;
    lancerSize: LancerSize;
    frameStyle: FrameStyle;
    frameColor: string;
    frameThickness: number;
    backgroundColor: string;
    backgroundOpacity: number;
    imageLayer: ImageLayer;
    imageScale: number;
    imageOffsetX: number;
    imageOffsetY: number;
}

export interface ImageDimensions {
    width: number;
    height: number;
}

export interface ImageRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const DEFAULT_SETTINGS: TokenSettings = {
    shape: "circle",
    lancerSize: "1",
    frameStyle: "solid",
    frameColor: "#212121",
    frameThickness: 12,
    backgroundColor: "#ffffff",
    backgroundOpacity: 100,
    imageLayer: "behind-frame",
    imageScale: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
};

export function containFit(dimensions: ImageDimensions, size = TOKEN_SIZE): ImageRect {
    const scale = Math.min(size / dimensions.width, size / dimensions.height);
    const width = dimensions.width * scale;
    const height = dimensions.height * scale;
    return { x: (size - width) / 2, y: (size - height) / 2, width, height };
}

export function imageRect(
    dimensions: ImageDimensions,
    settings: Pick<TokenSettings, "imageScale" | "imageOffsetX" | "imageOffsetY">,
    size = TOKEN_SIZE,
): ImageRect {
    const fit = containFit(dimensions, size);
    const scale = settings.imageScale / 100;
    const width = fit.width * scale;
    const height = fit.height * scale;
    return {
        x: (size - width) / 2 + settings.imageOffsetX,
        y: (size - height) / 2 + settings.imageOffsetY,
        width,
        height,
    };
}

type AxialCell = readonly [q: number, r: number];
type Point = readonly [x: number, y: number];

const LANCER_CELLS: Record<"1" | "2" | "3" | "4", readonly AxialCell[]> = {
    "1": [[0, 0]],
    "2": [[0, 0], [-1, 1], [0, 1]],
    "3": [[0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [-1, 2], [0, 2]],
    "4": [[0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [-1, 2], [0, 2], [1, 2], [-1, 3], [0, 3]],
};

function pointKey(point: Point): string {
    const x = Math.abs(point[0]) < 0.000001 ? 0 : point[0];
    const y = Math.abs(point[1]) < 0.000001 ? 0 : point[1];
    return `${x.toFixed(6)},${y.toFixed(6)}`;
}

function cellVertices([q, r]: AxialCell): Point[] {
    const centerX = Math.sqrt(3) * (q + r / 2);
    const centerY = 1.5 * r;
    return Array.from({ length: 6 }, (_, index): Point => {
        const angle = -Math.PI / 2 + index * Math.PI / 3;
        return [centerX + Math.cos(angle), centerY + Math.sin(angle)];
    });
}

function lancerBoundary(size: "1" | "2" | "3" | "4"): Point[] {
    const edges = new Map<string, readonly [Point, Point]>();
    for (const cell of LANCER_CELLS[size]) {
        const vertices = cellVertices(cell);
        for (let index = 0; index < vertices.length; index += 1) {
            const start = vertices[index];
            const end = vertices[(index + 1) % vertices.length];
            if (!start || !end) continue;
            const startKey = pointKey(start);
            const endKey = pointKey(end);
            const key = [startKey, endKey].sort().join("|");
            if (edges.has(key)) edges.delete(key);
            else edges.set(key, [start, end]);
        }
    }

    const boundaryEdges = [...edges.values()];
    const firstEdge = boundaryEdges[0];
    if (!firstEdge) return [];
    const points = [firstEdge[0], firstEdge[1]];
    const remaining = boundaryEdges.slice(1);
    while (remaining.length > 0) {
        const last = points[points.length - 1];
        if (!last) break;
        const edgeIndex = remaining.findIndex(([start]) => pointKey(start) === pointKey(last));
        const edge = remaining.splice(edgeIndex, 1)[0];
        if (!edge) break;
        points.push(edge[1]);
    }
    points.pop();
    return points;
}

function normalizePoints(points: readonly Point[], size: number): [number, number][] {
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const scale = size / Math.max(maxX - minX, maxY - minY);
    const offsetX = (size - (maxX - minX) * scale) / 2;
    const offsetY = (size - (maxY - minY) * scale) / 2;
    return points.map(([x, y]): [number, number] => [offsetX + (x - minX) * scale, offsetY + (y - minY) * scale]);
}

export function shapePoints(shape: TokenShape, size = TOKEN_SIZE, lancerSize: LancerSize = "1"): readonly [number, number][] {
    const center = size / 2;
    if (shape === "square") {
        return [[0, 0], [size, 0], [size, size], [0, size]];
    }
    if (shape === "vertical-hex") {
        const baseSize = lancerSize === "2A" ? "2" : lancerSize === "4A" ? "4" : lancerSize;
        const points = lancerBoundary(baseSize);
        if (lancerSize.endsWith("A")) {
            const minY = Math.min(...points.map(([, y]) => y));
            const maxY = Math.max(...points.map(([, y]) => y));
            return normalizePoints(points.map(([x, y]): Point => [x, minY + maxY - y]).reverse(), size);
        }
        return normalizePoints(points, size);
    }
    if (shape === "horizontal-hex") {
        const startAngle = 0;
        return Array.from({ length: 6 }, (_, index): [number, number] => {
            const angle = startAngle + index * Math.PI / 3;
            return [center + Math.cos(angle) * center, center + Math.sin(angle) * center];
        });
    }
    return Array.from({ length: 96 }, (_, index) => {
        const angle = index * Math.PI * 2 / 96 - Math.PI / 2;
        return [center + Math.cos(angle) * center, center + Math.sin(angle) * center];
    });
}

export function hexColorWithOpacity(hex: string, opacity: number): string {
    const normalized = hex.trim().replace(/^#/, "");
    const fullHex = normalized.length === 3
        ? normalized.split("").map((character) => `${character}${character}`).join("")
        : normalized;
    if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) {
        return `rgba(255, 255, 255, ${opacity / 100})`;
    }
    const red = Number.parseInt(fullHex.slice(0, 2), 16);
    const green = Number.parseInt(fullHex.slice(2, 4), 16);
    const blue = Number.parseInt(fullHex.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity / 100})`;
}
