import type {
    AstronomicalConfig,
    CalendarConfig,
    CalendarDate,
    CalendarMonth,
} from "./types";

export interface CalendarProps {
    astronomical: AstronomicalConfig;
    calendar: CalendarConfig;
}

export class Calendar {
    public constructor(private readonly props: CalendarProps) {}

    public getMonthByName(monthName: string): CalendarMonth {
        const month = this.props.calendar.months.find((calendarMonth) => calendarMonth.name === monthName);
        if (!month) {
            throw new Error(`Month not found: ${monthName}`);
        }
        return month;
    }

    public isLeapYear(yearId: number): boolean {
        const { leapYear } = this.props.calendar;
        return (yearId - leapYear.first) % leapYear.frequency === 0;
    }

    public getMonthDaysInYear(yearId: number, month: CalendarMonth): number {
        if (!month.leapDayMode) {
            return month.days;
        }

        if (month.leapDayMode === "leap-only") {
            return this.isLeapYear(yearId) ? month.days : 0;
        }

        return this.isLeapYear(yearId) ? month.days + 1 : month.days;
    }

    public getDaysSinceYearStart(yearId: number, monthName: string): number {
        const monthIndex = this.props.calendar.months.findIndex((month) => month.name === monthName);
        if (monthIndex < 0) {
            throw new Error(`Month not found: ${monthName}`);
        }

        return this.props.calendar.months.reduce((accumulator, month, index) => {
            if (index < monthIndex) {
                return accumulator + this.getMonthDaysInYear(yearId, month);
            }

            return accumulator;
        }, 0);
    }

    public countLeapYearsBetween(startYearId: number, endYearId: number): number {
        if (startYearId === endYearId) {
            return 0;
        }

        const leapYear = this.props.calendar.leapYear;
        const rangeStart = Math.min(startYearId, endYearId);
        const rangeEnd = Math.max(startYearId, endYearId);

        const firstLeapYearInRange =
            leapYear.first +
            Math.ceil((rangeStart - leapYear.first) / leapYear.frequency) * leapYear.frequency;

        if (firstLeapYearInRange >= rangeEnd) {
            return 0;
        }

        const leapYearsInRange =
            Math.floor((rangeEnd - 1 - firstLeapYearInRange) / leapYear.frequency) + 1;

        return startYearId < endYearId ? leapYearsInRange : -leapYearsInRange;
    }

    public getDayOfYear(yearId: number, monthName: string, dayId: number): number {
        return this.getDaysSinceYearStart(yearId, monthName) + dayId;
    }

    public calculateDate(currentDate: CalendarDate, daysToAdd: number): CalendarDate {
        const currentDayOfYear =
            this.getDaysSinceYearStart(currentDate.year, currentDate.month) + currentDate.day;

        let newDay = currentDayOfYear + daysToAdd;
        let newYear = currentDate.year;
        while (newDay > this.getDaysInYear(newYear)) {
            newDay -= this.getDaysInYear(newYear);
            newYear += 1;
        }

        const months = this.props.calendar.months;
        let newMonth = months[0]?.name;
        let monthIndex = 0;
        while (monthIndex < months.length) {
            const month = months[monthIndex];
            if (!month) {
                throw new Error("Month not found");
            }

            const monthDays = this.getMonthDaysInYear(newYear, month);

            if (monthDays === 0) {
                monthIndex += 1;
                continue;
            }

            if (newDay > monthDays) {
                newDay -= monthDays;
                monthIndex += 1;
                continue;
            }

            newMonth = month.name;
            break;
        }

        if (!newMonth) {
            throw new Error("Month not found");
        }

        return { year: newYear, month: newMonth, day: newDay };
    }

    private getDaysInYear(yearId: number): number {
        return this.isLeapYear(yearId)
            ? Math.ceil(this.props.astronomical.daysInYear)
            : Math.floor(this.props.astronomical.daysInYear);
    }
}
