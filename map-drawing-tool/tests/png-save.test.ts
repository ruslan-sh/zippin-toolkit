import test from "node:test";
import assert from "node:assert/strict";

import { FileSystemFileHandle, startPngSave } from "../src/png-save";

test("save picker starts immediately and writes then closes the selected PNG", async () => {
    const events: string[] = [];
    const handle: FileSystemFileHandle = {
        createWritable: async () => ({
            write: async () => {
                events.push("write");
            },
            close: async () => {
                events.push("close");
            },
        }),
    };
    const saver = startPngSave(async (options) => {
        events.push(`picker:${options.suggestedName}:${options.types[0].accept["image/png"][0]}`);
        return handle;
    }, () => events.push("download"));

    assert.deepEqual(events, ["picker:map.png:.png"]);
    assert.equal(await saver(new Blob(["png"]), "map.png"), true);
    assert.deepEqual(events, ["picker:map.png:.png", "write", "close"]);
});

test("picker cancellation neither downloads nor reports a save result", async () => {
    let downloads = 0;
    const cancellation = new DOMException("The user cancelled.", "AbortError");
    const saver = startPngSave(async () => Promise.reject(cancellation), () => {
        downloads += 1;
    });

    assert.equal(await saver(new Blob(["png"]), "map.png"), false);
    assert.equal(downloads, 0);
});

test("the fallback downloads and save errors remain retryable failures", async () => {
    const downloads: string[] = [];
    const fallback = startPngSave(undefined, (_blob, filename) => downloads.push(filename));
    assert.equal(await fallback(new Blob(["png"]), "map.png"), true);
    assert.deepEqual(downloads, ["map.png"]);

    const failing = startPngSave(async () => ({
        createWritable: async () => {
            throw new Error("Disk full");
        },
    }), () => undefined);
    await assert.rejects(failing(new Blob(["png"]), "map.png"), /Disk full/);
});
