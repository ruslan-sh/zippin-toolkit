import test from "node:test";
import assert from "node:assert/strict";

import { readDateFromUrl, writeDateToUrl } from "../url-utils";

interface MockHistory {
    pushState: (state: object, unused: string, url?: string | URL | null) => void;
}

interface MockLocation {
    hash: string;
    search: string;
    pathname: string;
}

type MockWindow = {
    dispatchEvent?: (event: Event) => boolean;
    location: MockLocation;
    history: MockHistory;
};

function withMockWindow(mockWindow: MockWindow, callback: () => void): void {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: { dispatchEvent: () => true, ...mockWindow },
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

test("readDateFromUrl rejects invalid numeric date parts in hashes and queries", () => {
    for (const value of ["NaN", "Infinity", "-Infinity", "abc", "1.5", "", " ", "9007199254740992"]) {
        for (const location of [
            { hash: `#${value}/Hammer/${value}`, search: "", pathname: "/calendar" },
            { hash: "", search: `?y=${encodeURIComponent(value)}&m=Hammer&d=${encodeURIComponent(value)}`, pathname: "/calendar" },
        ]) {
            withMockWindow({ location, history: { pushState: () => undefined } }, () => {
                assert.deepEqual(readDateFromUrl(), { year: null, month: "Hammer", day: null });
            });
        }
    }
});

test("readDateFromUrl treats malformed encoded months as missing", () => {
    withMockWindow({
        location: { hash: "#1500/%E0%A4%A/1", search: "", pathname: "/calendar" },
        history: { pushState: () => undefined },
    }, () => {
        assert.deepEqual(readDateFromUrl(), { year: 1500, month: null, day: 1 });
    });
});

test("readDateFromUrl preserves valid integer years including zero", () => {
    withMockWindow({
        location: { hash: "#0/Hammer/21", search: "", pathname: "/calendar" },
        history: { pushState: () => undefined },
    }, () => {
        assert.deepEqual(readDateFromUrl(), { year: 0, month: "Hammer", day: 21 });
    });
});

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

test("writeDateToUrl notifies subscribers after updating history", () => {
    const events: string[] = [];
    const mockWindow: MockWindow = {
        location: { hash: "", search: "", pathname: "/calendar" },
        history: {
            pushState: (_state, _unused, url) => {
                mockWindow.location.hash = new URL(String(url), "https://example.com").hash;
            },
        },
        dispatchEvent: (event) => {
            events.push(event.type);
            assert.equal(readDateFromUrl().day, 21);
            return true;
        },
    };
    withMockWindow(mockWindow, () => {
        writeDateToUrl(1500, "Hammer", 21);
        writeDateToUrl(1500, "Hammer", 21);
    });
    assert.deepEqual(events, ["urlchange"]);
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
                pathname: "/zippin-toolkit/apps/calendar/",
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

    assert.equal(pushedUrl, "/zippin-toolkit/apps/calendar/#1504/Hammer/1");
});
