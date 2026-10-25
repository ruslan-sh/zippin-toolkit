import type { QueryParams } from "./types";

function parseInteger(value: string | null | undefined): number | null {
    if (value == null || value.trim() === "") {
        return null;
    }
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
}

export function readDateFromUrl(): QueryParams {
    const hashValue = window.location.hash.slice(1);
    if (hashValue) {
        const [yearSegment, monthSegment, daySegment] = hashValue.split("/");
        let month: string | null = null;
        try {
            month = monthSegment ? decodeURIComponent(monthSegment) : null;
        } catch {
            // A malformed URL month uses the same fallback as a missing month.
        }

        return {
            year: parseInteger(yearSegment),
            month,
            day: parseInteger(daySegment),
        };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const yearValue = urlParams.get("y");
    const dayValue = urlParams.get("d");

    return {
        year: parseInteger(yearValue),
        month: urlParams.get("m"),
        day: parseInteger(dayValue),
    };
}

export function writeDateToUrl(year: number, month: string, day: number): void {
    const currentDate = readDateFromUrl();
    if (
        (currentDate.year ?? 1500) === year &&
        (currentDate.month ?? "Hammer") === month &&
        (currentDate.day ?? 1) === day
    ) {
        return;
    }

    const hashPath = [year.toString(), encodeURIComponent(month), day.toString()].join("/");
    window.history.pushState({}, "", `${window.location.pathname}#${hashPath}`);
    window.dispatchEvent(new Event("urlchange"));
}
