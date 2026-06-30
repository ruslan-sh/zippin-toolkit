import test from "node:test";
import assert from "node:assert/strict";

import { registerCalendarDateSelection, renderInput } from "../src/ts/render";

class FakeClassList {
    private readonly classNames = new Set<string>();

    add(...classNames: string[]): void {
        classNames.forEach((className) => this.classNames.add(className));
    }

    contains(className: string): boolean {
        return this.classNames.has(className);
    }

    toggle(className: string): void {
        if (this.contains(className)) {
            this.classNames.delete(className);
            return;
        }

        this.classNames.add(className);
    }
}

class FakeElement {
    children: FakeElement[] = [];
    parentElement: FakeElement | null = null;
    classList = new FakeClassList();
    dataset: Record<string, string> = {};
    textContent = "";
    id = "";
    value = "";
    disabled = false;
    type = "";
    placeholder = "";
    onclick: ((event: { target: FakeElement }) => void) | null = null;
    onchange: (() => void) | null = null;

    appendChild<T extends FakeElement>(child: T): T {
        child.parentElement = this;
        this.children.push(child);
        return child;
    }

    set innerHTML(value: string) {
        if (value !== "") {
            throw new Error("FakeElement only supports clearing innerHTML");
        }

        this.children = [];
    }

    querySelectorAll<T extends FakeElement>(selector: string): T[] {
        const matches: T[] = [];
        const className = selector.startsWith(".") ? selector.slice(1) : null;

        const visit = (element: FakeElement): void => {
            if (className && element.classList.contains(className)) {
                matches.push(element as T);
            }

            element.children.forEach(visit);
        };

        this.children.forEach(visit);
        return matches;
    }

    closest<T extends FakeElement>(selector: string): T | null {
        if (selector !== "[data-year][data-month][data-day]") {
            throw new Error(`Unsupported selector: ${selector}`);
        }

        if (this.dataset.year && this.dataset.month && this.dataset.day) {
            return this as unknown as T;
        }

        let currentElement = this.parentElement;
        while (currentElement) {
            if (
                currentElement.dataset.year &&
                currentElement.dataset.month &&
                currentElement.dataset.day
            ) {
                return currentElement as unknown as T;
            }
            currentElement = currentElement.parentElement;
        }

        return null;
    }
}

class FakeDocument {
    body = new FakeElement();

    createElement(_tagName: string): FakeElement {
        return new FakeElement();
    }

    getElementById(id: string): FakeElement | null {
        const visit = (element: FakeElement): FakeElement | null => {
            if (element.id === id) {
                return element;
            }

            for (const child of element.children) {
                const match = visit(child);
                if (match) {
                    return match;
                }
            }

            return null;
        };

        return visit(this.body);
    }
}

interface MockHistory {
    pushedUrls: string[];
    pushState: (_state: object, _unused: string, url?: string | URL | null) => void;
}

interface MockWindow {
    location: {
        hash: string;
        search: string;
        pathname: string;
    };
    history: MockHistory;
}

function findFirst(
    root: FakeElement,
    predicate: (element: FakeElement) => boolean,
): FakeElement {
    const visit = (element: FakeElement): FakeElement | null => {
        if (predicate(element)) {
            return element;
        }

        for (const child of element.children) {
            const match = visit(child);
            if (match) {
                return match;
            }
        }

        return null;
    };

    const match = visit(root);
    if (!match) {
        throw new Error("Matching element not found");
    }

    return match;
}

function createMockWindow(): MockWindow {
    return {
        location: {
            hash: "",
            search: "",
            pathname: "/calendar",
        },
        history: {
            pushedUrls: [],
            pushState: (_state: object, _unused: string, url?: string | URL | null) => {
                if (url) {
                    mockWindow.history.pushedUrls.push(String(url));
                }
            },
        },
    };
}

let mockWindow = createMockWindow();

function withMockDom(callback: (document: FakeDocument, window: MockWindow) => void): void {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    const originalHTMLElement = globalThis.HTMLElement;
    const originalHTMLDivElement = globalThis.HTMLDivElement;
    const originalHTMLInputElement = globalThis.HTMLInputElement;
    const originalHTMLSelectElement = globalThis.HTMLSelectElement;
    const originalHTMLOptionElement = globalThis.HTMLOptionElement;

    const document = new FakeDocument();
    mockWindow = createMockWindow();

    const inputContainer = document.createElement("div");
    inputContainer.id = "inputContainer";
    document.body.appendChild(inputContainer);

    const calendarContainer = document.createElement("div");
    calendarContainer.id = "calendarContainer";
    document.body.appendChild(calendarContainer);

    Object.assign(globalThis, {
        window: mockWindow,
        document,
        HTMLElement: FakeElement,
        HTMLDivElement: FakeElement,
        HTMLInputElement: FakeElement,
        HTMLSelectElement: FakeElement,
        HTMLOptionElement: FakeElement,
    });

    try {
        callback(document, mockWindow);
    } finally {
        Object.assign(globalThis, {
            window: originalWindow,
            document: originalDocument,
            HTMLElement: originalHTMLElement,
            HTMLDivElement: originalHTMLDivElement,
            HTMLInputElement: originalHTMLInputElement,
            HTMLSelectElement: originalHTMLSelectElement,
            HTMLOptionElement: originalHTMLOptionElement,
        });
    }
}

test("clicking a rendered day in another month updates controls and URL", () => {
    withMockDom((document, window) => {
        registerCalendarDateSelection();
        renderInput(1504, "Hammer", 1);
        window.history.pushedUrls.length = 0;

        const calendarContainer = document.getElementById("calendarContainer");
        if (!calendarContainer?.onclick) {
            throw new Error("Missing calendar click handler");
        }

        const alturiakDay = findFirst(
            calendarContainer,
            (element) =>
                element.classList.contains("calendar__day") &&
                element.dataset.month === "Alturiak" &&
                element.dataset.day === "5",
        );

        calendarContainer.onclick({ target: alturiakDay });

        const yearInput = document.getElementById("yearInput");
        const monthInput = document.getElementById("monthInput");
        const dayInput = document.getElementById("dayInput");

        assert.equal(yearInput?.value, "1504");
        assert.equal(monthInput?.value, "Alturiak");
        assert.equal(dayInput?.value, "5");
        assert.equal(
            window.history.pushedUrls[window.history.pushedUrls.length - 1],
            "/calendar#1504/Alturiak/5",
        );

        const currentDay = findFirst(
            calendarContainer,
            (element) =>
                element.classList.contains("calendar__day") &&
                element.classList.contains("calendar__day--current"),
        );

        assert.equal(currentDay.dataset.month, "Alturiak");
        assert.equal(currentDay.dataset.day, "5");
    });
});

test("clicking the current day does not rerender or write the URL again", () => {
    withMockDom((document, window) => {
        registerCalendarDateSelection();
        renderInput(1504, "Hammer", 1);
        window.history.pushedUrls.length = 0;

        const calendarContainer = document.getElementById("calendarContainer");
        if (!calendarContainer?.onclick) {
            throw new Error("Missing calendar click handler");
        }

        const currentDay = findFirst(
            calendarContainer,
            (element) =>
                element.classList.contains("calendar__day") &&
                element.dataset.month === "Hammer" &&
                element.dataset.day === "1",
        );

        calendarContainer.onclick({ target: currentDay });

        assert.equal(window.history.pushedUrls.length, 0);
    });
});

test("clicking a festival title selects day 1 and disables day input", () => {
    withMockDom((document, window) => {
        registerCalendarDateSelection();
        renderInput(1504, "Hammer", 1);
        window.history.pushedUrls.length = 0;

        const calendarContainer = document.getElementById("calendarContainer");
        if (!calendarContainer?.onclick) {
            throw new Error("Missing calendar click handler");
        }

        const festivalTitle = findFirst(
            calendarContainer,
            (element) =>
                element.classList.contains("calendar__festival-title") &&
                element.dataset.month === "Midwinter",
        );

        calendarContainer.onclick({ target: festivalTitle });

        const monthInput = document.getElementById("monthInput");
        const dayInput = document.getElementById("dayInput");

        assert.equal(monthInput?.value, "Midwinter");
        assert.equal(dayInput?.value, "1");
        assert.equal(dayInput?.disabled, true);
        assert.equal(
            window.history.pushedUrls[window.history.pushedUrls.length - 1],
            "/calendar#1504/Midwinter/1",
        );
    });
});
