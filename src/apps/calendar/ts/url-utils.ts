import type { QueryParams } from "./types";

export function readDateFromUrl(): QueryParams {
    const hashValue = window.location.hash.slice(1);
    if (hashValue) {
        const [yearSegment, monthSegment, daySegment] = hashValue.split("/");

        return {
            year: yearSegment ? Number(yearSegment) : null,
            month: monthSegment ? decodeURIComponent(monthSegment) : null,
            day: daySegment ? Number(daySegment) : null,
        };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const yearValue = urlParams.get("y");
    const dayValue = urlParams.get("d");

    return {
        year: yearValue === null ? null : Number(yearValue),
        month: urlParams.get("m"),
        day: dayValue === null ? null : Number(dayValue),
    };
}

export function writeDateToUrl(year: number, month: string, day: number): void {
    const hashPath = [year.toString(), encodeURIComponent(month), day.toString()].join("/");
    window.history.pushState({}, "", `${window.location.pathname}#${hashPath}`);
}
