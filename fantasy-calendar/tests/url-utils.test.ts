import test from "node:test";
import assert from "node:assert/strict";

import { readDateFromUrl, writeDateToUrl } from "../src/ts/url-utils";

interface MockHistory {
    pushState: (state: object, unused: string, url?: string | URL | null) => void;
}

interface MockLocation {
    hash: string;
    search: string;
    pathname: string;
}

type MockWindow = {
    location: MockLocation;
    history: MockHistory;
};

function withMockWindow(mockWindow: MockWindow, callback: () => void): void {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: mockWindow,
    });

    try {
        callback();
    } finally {
        Object.defineProperty(globalThis, "window", {
            configurable: true,
            value: originalWindow,
        });
    }
}

test("readDateFromUrl reads date parts from hash path segments", () => {
    withMockWindow(
        {
            location: {
                hash: "#1504/Feast%20of%20the%20Moon/1",
                search: "",
                pathname: "/calendar",
            },
            history: { pushState: () => undefined },
        },
        () => {
            assert.deepEqual(readDateFromUrl(), {
                year: 1504,
                month: "Feast of the Moon",
                day: 1,
            });
        },
    );
});

test("readDateFromUrl falls back to legacy query params when hash is absent", () => {
    withMockWindow(
        {
            location: {
                hash: "",
                search: "?y=1504&m=Alturiak&d=1",
                pathname: "/calendar",
            },
            history: { pushState: () => undefined },
        },
        () => {
            assert.deepEqual(readDateFromUrl(), {
                year: 1504,
                month: "Alturiak",
                day: 1,
            });
        },
    );
});

test("writeDateToUrl writes the date into the hash path", () => {
    let pushedUrl = "";

    withMockWindow(
        {
            location: {
                hash: "",
                search: "",
                pathname: "/calendar",
            },
            history: {
                pushState: (_state: object, _unused: string, url?: string | URL | null) => {
                    pushedUrl = String(url);
                },
            },
        },
        () => {
            writeDateToUrl(1504, "Feast of the Moon", 1);
        },
    );

    assert.equal(pushedUrl, "/calendar#1504/Feast%20of%20the%20Moon/1");
});

test("writeDateToUrl preserves the nested calendar pathname", () => {
    let pushedUrl = "";

    withMockWindow(
        {
            location: {
                hash: "",
                search: "",
                pathname: "/zippin-toolkit/fantasy-calendar/",
            },
            history: {
                pushState: (_state: object, _unused: string, url?: string | URL | null) => {
                    pushedUrl = String(url);
                },
            },
        },
        () => {
            writeDateToUrl(1504, "Hammer", 1);
        },
    );

    assert.equal(pushedUrl, "/zippin-toolkit/fantasy-calendar/#1504/Hammer/1");
});
