import "./index.scss";

import { AppElements, initializeEditor } from "./editor-app";
import { ExportCanvas, exportMapPng } from "./png-export";

function requiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing required element: ${id}`);
    }
    return element as T;
}

const elements: AppElements = {
    canvas: requiredElement<HTMLCanvasElement>("map-canvas"),
    colorInput: requiredElement<HTMLInputElement>("paint-color"),
    paintButton: requiredElement<HTMLButtonElement>("paint-tool"),
    eraserButton: requiredElement<HTMLButtonElement>("eraser-tool"),
    exportButton: requiredElement<HTMLButtonElement>("export-png"),
    viewport: requiredElement<HTMLElement>("map-viewport"),
    status: requiredElement<HTMLElement>("map-status"),
};

initializeEditor(elements, (state) =>
    exportMapPng(state, {
        createCanvas: (width, height) => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            return canvas as ExportCanvas;
        },
        download: (blob, filename) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        },
    }),
);
