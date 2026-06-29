import test from "node:test";
import assert from "node:assert/strict";

import { Calendar } from "../src/ts/calendar";
import { Moon } from "../src/ts/moon";
import type { CalendarMonth, MoonProps } from "../src/ts/types";
import { MoonPhaseState } from "../src/ts/types";

function assertClose(actual: number, expected: number, message?: string): void {
    assert.ok(
        Math.abs(actual - expected) <= 1e-12,
        message ?? `Expected ${actual} to be within tolerance of ${expected}`,
    );
}

const testMoonProps: MoonProps = {
    astronomical: {
        daysInYear: 365.25,
        moon: {
            name: "Selune",
            period: 30 + 10.5 / 24,
        },
    },
    calendar: {
        yearName: "DR",
        isMonthsWeeksSynced: true,
        springEquinox: 80,
        leapYear: { first: 0, frequency: 4 },
        fullMoon: { year: 1372, day: 1 },
        months: [
            { name: "Hammer", alias: "Deepwinter", days: 30 },
            { name: "Midwinter", days: 1, isFestival: true },
            { name: "Alturiak", alias: "The Claw of Winter", days: 30 },
            { name: "Ches", alias: "The Claw of Sunsets", days: 30 },
            { name: "Tarsakh", alias: "The Claw of Storms", days: 30 },
            { name: "Greengrass", days: 1, isFestival: true },
            { name: "Mirtul", alias: "The Melting", days: 30 },
            { name: "Kythorn", alias: "The Time of Flowers", days: 30 },
            { name: "Flamerule", alias: "Summertide", days: 30 },
            { name: "Midsummer", days: 1, isFestival: true },
            { name: "Shieldmeet", days: 1, isFestival: true, leapDayMode: "leap-only" },
            { name: "Eleasis", alias: "Highsun", days: 30 },
            { name: "Eleint", alias: "The Fading", days: 30 },
            { name: "Highharvestide", days: 1, isFestival: true },
            { name: "Marpenoth", alias: "Leaffall", days: 30 },
            { name: "Uktar", alias: "The Rotting", days: 30 },
            { name: "Feast of the Moon", days: 1, isFestival: true },
            { name: "Nightal", alias: "The Drawing Down", days: 30 },
        ],
        days: [
            { name: "First", short: "1st" },
            { name: "Second", short: "2nd" },
            { name: "Third", short: "3rd" },
            { name: "Fourth", short: "4th" },
            { name: "Fifth", short: "5th" },
            { name: "Sixth", short: "6th" },
            { name: "Seventh", short: "7th" },
            { name: "Eighth", short: "8th" },
            { name: "Ninth", short: "9th" },
            { name: "Tenth", short: "10th" },
        ],
    },
};

const calendar = new Calendar(testMoonProps);
const moon = new Moon(testMoonProps, calendar);

function isLeapYear(yearId: number): boolean {
    const { leapYear } = testMoonProps.calendar;
    return (yearId - leapYear.first) % leapYear.frequency === 0;
}

function getMonthByName(monthName: string): CalendarMonth {
    const month = testMoonProps.calendar.months.find(
        (calendarMonth) => calendarMonth.name === monthName,
    );
    if (!month) {
        throw new Error(`Month not found: ${monthName}`);
    }
    return month;
}

function getMonthDaysInYear(yearId: number, month: CalendarMonth): number {
    if (!month.leapDayMode) {
        return month.days;
    }

    if (month.leapDayMode === "leap-only") {
        return isLeapYear(yearId) ? month.days : 0;
    }

    return isLeapYear(yearId) ? month.days + 1 : month.days;
}

function getDayOfYear(yearId: number, monthName: string, dayId: number): number {
    let daysSinceYearStart = 0;

    for (const month of testMoonProps.calendar.months) {
        if (month.name === monthName) {
            return daysSinceYearStart + dayId;
        }

        daysSinceYearStart += getMonthDaysInYear(yearId, month);
    }

    throw new Error(`Month not found: ${monthName}`);
}

function naiveDaysOffsetFromAnchor(yearId: number, monthName: string, dayId: number): number {
    const baseYearDays = Math.floor(testMoonProps.astronomical.daysInYear);
    const anchorYear = testMoonProps.calendar.fullMoon.year;
    let daysOffset = getDayOfYear(yearId, monthName, dayId) - testMoonProps.calendar.fullMoon.day;

    if (yearId >= anchorYear) {
        for (let currentYear = anchorYear; currentYear < yearId; currentYear += 1) {
            daysOffset += baseYearDays + (isLeapYear(currentYear) ? 1 : 0);
        }

        return daysOffset;
    }

    for (let currentYear = yearId; currentYear < anchorYear; currentYear += 1) {
        daysOffset -= baseYearDays + (isLeapYear(currentYear) ? 1 : 0);
    }

    return daysOffset;
}

function getAnchorFullMoonDate(): { monthName: string; dayId: number } {
    let remainingDayOfYear = testMoonProps.calendar.fullMoon.day;

    for (const month of testMoonProps.calendar.months) {
        const daysInMonth = getMonthDaysInYear(testMoonProps.calendar.fullMoon.year, month);

        if (remainingDayOfYear <= daysInMonth) {
            return { monthName: month.name, dayId: remainingDayOfYear };
        }

        remainingDayOfYear -= daysInMonth;
    }

    throw new Error("Configured full moon day is outside the target year");
}

test("normalizeMoonCyclePosition wraps values into [0, 1)", () => {
    assert.equal(moon.normalizeMoonCyclePosition(0), 0);
    assert.equal(moon.normalizeMoonCyclePosition(1), 0);
    assert.equal(moon.normalizeMoonCyclePosition(-1), 0);
    assert.equal(moon.normalizeMoonCyclePosition(1.25), 0.25);
    assert.equal(moon.normalizeMoonCyclePosition(-0.25), 0.75);
});

test("advanceMoonCyclePosition moves one day forward and wraps", () => {
    const dailyStep = 1 / testMoonProps.astronomical.moon.period;

    assertClose(moon.advanceMoonCyclePosition(0), dailyStep);
    assertClose(
        moon.advanceMoonCyclePosition(1 - dailyStep / 2),
        moon.normalizeMoonCyclePosition(1 - dailyStep / 2 + dailyStep),
    );
});

test("classifyMoonPhase matches spec boundary semantics", () => {
    assert.equal(moon.classifyMoonPhase(0), MoonPhaseState.Full);
    assert.equal(moon.classifyMoonPhase(0.024999), MoonPhaseState.Full);
    assert.equal(moon.classifyMoonPhase(0.025), MoonPhaseState.None);
    assert.equal(moon.classifyMoonPhase(0.975), MoonPhaseState.None);
    assert.equal(moon.classifyMoonPhase(0.975001), MoonPhaseState.Full);

    assert.equal(moon.classifyMoonPhase(0.475), MoonPhaseState.New);
    assert.equal(moon.classifyMoonPhase(0.5), MoonPhaseState.New);
    assert.equal(moon.classifyMoonPhase(0.525), MoonPhaseState.New);
    assert.equal(moon.classifyMoonPhase(0.474999), MoonPhaseState.None);
    assert.equal(moon.classifyMoonPhase(0.525001), MoonPhaseState.None);

    assert.equal(moon.classifyMoonPhase(0.225), MoonPhaseState.None);
    assert.equal(moon.classifyMoonPhase(0.225001), MoonPhaseState.HalfWaning);
    assert.equal(moon.classifyMoonPhase(0.275), MoonPhaseState.HalfWaning);
    assert.equal(moon.classifyMoonPhase(0.275001), MoonPhaseState.None);

    assert.equal(moon.classifyMoonPhase(0.725), MoonPhaseState.None);
    assert.equal(moon.classifyMoonPhase(0.725001), MoonPhaseState.HalfWaxing);
    assert.equal(moon.classifyMoonPhase(0.775), MoonPhaseState.HalfWaxing);
    assert.equal(moon.classifyMoonPhase(0.775001), MoonPhaseState.None);
});

test("classifyMoonPhase assigns waning and waxing halves by cycle side", () => {
    assert.equal(moon.classifyMoonPhase(0.24), MoonPhaseState.HalfWaning);
    assert.equal(moon.classifyMoonPhase(0.26), MoonPhaseState.HalfWaning);
    assert.equal(moon.classifyMoonPhase(0.74), MoonPhaseState.HalfWaxing);
    assert.equal(moon.classifyMoonPhase(0.76), MoonPhaseState.HalfWaxing);
});

test("getDaysOffsetFromFullMoon returns zero at the configured anchor full moon", () => {
    const anchorFullMoonDate = getAnchorFullMoonDate();

    assert.equal(
        moon.getDaysOffsetFromFullMoon(
            testMoonProps.calendar.fullMoon.year,
            anchorFullMoonDate.monthName,
            anchorFullMoonDate.dayId,
        ),
        0,
    );
});

test("getDaysOffsetFromFullMoon accounts for leap and non-leap year lengths in both directions", () => {
    assert.equal(moon.getDaysOffsetFromFullMoon(1373, "Hammer", 1), 366);
    assert.equal(moon.getDaysOffsetFromFullMoon(1376, "Hammer", 1), 1461);
    assert.equal(moon.getDaysOffsetFromFullMoon(1376, "Shieldmeet", 1), 1674);
    assert.equal(moon.getDaysOffsetFromFullMoon(1371, "Hammer", 1), -365);
});

test("getMoonCyclePosition initializes directly from the anchor for past and future dates", () => {
    const referenceDates: Array<[number, string, number]> = [
        [1372, "Hammer", 1],
        [1373, "Hammer", 1],
        [1376, "Shieldmeet", 1],
        [1300, "Greengrass", 1],
        [1450, "Feast of the Moon", 1],
    ];

    for (const [yearId, monthName, dayId] of referenceDates) {
        const expectedCyclePosition = moon.normalizeMoonCyclePosition(
            naiveDaysOffsetFromAnchor(yearId, monthName, dayId) / testMoonProps.astronomical.moon.period,
        );

        assertClose(
            moon.getMoonCyclePosition(yearId, monthName, dayId),
            expectedCyclePosition,
            `${yearId} ${monthName} ${dayId}`,
        );
    }
});

test("getMoonCyclePosition matches a naive reference across a wide year range", () => {
    const referenceMonths = ["Hammer", "Greengrass", "Shieldmeet", "Nightal"] as const;
    const referenceYears = [900, 1024, 1200, 1372, 1600, 2000, 2400];

    for (const yearId of referenceYears) {
        for (const monthName of referenceMonths) {
            const monthDays = getMonthDaysInYear(yearId, getMonthByName(monthName));
            if (monthDays === 0) {
                continue;
            }

            for (const dayId of [1, monthDays]) {
                const expectedCyclePosition = moon.normalizeMoonCyclePosition(
                    naiveDaysOffsetFromAnchor(yearId, monthName, dayId)
                    / testMoonProps.astronomical.moon.period,
                );

                assertClose(
                    moon.getMoonCyclePosition(yearId, monthName, dayId),
                    expectedCyclePosition,
                    `${yearId} ${monthName} ${dayId}`,
                );
            }
        }
    }
});

test("getMoonCyclePosition advances continuously across month and leap-day boundaries", () => {
    const flameruleLastDay = moon.getMoonCyclePosition(1376, "Flamerule", 30);
    const midsummer = moon.getMoonCyclePosition(1376, "Midsummer", 1);
    const shieldmeet = moon.getMoonCyclePosition(1376, "Shieldmeet", 1);
    const eleasis = moon.getMoonCyclePosition(1376, "Eleasis", 1);

    assertClose(midsummer, moon.advanceMoonCyclePosition(flameruleLastDay));
    assertClose(shieldmeet, moon.advanceMoonCyclePosition(midsummer));
    assertClose(eleasis, moon.advanceMoonCyclePosition(shieldmeet));
});

test("festival and normal months use the same day-start moon logic", () => {
    const greengrassCyclePosition = moon.getMoonCyclePosition(1372, "Greengrass", 1);
    const dayBeforeFestival = moon.getMoonCyclePosition(
        1372,
        "Tarsakh",
        getMonthByName("Tarsakh").days,
    );
    const dayAfterFestival = moon.getMoonCyclePosition(1372, "Mirtul", 1);

    assertClose(greengrassCyclePosition, moon.advanceMoonCyclePosition(dayBeforeFestival));
    assertClose(dayAfterFestival, moon.advanceMoonCyclePosition(greengrassCyclePosition));
});

test("getMonthMoonPhases returns only classified days for a normal month", () => {
    const moonPhases = moon.getMonthMoonPhases(1372, "Hammer");
    const hammerDays = getMonthByName("Hammer").days;

    for (let dayId = 1; dayId <= hammerDays; dayId += 1) {
        const expectedMoonPhase = moon.classifyMoonPhase(
            moon.getMoonCyclePosition(1372, "Hammer", dayId),
        );

        if (expectedMoonPhase === MoonPhaseState.None) {
            assert.equal(moonPhases[dayId], undefined, `day ${dayId}`);
            continue;
        }

        assert.equal(moonPhases[dayId], expectedMoonPhase, `day ${dayId}`);
    }
});

test("getMonthMoonPhases applies the same classification rules to festival days", () => {
    const midsummerMoonPhases = moon.getMonthMoonPhases(1375, "Midsummer");
    const shieldmeetMoonPhases = moon.getMonthMoonPhases(1376, "Shieldmeet");
    const midsummerMoonPhase = moon.classifyMoonPhase(
        moon.getMoonCyclePosition(1375, "Midsummer", 1),
    );
    const shieldmeetMoonPhase = moon.classifyMoonPhase(
        moon.getMoonCyclePosition(1376, "Shieldmeet", 1),
    );

    assert.deepEqual(
        midsummerMoonPhases,
        midsummerMoonPhase === MoonPhaseState.None ? {} : { 1: midsummerMoonPhase },
    );
    assert.deepEqual(
        shieldmeetMoonPhases,
        shieldmeetMoonPhase === MoonPhaseState.None ? {} : { 1: shieldmeetMoonPhase },
    );
});

test("getMonthMoonPhases returns no days for leap-only festivals outside leap years", () => {
    assert.deepEqual(moon.getMonthMoonPhases(1375, "Shieldmeet"), {});
});

test("getMonthMoonPhases advances month state day by day from the month start", () => {
    const moonPhases = moon.getMonthMoonPhases(1376, "Eleint");
    const eleintDays = getMonthByName("Eleint").days;
    let cyclePos = moon.getMoonCyclePosition(1376, "Eleint", 1);

    for (let dayId = 1; dayId <= eleintDays; dayId += 1) {
        const expectedMoonPhase = moon.classifyMoonPhase(cyclePos);

        if (expectedMoonPhase === MoonPhaseState.None) {
            assert.equal(moonPhases[dayId], undefined, `day ${dayId}`);
        } else {
            assert.equal(moonPhases[dayId], expectedMoonPhase, `day ${dayId}`);
        }

        cyclePos = moon.advanceMoonCyclePosition(cyclePos);
    }
});
