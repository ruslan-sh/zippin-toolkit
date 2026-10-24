import "./index.scss";

import { AppElements, initializeEditor } from "./editor-app";
import { ExportCanvas, exportMapPng } from "./png-export";
import { SaveFilePicker, startPngSave } from "./png-save";

function requiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing required element: ${id}`);
    }
    return element as T;
}

function downloadPng(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

const elements: AppElements = {
    canvas: requiredElement<HTMLCanvasElement>("map-canvas"),
    colorInput: requiredElement<HTMLInputElement>("paint-color"),
    paintButton: requiredElement<HTMLButtonElement>("paint-tool"),
    eraserButton: requiredElement<HTMLButtonElement>("eraser-tool"),
    moveImageButton: requiredElement<HTMLButtonElement>("move-image-tool"),
    imageInput: requiredElement<HTMLInputElement>("tracing-image"),
    removeImageButton: requiredElement<HTMLButtonElement>("remove-image"),
    imageSizeInput: requiredElement<HTMLInputElement>("image-size"),
    imageSizeValue: requiredElement<HTMLElement>("image-size-value"),
    imageOpacityInput: requiredElement<HTMLInputElement>("image-opacity"),
    imageOpacityValue: requiredElement<HTMLElement>("image-opacity-value"),
    workspace: requiredElement<HTMLElement>("map-workspace"),
    exportButton: requiredElement<HTMLButtonElement>("export-png"),
    exportDialog: requiredElement<HTMLDialogElement>("export-dialog"),
    exportBackgroundInput: requiredElement<HTMLInputElement>("export-background"),
    transparentBackgroundInput: requiredElement<HTMLInputElement>("transparent-background"),
    exportCancelButton: requiredElement<HTMLButtonElement>("cancel-export"),
    exportConfirmButton: requiredElement<HTMLButtonElement>("confirm-export"),
    exportError: requiredElement<HTMLElement>("export-error"),
    viewport: requiredElement<HTMLElement>("map-viewport"),
    status: requiredElement<HTMLElement>("map-status"),
};

initializeEditor(elements, (state, background) => {
    const pickerWindow = window as Window & { showSaveFilePicker?: SaveFilePicker };
    const picker = pickerWindow.showSaveFilePicker?.bind(pickerWindow);
    return exportMapPng(state, {
        createCanvas: (width, height) => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            return canvas as ExportCanvas;
        },
        download: downloadPng,
        save: startPngSave(picker, downloadPng),
    }, background);
});
