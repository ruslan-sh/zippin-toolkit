import { DEFAULT_SETTINGS } from "./token-model";
import type { FrameStyle, ImageLayer, LancerSize, TokenSettings, TokenShape } from "./token-model";
import { MATERIAL_PALETTE, PALETTE_FAMILIES } from "./material-palette";
import type { PaletteFamily } from "./material-palette";

export const TOKEN_SETTINGS_STORAGE_KEY = "zippin-toolkit.token-maker.settings.v1";
export const TOKEN_MAKER_DEFAULTS: TokenMakerState = {
    settings: { ...DEFAULT_SETTINGS, frameColor: "#f44336" },
    family: "Red",
    shade: "500",
    color: "#f44336",
    hexDraft: "#f44336",
};

export interface TokenMakerState {
    settings: TokenSettings;
    family: PaletteFamily;
    shade: string;
    color: string;
    hexDraft: string;
}

export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

const SHAPES: readonly TokenShape[] = ["circle", "square", "vertical-hex", "horizontal-hex"];
const LANCER_SIZES: readonly LancerSize[] = ["1", "2", "2A", "3", "4", "4A"];
const FRAME_STYLES: readonly FrameStyle[] = ["solid", "dashed", "dotted"];
const IMAGE_LAYERS: readonly ImageLayer[] = ["behind-frame", "in-front"];
const HEX_COLOR = /^#[\da-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMember<T extends string>(value: unknown, values: readonly T[]): value is T {
    return typeof value === "string" && values.some((candidate) => candidate === value);
}

function isColor(value: unknown): value is string {
    return typeof value === "string" && HEX_COLOR.test(value);
}

function isFiniteInRange(value: unknown, minimum: number, maximum: number): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isTokenSettings(value: unknown): value is TokenSettings {
    if (!isRecord(value)) return false;
    return isMember(value.shape, SHAPES)
        && isMember(value.lancerSize, LANCER_SIZES)
        && isMember(value.frameStyle, FRAME_STYLES)
        && isColor(value.frameColor)
        && isFiniteInRange(value.frameThickness, 2, 48)
        && isColor(value.backgroundColor)
        && isFiniteInRange(value.backgroundOpacity, 0, 100)
        && isMember(value.imageLayer, IMAGE_LAYERS)
        && isFiniteInRange(value.imageScale, 10, 400)
        && typeof value.imageOffsetX === "number" && Number.isFinite(value.imageOffsetX)
        && typeof value.imageOffsetY === "number" && Number.isFinite(value.imageOffsetY);
}

function isFamily(value: unknown): value is PaletteFamily {
    return typeof value === "string" && PALETTE_FAMILIES.some((family) => family === value);
}

function isShade(family: PaletteFamily, shade: unknown): shade is string {
    return typeof shade === "string" && Object.keys(MATERIAL_PALETTE[family]).some((candidate) => candidate === shade);
}

export function decodeTokenMakerState(value: unknown): TokenMakerState {
    if (!isRecord(value) || value.version !== 1 || !isTokenSettings(value.settings)
        || !isFamily(value.family) || !isShade(value.family, value.shade)
        || !isColor(value.color) || typeof value.hexDraft !== "string" || value.hexDraft.length > 7) {
        return TOKEN_MAKER_DEFAULTS;
    }
    return {
        settings: {
            shape: value.settings.shape,
            lancerSize: value.settings.lancerSize,
            frameStyle: value.settings.frameStyle,
            frameColor: value.settings.frameColor,
            frameThickness: value.settings.frameThickness,
            backgroundColor: value.settings.backgroundColor,
            backgroundOpacity: value.settings.backgroundOpacity,
            imageLayer: value.settings.imageLayer,
            imageScale: value.settings.imageScale,
            imageOffsetX: value.settings.imageOffsetX,
            imageOffsetY: value.settings.imageOffsetY,
        },
        family: value.family,
        shade: value.shade,
        color: value.color,
        hexDraft: value.hexDraft,
    };
}

function browserStorage(): StorageLike | undefined {
    try {
        return typeof window === "undefined" ? undefined : window.localStorage;
    } catch {
        return undefined;
    }
}

export function loadTokenMakerState(storage: StorageLike | undefined = browserStorage()): TokenMakerState {
    try {
        const raw = storage?.getItem(TOKEN_SETTINGS_STORAGE_KEY);
        if (raw === null || raw === undefined) return TOKEN_MAKER_DEFAULTS;
        const parsed: unknown = JSON.parse(raw);
        return decodeTokenMakerState(parsed);
    } catch {
        return TOKEN_MAKER_DEFAULTS;
    }
}

export function saveTokenMakerState(state: TokenMakerState, storage: StorageLike | undefined = browserStorage()): void {
    try {
        const { settings } = state;
        storage?.setItem(TOKEN_SETTINGS_STORAGE_KEY, JSON.stringify({
            version: 1,
            settings: {
                shape: settings.shape,
                lancerSize: settings.lancerSize,
                frameStyle: settings.frameStyle,
                frameColor: settings.frameColor,
                frameThickness: settings.frameThickness,
                backgroundColor: settings.backgroundColor,
                backgroundOpacity: settings.backgroundOpacity,
                imageLayer: settings.imageLayer,
                imageScale: settings.imageScale,
                imageOffsetX: settings.imageOffsetX,
                imageOffsetY: settings.imageOffsetY,
            },
            family: state.family,
            shade: state.shade,
            color: state.color,
            hexDraft: state.hexDraft,
        }));
    } catch {
        // Storage can be disabled or full. The editor remains usable without persistence.
    }
}
