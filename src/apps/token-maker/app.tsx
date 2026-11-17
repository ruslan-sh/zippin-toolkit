import "./index.scss";

import { render } from "preact";
import type { TargetedPointerEvent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { TOKEN_SIZE } from "./token-model";
import type { FrameStyle, ImageLayer, LancerSize, TokenShape, TokenSettings } from "./token-model";
import { MATERIAL_PALETTE, PALETTE_FAMILIES, paletteColor, shadesForFamily } from "./material-palette";
import type { PaletteFamily } from "./material-palette";
import { loadTokenMakerState, saveTokenMakerState } from "./token-settings-storage";
import type { TokenMakerState } from "./token-settings-storage";
import { renderToken } from "./token-renderer";
import type { TokenImage } from "./token-renderer";

const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;
const LANCER_SIZES = ["1", "2", "2A", "3", "4", "4A"] satisfies readonly LancerSize[];

function downloadImage(settings: TokenSettings, image: TokenImage | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        canvas.width = TOKEN_SIZE;
        canvas.height = TOKEN_SIZE;
        const context = canvas.getContext("2d");
        if (!context) {
            reject(new Error("This browser cannot create a PNG image."));
            return;
        }
        renderToken(context, settings, image);
        canvas.toBlob((blob) => {
            try {
                if (!blob) throw new Error("The PNG image could not be created.");
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "token.png";
                document.body.append(link);
                link.click();
                link.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                resolve();
            } catch (error: unknown) {
                reject(error);
            }
        }, "image/png");
    });
}

function isPaletteFamily(value: string): value is PaletteFamily {
    return PALETTE_FAMILIES.some((candidate) => candidate === value);
}

function isFrameStyle(value: string): value is FrameStyle {
    return ["solid", "dashed", "dotted"].some((candidate) => candidate === value);
}

function isImageLayer(value: string): value is ImageLayer {
    return ["behind-frame", "in-front"].some((candidate) => candidate === value);
}

function isLancerSize(value: string): value is LancerSize {
    return LANCER_SIZES.some((candidate) => candidate === value);
}

function numberInputValue(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(-512, Math.min(512, parsed)) : 0;
}

function TokenMaker(): preact.JSX.Element {
    const [initialState] = useState(loadTokenMakerState);
    const [settings, setSettings] = useState<TokenSettings>(initialState.settings);
    const [image, setImage] = useState<TokenImage | undefined>(undefined);
    const [status, setStatus] = useState("");
    const [family, setFamily] = useState<PaletteFamily>(initialState.family);
    const [shade, setShade] = useState(initialState.shade);
    const [color, setColor] = useState(initialState.color);
    const [hexDraft, setHexDraft] = useState(initialState.hexDraft);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const loadSequence = useRef(0);
    const drag = useRef<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | undefined>(undefined);
    const persistedState = useRef<TokenMakerState>(initialState);

    useEffect(() => {
        const context = canvasRef.current?.getContext("2d");
        if (context) renderToken(context, settings, image);
    }, [settings, image]);

    function update(patch: Partial<TokenSettings>, uiPatch: Partial<Omit<TokenMakerState, "settings">> = {}): void {
        const nextState = { ...persistedState.current, ...uiPatch, settings: { ...persistedState.current.settings, ...patch } };
        persistedState.current = nextState;
        setSettings(nextState.settings);
        if (uiPatch.family !== undefined) setFamily(uiPatch.family);
        if (uiPatch.shade !== undefined) setShade(uiPatch.shade);
        if (uiPatch.color !== undefined) setColor(uiPatch.color);
        if (uiPatch.hexDraft !== undefined) setHexDraft(uiPatch.hexDraft);
        saveTokenMakerState(nextState);
    }

    function chooseColor(nextColor: string): void {
        update({ frameColor: nextColor }, { color: nextColor, hexDraft: nextColor });
    }

    function changeFamily(nextFamily: PaletteFamily): void {
        const nextColor = paletteColor(nextFamily, "500");
        update({ frameColor: nextColor }, { family: nextFamily, shade: "500", color: nextColor, hexDraft: nextColor });
    }

    function loadImage(file: File | undefined): void {
        if (!file) return;
        const sequence = loadSequence.current + 1;
        loadSequence.current = sequence;
        if (!file.type.startsWith("image/")) {
            setStatus("Choose an image file, such as PNG, JPEG, or WebP.");
            return;
        }
        setStatus("Loading image…");
        const objectUrl = URL.createObjectURL(file);
        const nextImage = new Image();
        nextImage.onload = () => {
            URL.revokeObjectURL(objectUrl);
            if (loadSequence.current !== sequence) return;
            if (!nextImage.naturalWidth || !nextImage.naturalHeight) {
                setStatus("This image has no usable dimensions.");
                return;
            }
            setImage(nextImage);
            update({ imageScale: 100, imageOffsetX: 0, imageOffsetY: 0 });
            setStatus(`Loaded ${file.name}.`);
        };
        nextImage.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            if (loadSequence.current === sequence) setStatus("The image could not be opened. Try a PNG, JPEG, or WebP file.");
        };
        nextImage.src = objectUrl;
    }

    function resetImage(): void {
        update({ imageScale: 100, imageOffsetX: 0, imageOffsetY: 0 });
        setStatus("Image position and scale reset to fit.");
    }

    function handlePointerDown(event: TargetedPointerEvent<HTMLCanvasElement>): void {
        if (!image) return;
        const target = event.currentTarget;
        target.setPointerCapture(event.pointerId);
        drag.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            offsetX: settings.imageOffsetX,
            offsetY: settings.imageOffsetY,
        };
    }

    function handlePointerMove(event: TargetedPointerEvent<HTMLCanvasElement>): void {
        const start = drag.current;
        if (!start) return;
        const width = event.currentTarget.getBoundingClientRect().width;
        if (width <= 0) return;
        const multiplier = TOKEN_SIZE / width;
        update({
            imageOffsetX: start.offsetX + (event.clientX - start.pointerX) * multiplier,
            imageOffsetY: start.offsetY + (event.clientY - start.pointerY) * multiplier,
        });
    }

    function handleDownload(): void {
        void downloadImage(settings, image).then(
            () => setStatus("PNG download started."),
            (error: unknown) => setStatus(error instanceof Error ? error.message : "The PNG could not be downloaded."),
        );
    }

    return (
        <main class="token-maker">
            <header class="token-maker__header">
                <a href="../../">Zippin's Toolkit</a>
                <h1>Token Maker</h1>
                <p>Build a character token and save it as a transparent PNG.</p>
            </header>
            <div class="token-maker__workspace">
                <section class="token-maker__preview-panel" aria-label="Token preview">
                    <div class="token-maker__checkerboard">
                        <canvas
                            ref={canvasRef}
                            width={TOKEN_SIZE}
                            height={TOKEN_SIZE}
                            aria-label="Token preview. Drag to position the uploaded image."
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={() => { drag.current = undefined; }}
                            onPointerCancel={() => { drag.current = undefined; }}
                        />
                    </div>
                    <p class="token-maker__hint">Preview transparency appears as a checkerboard. The checkerboard is not in the PNG.</p>
                    <button type="button" class="token-maker__download" onClick={handleDownload}>Download PNG</button>
                    <p class="token-maker__status" role="status" aria-live="polite">{status}</p>
                </section>

                <section class="token-maker__controls" aria-label="Token settings">
                    <fieldset>
                        <legend>Shape</legend>
                        <div class="token-maker__shape-options">
                            {([
                                ["circle", "Circle"], ["square", "Square"],
                                ["vertical-hex", "Lancer"], ["horizontal-hex", "Horizontal point hex"],
                            ] satisfies [TokenShape, string][]).map(([value, label]) => (
                                <button type="button" aria-pressed={settings.shape === value} onClick={() => update({ shape: value })} key={value}>{label}</button>
                            ))}
                        </div>
                        {settings.shape === "vertical-hex" && <>
                            <label for="token-lancer-size">Lancer size</label>
                            <select id="token-lancer-size" value={settings.lancerSize} onChange={(event) => {
                                const value = event.currentTarget.value;
                                if (isLancerSize(value)) update({ lancerSize: value });
                            }}>
                                {LANCER_SIZES.map((value) => <option value={value} key={value}>Size {value}</option>)}
                            </select>
                        </>}
                    </fieldset>

                    <fieldset>
                        <legend>Frame</legend>
                        <label for="token-frame-style">Line style</label>
                        <select id="token-frame-style" value={settings.frameStyle} onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (isFrameStyle(value)) update({ frameStyle: value });
                        }}>
                            <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
                        </select>
                        <label for="token-frame-thickness">Thickness <output>{settings.frameThickness}px</output></label>
                        <input id="token-frame-thickness" type="range" min="2" max="48" value={settings.frameThickness} onInput={(event) => update({ frameThickness: Number(event.currentTarget.value) })} />
                        <div class="token-maker__color-grid">
                            <label for="token-palette-family">Material family</label>
                            <select id="token-palette-family" value={family} onChange={(event) => {
                                const value = event.currentTarget.value;
                                if (isPaletteFamily(value)) changeFamily(value);
                            }}>
                                {PALETTE_FAMILIES.map((name) => <option value={name} key={name}>{name}</option>)}
                            </select>
                            <label for="token-palette-shade">Shade</label>
                            <select id="token-palette-shade" value={shade} onChange={(event) => {
                                const nextShade = event.currentTarget.value;
                                const nextColor = paletteColor(family, nextShade);
                                update({ frameColor: nextColor }, { shade: nextShade, color: nextColor, hexDraft: nextColor });
                            }}>
                                {shadesForFamily(family).map((name) => <option value={name} key={name}>{name}</option>)}
                            </select>
                            <label for="token-frame-color">Custom color</label>
                            <input id="token-frame-color" type="color" value={color} onInput={(event) => chooseColor(event.currentTarget.value)} />
                            <label for="token-frame-hex">Hex value</label>
                            <input id="token-frame-hex" type="text" value={hexDraft} maxLength={7} aria-invalid={!HEX_COLOR_PATTERN.test(hexDraft)} onInput={(event) => {
                                const nextHex = event.currentTarget.value;
                                if (HEX_COLOR_PATTERN.test(nextHex)) chooseColor(nextHex.toUpperCase());
                                else update({}, { hexDraft: nextHex });
                            }} onBlur={() => {
                                if (!HEX_COLOR_PATTERN.test(hexDraft)) update({}, { hexDraft: color });
                            }} />
                        </div>
                        <div class="token-maker__swatches" aria-label="Selected Material family shades">
                            {Object.entries(MATERIAL_PALETTE[family]).map(([name, value]) => (
                                <button type="button" key={name} class="token-maker__swatch" style={{ backgroundColor: value }} aria-label={`${family} ${name}`} aria-pressed={color.toLowerCase() === value.toLowerCase()} onClick={() => {
                                    update({ frameColor: value }, { shade: name, color: value, hexDraft: value });
                                }} />
                            ))}
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Background</legend>
                        <label for="token-background-color">Color</label>
                        <input id="token-background-color" type="color" value={settings.backgroundColor} onInput={(event) => update({ backgroundColor: event.currentTarget.value })} />
                        <label for="token-background-opacity">Opacity <output>{settings.backgroundOpacity}%</output></label>
                        <input id="token-background-opacity" type="range" min="0" max="100" value={settings.backgroundOpacity} onInput={(event) => update({ backgroundOpacity: Number(event.currentTarget.value) })} />
                    </fieldset>

                    <fieldset>
                        <legend>Portrait image</legend>
                        <label for="token-image">Upload image</label>
                        <input id="token-image" type="file" accept="image/*" onChange={(event) => {
                            loadImage(event.currentTarget.files?.item(0) ?? undefined);
                            event.currentTarget.value = "";
                        }} />
                        <label for="token-image-layer">Image layer</label>
                        <select id="token-image-layer" value={settings.imageLayer} disabled={!image} onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (isImageLayer(value)) update({ imageLayer: value });
                        }}>
                            <option value="behind-frame">Behind frame, clipped to shape</option>
                            <option value="in-front">In front, inside output square</option>
                        </select>
                        <label for="token-image-scale">Scale <output>{settings.imageScale}%</output></label>
                        <input id="token-image-scale" type="range" min="10" max="400" value={settings.imageScale} disabled={!image} onInput={(event) => update({ imageScale: Number(event.currentTarget.value) })} />
                        <div class="token-maker__position">
                            <label for="token-image-x">Horizontal position</label>
                            <input id="token-image-x" type="number" min="-512" max="512" value={Math.round(settings.imageOffsetX)} disabled={!image} onInput={(event) => update({ imageOffsetX: numberInputValue(event.currentTarget.value) })} />
                            <label for="token-image-y">Vertical position</label>
                            <input id="token-image-y" type="number" min="-512" max="512" value={Math.round(settings.imageOffsetY)} disabled={!image} onInput={(event) => update({ imageOffsetY: numberInputValue(event.currentTarget.value) })} />
                        </div>
                        <div class="token-maker__image-actions">
                            <button type="button" disabled={!image} onClick={resetImage}>Fit / reset</button>
                            <button type="button" disabled={!image} onClick={() => {
                                loadSequence.current += 1;
                                setImage(undefined);
                                setStatus("Image removed.");
                            }}>Remove image</button>
                        </div>
                        <p class="token-maker__hint">Images first fit inside the square. Drag the preview or edit the position fields.</p>
                    </fieldset>
                </section>
            </div>
        </main>
    );
}

const root = document.getElementById("token-maker-root");
if (!root) throw new Error("Missing token maker root element.");
render(<TokenMaker />, root);
