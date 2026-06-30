import test from "node:test";
import assert from "node:assert/strict";

import { Calendar } from "../src/ts/calendar";
import type { CalendarProps } from "../src/ts/calendar";

const leapOnlyCalendarProps: CalendarProps = {
    astronomical: {
        daysInYear: 91.5,
        moon: {
            name: "Selune",
            period: 30,
        },
    },
    calendar: {
        yearName: "FY",
        isMonthsWeeksSynced: true,
        springEquinox: 20,
        leapYear: { first: 100, frequency: 4 },
        fullMoon: { year: 100, day: 1 },
        months: [
            { name: "Dawn", days: 30 },
            { name: "Leapfest", days: 1, isFestival: true, leapDayMode: "leap-only" },
            { name: "Dusk", days: 30 },
            { name: "Night", days: 31 },
        ],
        days: [
            { name: "First", short: "1st" },
            { name: "Second", short: "2nd" },
        ],
    },
};

const extraDayCalendarProps: CalendarProps = {
    astronomical: {
        daysInYear: 90.5,
        moon: {
            name: "Selune",
            period: 30,
        },
    },
    calendar: {
        yearName: "FY",
        isMonthsWeeksSynced: true,
        springEquinox: 20,
        leapYear: { first: 100, frequency: 4 },
        fullMoon: { year: 100, day: 1 },
        months: [
            { name: "Dawn", days: 30 },
            { name: "Harvest", days: 30, leapDayMode: "extra-day" },
            { name: "Night", days: 30 },
        ],
        days: [
            { name: "First", short: "1st" },
            { name: "Second", short: "2nd" },
        ],
    },
};

test("getMonthByName returns the matching month and throws for missing names", () => {
    const calendar = new Calendar(leapOnlyCalendarProps);

    assert.equal(calendar.getMonthByName("Dawn").days, 30);
    assert.throws(() => calendar.getMonthByName("Missing"), {
        message: "Month not found: Missing",
    });
});

test("isLeapYear honors the configured first leap year boundary", () => {
    const calendar = new Calendar(leapOnlyCalendarProps);

    assert.equal(calendar.isLeapYear(99), false);
    assert.equal(calendar.isLeapYear(100), true);
    assert.equal(calendar.isLeapYear(101), false);
    assert.equal(calendar.isLeapYear(104), true);
});

test("getMonthDaysInYear handles regular, leap-only, and extra-day months", () => {
    const leapOnlyCalendar = new Calendar(leapOnlyCalendarProps);
    const extraDayCalendar = new Calendar(extraDayCalendarProps);

    assert.equal(leapOnlyCalendar.getMonthDaysInYear(101, leapOnlyCalendar.getMonthByName("Dawn")), 30);
    assert.equal(
        leapOnlyCalendar.getMonthDaysInYear(101, leapOnlyCalendar.getMonthByName("Leapfest")),
        0,
    );
    assert.equal(
        leapOnlyCalendar.getMonthDaysInYear(100, leapOnlyCalendar.getMonthByName("Leapfest")),
        1,
    );
    assert.equal(
        extraDayCalendar.getMonthDaysInYear(101, extraDayCalendar.getMonthByName("Harvest")),
        30,
    );
    assert.equal(
        extraDayCalendar.getMonthDaysInYear(100, extraDayCalendar.getMonthByName("Harvest")),
        31,
    );
});

test("getDaysSinceYearStart and getDayOfYear account for skipped leap-only festivals", () => {
    const calendar = new Calendar(leapOnlyCalendarProps);

    assert.equal(calendar.getDaysSinceYearStart(101, "Dusk"), 30);
    assert.equal(calendar.getDayOfYear(101, "Dusk", 1), 31);
    assert.equal(calendar.getDaysSinceYearStart(100, "Dusk"), 31);
    assert.equal(calendar.getDayOfYear(100, "Night", 31), 92);
});

test("countLeapYearsBetween counts leap years across forward and reverse ranges", () => {
    const calendar = new Calendar(leapOnlyCalendarProps);

    assert.equal(calendar.countLeapYearsBetween(100, 100), 0);
    assert.equal(calendar.countLeapYearsBetween(100, 101), 1);
    assert.equal(calendar.countLeapYearsBetween(101, 108), 1);
    assert.equal(calendar.countLeapYearsBetween(101, 109), 2);
    assert.equal(calendar.countLeapYearsBetween(109, 101), -2);
});

test("calculateDate rolls across year boundaries in non-leap and leap years", () => {
    const calendar = new Calendar(leapOnlyCalendarProps);

    assert.deepEqual(
        calendar.calculateDate({ year: 101, month: "Night", day: 31 }, 1),
        { year: 102, month: "Dawn", day: 1 },
    );
    assert.deepEqual(
        calendar.calculateDate({ year: 99, month: "Night", day: 31 }, 1),
        { year: 100, month: "Dawn", day: 1 },
    );
    assert.deepEqual(
        calendar.calculateDate({ year: 100, month: "Dawn", day: 30 }, 1),
        { year: 100, month: "Leapfest", day: 1 },
    );
    assert.deepEqual(
        calendar.calculateDate({ year: 101, month: "Dawn", day: 30 }, 1),
        { year: 101, month: "Dusk", day: 1 },
    );
    assert.deepEqual(
        calendar.calculateDate({ year: 100, month: "Night", day: 31 }, 1),
        { year: 101, month: "Dawn", day: 1 },
    );
});
