import { CanvasContext, centerViewport, renderCell, renderGrid } from "./canvas-renderer";
import { EditorController, EditorTool } from "./editor-controller";
import { getCanvasSize, pixelToCell } from "./hex-geometry";
import { HexMapState } from "./map-state";
import { ImageOverlay } from "./image-overlay";

export interface AppElements {
    canvas: HTMLCanvasElement;
    colorInput: HTMLInputElement;
    paintButton: HTMLButtonElement;
    eraserButton: HTMLButtonElement;
    moveImageButton: HTMLButtonElement;
    imageInput: HTMLInputElement;
    removeImageButton: HTMLButtonElement;
    imageSizeInput: HTMLInputElement;
    imageSizeValue: HTMLElement;
    imageOpacityInput: HTMLInputElement;
    imageOpacityValue: HTMLElement;
    workspace: HTMLElement;
    exportButton: HTMLButtonElement;
    exportDialog: HTMLDialogElement;
    exportBackgroundInput: HTMLInputElement;
    transparentBackgroundInput: HTMLInputElement;
    exportCancelButton: HTMLButtonElement;
    exportConfirmButton: HTMLButtonElement;
    exportError: HTMLElement;
    viewport: HTMLElement;
    status: HTMLElement;
}

export type ExportAction = (state: HexMapState, background: string | null) => Promise<boolean>;

function pointerCell(canvas: HTMLCanvasElement, event: PointerEvent) {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
    const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);
    return pixelToCell(x, y);
}

type AppTool = EditorTool | "move";

function setActiveTool(elements: AppElements, tool: AppTool): void {
    elements.paintButton.setAttribute("aria-pressed", String(tool === "paint"));
    elements.eraserButton.setAttribute("aria-pressed", String(tool === "erase"));
    elements.moveImageButton.setAttribute("aria-pressed", String(tool === "move"));
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
    elements.moveImageButton.disabled = true;
    elements.removeImageButton.disabled = true;
    elements.imageSizeInput.disabled = true;
    elements.imageOpacityInput.disabled = true;

    const state = new HexMapState();
    let activeTool: AppTool = "paint";
    const overlay = new ImageOverlay({
        image: elements.workspace.querySelector("img") as HTMLImageElement,
        workspace: elements.workspace,
        viewport: elements.viewport,
        canvas: elements.canvas,
    }, {
        onChange: (present) => {
            elements.moveImageButton.disabled = !present;
            elements.removeImageButton.disabled = !present;
            elements.imageSizeInput.disabled = !present;
            elements.imageOpacityInput.disabled = !present;
            if (!present && activeTool === "move") {
                selectTool("paint");
            }
        },
    });
    const selectTool = (tool: AppTool) => {
        controller.pointerUp();
        activeTool = tool;
        overlay.setMoveEnabled(tool === "move");
        if (tool === "move") {
            setActiveTool(elements, tool);
        } else {
            controller.setTool(tool);
        }
    };
    const controller = new EditorController(state, {
        renderCell: (cell, color) => renderCell(context as CanvasContext, cell, color, true),
        setExportEnabled: (enabled) => {
            elements.exportButton.disabled = !enabled;
        },
        setActiveTool: (tool) => setActiveTool(elements, tool),
    });

    elements.colorInput.oninput = () => controller.setColor(elements.colorInput.value);
    elements.paintButton.onclick = () => selectTool("paint");
    elements.eraserButton.onclick = () => selectTool("erase");
    elements.moveImageButton.onclick = () => selectTool("move");
    elements.imageInput.onchange = async () => {
        const file = elements.imageInput.files?.[0];
        elements.imageInput.value = "";
        if (!file) {
            return;
        }
        const result = await overlay.load(file);
        if (result.kind === "error") {
            elements.status.textContent = result.message;
        } else if (result.kind === "loaded") {
            elements.imageSizeInput.value = "100";
            elements.imageSizeValue.textContent = "100%";
            elements.imageOpacityInput.value = "50";
            elements.imageOpacityValue.textContent = "50%";
            elements.status.textContent = "";
            if (activeTool === "move") {
                selectTool("paint");
            }
        }
    };
    elements.removeImageButton.onclick = () => overlay.remove();
    elements.imageSizeInput.oninput = () => {
        overlay.setSize(Number(elements.imageSizeInput.value));
        elements.imageSizeValue.textContent = `${overlay.sizePercent}%`;
    };
    elements.imageOpacityInput.oninput = () => {
        overlay.setOpacity(Number(elements.imageOpacityInput.value));
        elements.imageOpacityValue.textContent = `${overlay.opacityPercent}%`;
    };
    elements.canvas.onpointerdown = (event) => {
        if (activeTool !== "move") {
            controller.pointerDown(pointerCell(elements.canvas, event), event.button);
        }
    };
    elements.canvas.onpointermove = (event) => {
        if (activeTool !== "move") {
            controller.pointerMove(pointerCell(elements.canvas, event), event.buttons);
        }
    };
    elements.canvas.onpointerup = () => controller.pointerUp();
    elements.canvas.onpointerleave = () => controller.pointerUp();
    let savingExport = false;
    elements.exportDialog.oncancel = (event) => {
        if (savingExport) {
            event.preventDefault();
        }
    };
    const updateExportBackground = () => {
        elements.exportBackgroundInput.disabled = elements.transparentBackgroundInput.checked;
    };
    elements.transparentBackgroundInput.onchange = updateExportBackground;
    elements.exportCancelButton.onclick = () => elements.exportDialog.close();
    elements.exportButton.onclick = () => {
        elements.status.textContent = "";
        elements.exportError.textContent = "";
        elements.exportDialog.showModal();
    };
    elements.exportConfirmButton.onclick = async () => {
        if (savingExport) {
            return;
        }
        savingExport = true;
        elements.exportConfirmButton.disabled = true;
        elements.exportCancelButton.disabled = true;
        elements.exportError.textContent = "";
        try {
            const exported = await exportAction(
                state,
                elements.transparentBackgroundInput.checked ? null : elements.exportBackgroundInput.value,
            );
            if (exported) {
                elements.exportDialog.close();
            }
        } catch (error) {
            elements.exportError.textContent =
                error instanceof Error ? error.message : "Could not create the PNG image.";
        } finally {
            savingExport = false;
            elements.exportConfirmButton.disabled = false;
            elements.exportCancelButton.disabled = false;
        }
    };

    centerViewport(elements.viewport);
}
