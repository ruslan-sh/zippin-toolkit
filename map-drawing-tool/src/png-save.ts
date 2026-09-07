export interface FileSystemWritableFileStream {
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
}

export interface FileSystemFileHandle {
    createWritable: () => Promise<FileSystemWritableFileStream>;
}

export interface SaveFilePickerOptions {
    suggestedName: string;
    types: Array<{ description: string; accept: Record<string, string[]> }>;
}

export type SaveFilePicker = (options: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;

export type PngSaver = (blob: Blob, filename: string) => Promise<boolean>;

type PickerResult =
    | { kind: "selected"; handle: FileSystemFileHandle }
    | { kind: "cancelled" }
    | { kind: "error"; error: unknown };

function isPickerCancellation(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
}

export function startPngSave(
    picker: SaveFilePicker | undefined,
    download: (blob: Blob, filename: string) => void,
): PngSaver {
    if (!picker) {
        return async (blob, filename) => {
            download(blob, filename);
            return true;
        };
    }

    const pickerResult: Promise<PickerResult> = Promise.resolve(
        picker({
            suggestedName: "map.png",
            types: [{ description: "PNG image", accept: { "image/png": [".png"] } }],
        }),
    ).then(
        (handle) => ({ kind: "selected", handle }),
        (error) => isPickerCancellation(error)
            ? { kind: "cancelled" }
            : { kind: "error", error },
    );

    return async (blob) => {
        const result = await pickerResult;
        if (result.kind === "cancelled") {
            return false;
        }
        if (result.kind === "error") {
            throw result.error;
        }
        const writable = await result.handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
    };
}
