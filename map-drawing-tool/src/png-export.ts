import { CanvasContext, renderCell } from "./canvas-renderer";
import { HEX_RADIUS, getCanvasSize, getCellsPixelBounds } from "./hex-geometry";
import { HexMapState } from "./map-state";
import { EXPORT_BACKGROUND_COLOR } from "./visual-policy";

interface ExportContext extends CanvasContext {
    fillRect: (x: number, y: number, width: number, height: number) => void;
    translate: (x: number, y: number) => void;
}

export interface ExportCanvas {
    width: number;
    height: number;
    getContext: (contextId: "2d") => ExportContext | null;
    toBlob: (
        callback: (blob: Blob | null) => void,
        type?: string,
    ) => void;
}

export interface ExportDependencies {
    createCanvas: (width: number, height: number) => ExportCanvas;
    download: (blob: Blob, filename: string) => void;
}

export interface ExportRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function getExportRegion(state: HexMapState): ExportRegion | null {
    const bounds = getCellsPixelBounds(state.getPaintedCells());
    if (!bounds) {
        return null;
    }

    const canvasSize = getCanvasSize();
    const x = Math.max(0, Math.floor(bounds.minX - HEX_RADIUS));
    const y = Math.max(0, Math.floor(bounds.minY - HEX_RADIUS));
    const maxX = Math.min(canvasSize.width, Math.ceil(bounds.maxX + HEX_RADIUS));
    const maxY = Math.min(canvasSize.height, Math.ceil(bounds.maxY + HEX_RADIUS));

    return {
        x,
        y,
        width: maxX - x,
        height: maxY - y,
    };
}

function createPngBlob(canvas: ExportCanvas): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Could not create the PNG image."));
                return;
            }
            resolve(blob);
        }, "image/png");
    });
}

export async function exportMapPng(
    state: HexMapState,
    dependencies: ExportDependencies,
): Promise<boolean> {
    const region = getExportRegion(state);
    if (!region) {
        return false;
    }

    const canvas = dependencies.createCanvas(region.width, region.height);
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Could not create the PNG image.");
    }

    context.fillStyle = EXPORT_BACKGROUND_COLOR;
    context.fillRect(0, 0, region.width, region.height);
    context.translate(-region.x, -region.y);
    state
        .getPaintedEntries()
        .forEach(({ cell, color }) => renderCell(context, cell, color, false));

    const blob = await createPngBlob(canvas);
    dependencies.download(blob, "map.png");
    return true;
}
