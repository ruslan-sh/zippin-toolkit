import { Calendar } from "./calendar";
import { MoonPhaseState } from "./types";
import type { MonthMoonPhases, MoonProps } from "./types";

class MoonWindow {
    public static readonly Full = 0.025;

    public static readonly New = 0.025;

    public static readonly HalfLowerWaning = 0.225;

    public static readonly HalfUpperWaning = 0.275;

    public static readonly HalfLowerWaxing = 0.725;

    public static readonly HalfUpperWaxing = 0.775;
}

export class Moon {
    public constructor(
        private readonly props: MoonProps,
        private readonly calendar: Calendar,
    ) {}

    public normalizeMoonCyclePosition(cyclePos: number): number {
        if (cyclePos >= 0 && cyclePos < 1) {
            return cyclePos;
        }

        if (cyclePos === 1) {
            return 0;
        }

        return ((cyclePos % 1) + 1) % 1;
    }

    public advanceMoonCyclePosition(cyclePos: number): number {
        const dailyStep = 1 / this.props.astronomical.moon.period;
        return this.normalizeMoonCyclePosition(cyclePos + dailyStep);
    }

    public classifyMoonPhase(cyclePos: number): MoonPhaseState {
        const normalizedCyclePos = this.normalizeMoonCyclePosition(cyclePos);
        const newMoonLowerBoundary = 0.5 - MoonWindow.New;
        const newMoonUpperBoundary = 0.5 + MoonWindow.New;

        if (
            normalizedCyclePos < MoonWindow.Full ||
            normalizedCyclePos > 1 - MoonWindow.Full
        ) {
            return MoonPhaseState.Full;
        }

        if (
            normalizedCyclePos >= newMoonLowerBoundary &&
            normalizedCyclePos <= newMoonUpperBoundary
        ) {
            return MoonPhaseState.New;
        }

        if (
            normalizedCyclePos > MoonWindow.HalfLowerWaning &&
            normalizedCyclePos <= MoonWindow.HalfUpperWaning
        ) {
            return MoonPhaseState.HalfWaning;
        }

        if (
            normalizedCyclePos > MoonWindow.HalfLowerWaxing &&
            normalizedCyclePos <= MoonWindow.HalfUpperWaxing
        ) {
            return MoonPhaseState.HalfWaxing;
        }

        return MoonPhaseState.None;
    }

    public getDaysOffsetFromFullMoon(yearId: number, monthName: string, dayId: number): number {
        const { fullMoon } = this.props.calendar;
        const baseYearDays = Math.floor(this.props.astronomical.daysInYear);

        return (
            this.calendar.getDayOfYear(yearId, monthName, dayId) -
            fullMoon.day +
            (yearId - fullMoon.year) * baseYearDays +
            this.calendar.countLeapYearsBetween(fullMoon.year, yearId)
        );
    }

    public getMoonCyclePosition(yearId: number, monthName: string, dayId: number): number {
        const daysOffset = this.getDaysOffsetFromFullMoon(yearId, monthName, dayId);
        return this.normalizeMoonCyclePosition(daysOffset / this.props.astronomical.moon.period);
    }

    public getMonthMoonPhases(yearId: number, monthName: string): MonthMoonPhases {
        const month = this.calendar.getMonthByName(monthName);
        const monthMoonPhases: MonthMoonPhases = {};
        const monthDays = this.calendar.getMonthDaysInYear(yearId, month);

        let cyclePos = this.getMoonCyclePosition(yearId, monthName, 1);
        for (let dayId = 1; dayId <= monthDays; dayId += 1) {
            const moonPhase = this.classifyMoonPhase(cyclePos);

            if (moonPhase !== MoonPhaseState.None) {
                monthMoonPhases[dayId] = moonPhase;
            }

            cyclePos = this.advanceMoonCyclePosition(cyclePos);
        }

        return monthMoonPhases;
    }
}
