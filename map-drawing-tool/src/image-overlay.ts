export interface ImageOverlayElements {
    image: HTMLImageElement;
    workspace: HTMLElement;
    viewport: HTMLElement;
    canvas: HTMLCanvasElement;
}

export interface ImageOverlayOptions {
    createImage?: () => HTMLImageElement;
    onChange?: (present: boolean) => void;
}

export type ImageLoadResult =
    | { kind: "loaded" }
    | { kind: "ignored" }
    | { kind: "error"; message: string };

export class ImageOverlay {
    private request = 0;
    private url: string | null = null;
    private fittedWidth = 0;
    private fittedHeight = 0;
    private width = 0;
    private height = 0;
    private left = 0;
    private top = 0;
    private opacity = 50;
    private moving = false;
    private pointerId: number | null = null;
    private pointerX = 0;
    private pointerY = 0;

    constructor(
        private readonly elements: ImageOverlayElements,
        private readonly options: ImageOverlayOptions = {},
    ) {
        elements.image.onpointerdown = (event) => this.pointerDown(event);
        elements.image.onpointermove = (event) => this.pointerMove(event);
        elements.image.onpointerup = () => this.pointerUp();
        elements.image.onpointercancel = () => this.pointerUp();
        elements.image.draggable = false;
        elements.image.ondragstart = (event) => event.preventDefault();
        this.setMoveEnabled(false);
        this.render();
    }

    get present(): boolean {
        return this.url !== null;
    }

    get sizePercent(): number {
        return this.fittedWidth === 0 ? 100 : Math.round((this.width / this.fittedWidth) * 100);
    }

    get opacityPercent(): number {
        return this.opacity;
    }

    async load(file: File): Promise<ImageLoadResult> {
        const request = ++this.request;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            return { kind: "error", message: "Select a PNG, JPEG, or WebP image." };
        }
        const candidateUrl = URL.createObjectURL(file);
        const candidate = this.options.createImage?.() ?? new Image();

        try {
            await new Promise<void>((resolve, reject) => {
                candidate.onload = () => resolve();
                candidate.onerror = () => reject(new Error("Could not load this image."));
                candidate.src = candidateUrl;
            });
        } catch (error) {
            URL.revokeObjectURL(candidateUrl);
            return request === this.request
                ? { kind: "error", message: error instanceof Error ? error.message : "Could not load this image." }
                : { kind: "ignored" };
        }

        if (request !== this.request) {
            URL.revokeObjectURL(candidateUrl);
            return { kind: "ignored" };
        }

        const naturalWidth = candidate.naturalWidth;
        const naturalHeight = candidate.naturalHeight;
        if (naturalWidth === 0 || naturalHeight === 0) {
            URL.revokeObjectURL(candidateUrl);
            return { kind: "error", message: "Could not load this image." };
        }

        this.releaseUrl();
        this.url = candidateUrl;
        this.elements.image.src = candidateUrl;
        const scale = Math.min(
            1,
            this.elements.viewport.clientWidth / naturalWidth,
            this.elements.viewport.clientHeight / naturalHeight,
        );
        this.fittedWidth = naturalWidth * scale;
        this.fittedHeight = naturalHeight * scale;
        this.width = this.fittedWidth;
        this.height = this.fittedHeight;
        this.left = this.elements.viewport.scrollLeft + (this.elements.viewport.clientWidth - this.width) / 2;
        this.top = this.elements.viewport.scrollTop + (this.elements.viewport.clientHeight - this.height) / 2;
        this.opacity = 50;
        this.clampPosition();
        this.render();
        this.options.onChange?.(true);
        return { kind: "loaded" };
    }

    remove(): void {
        this.request += 1;
        this.setMoveEnabled(false);
        this.releaseUrl();
        this.elements.image.removeAttribute("src");
        this.render();
        this.options.onChange?.(false);
    }

    setMoveEnabled(enabled: boolean): void {
        this.stopMoving();
        this.elements.image.style.pointerEvents = enabled && this.present ? "auto" : "none";
    }

    setSize(percent: number): void {
        if (!this.present) {
            return;
        }
        const centerX = this.left + this.width / 2;
        const centerY = this.top + this.height / 2;
        const ratio = Math.max(10, Math.min(400, percent)) / 100;
        this.width = this.fittedWidth * ratio;
        this.height = this.fittedHeight * ratio;
        this.left = centerX - this.width / 2;
        this.top = centerY - this.height / 2;
        this.render();
    }

    setOpacity(percent: number): void {
        this.opacity = Math.max(0, Math.min(100, percent));
        this.render();
    }

    private pointerDown(event: PointerEvent): void {
        if (event.button !== 0 || !this.present) {
            return;
        }
        this.moving = true;
        this.pointerId = event.pointerId;
        this.pointerX = event.clientX;
        this.pointerY = event.clientY;
        this.elements.image.setPointerCapture(event.pointerId);
    }

    private pointerMove(event: PointerEvent): void {
        if (!this.moving) {
            return;
        }
        this.left += event.clientX - this.pointerX;
        this.top += event.clientY - this.pointerY;
        this.pointerX = event.clientX;
        this.pointerY = event.clientY;
        this.clampPosition();
        this.render();
    }

    private pointerUp(): void {
        this.stopMoving();
    }

    private stopMoving(): void {
        if (this.pointerId !== null && this.elements.image.hasPointerCapture(this.pointerId)) {
            this.elements.image.releasePointerCapture(this.pointerId);
        }
        this.moving = false;
        this.pointerId = null;
    }

    private clampPosition(): void {
        this.left = Math.max(-this.width + 1, Math.min(this.elements.canvas.width - 1, this.left));
        this.top = Math.max(-this.height + 1, Math.min(this.elements.canvas.height - 1, this.top));
    }

    private render(): void {
        const image = this.elements.image;
        image.hidden = !this.present;
        image.style.left = `${this.left}px`;
        image.style.top = `${this.top}px`;
        image.style.width = `${this.width}px`;
        image.style.height = `${this.height}px`;
        image.style.opacity = String(this.opacity / 100);
    }

    private releaseUrl(): void {
        if (this.url) {
            URL.revokeObjectURL(this.url);
            this.url = null;
        }
    }
}
