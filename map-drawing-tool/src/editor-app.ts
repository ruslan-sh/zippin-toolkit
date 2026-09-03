import { CanvasContext, centerViewport, renderCell, renderGrid } from "./canvas-renderer";
import { EditorController, EditorTool } from "./editor-controller";
import { getCanvasSize, pixelToCell } from "./hex-geometry";
import { HexMapState } from "./map-state";

export interface AppElements {
    canvas: HTMLCanvasElement;
    colorInput: HTMLInputElement;
    paintButton: HTMLButtonElement;
    eraserButton: HTMLButtonElement;
    exportButton: HTMLButtonElement;
    viewport: HTMLElement;
    status: HTMLElement;
}

export type ExportAction = (state: HexMapState) => Promise<boolean>;

function pointerCell(canvas: HTMLCanvasElement, event: PointerEvent) {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
    const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);
    return pixelToCell(x, y);
}

function setActiveTool(elements: AppElements, tool: EditorTool): void {
    elements.paintButton.setAttribute("aria-pressed", String(tool === "paint"));
    elements.eraserButton.setAttribute("aria-pressed", String(tool === "erase"));
}

export function initializeEditor(
    elements: AppElements,
    exportAction: ExportAction,
): void {
    const context = elements.canvas.getContext("2d");
    if (!context) {
        elements.status.textContent = "Canvas is not available in this browser.";
        return;
    }

    const canvasSize = getCanvasSize();
    elements.canvas.width = canvasSize.width;
    elements.canvas.height = canvasSize.height;
    renderGrid(context as CanvasContext);

    const state = new HexMapState();
    const controller = new EditorController(state, {
        renderCell: (cell, color) => renderCell(context as CanvasContext, cell, color, true),
        setExportEnabled: (enabled) => {
            elements.exportButton.disabled = !enabled;
        },
        setActiveTool: (tool) => setActiveTool(elements, tool),
    });

    elements.colorInput.oninput = () => controller.setColor(elements.colorInput.value);
    elements.paintButton.onclick = () => controller.setTool("paint");
    elements.eraserButton.onclick = () => controller.setTool("erase");
    elements.canvas.onpointerdown = (event) => {
        controller.pointerDown(pointerCell(elements.canvas, event), event.button);
    };
    elements.canvas.onpointermove = (event) => {
        controller.pointerMove(pointerCell(elements.canvas, event), event.buttons);
    };
    elements.canvas.onpointerup = () => controller.pointerUp();
    elements.canvas.onpointerleave = () => controller.pointerUp();
    elements.exportButton.onclick = async () => {
        elements.status.textContent = "";
        try {
            await exportAction(state);
        } catch (error) {
            elements.status.textContent =
                error instanceof Error ? error.message : "Could not create the PNG image.";
        }
    };

    centerViewport(elements.viewport);
}
