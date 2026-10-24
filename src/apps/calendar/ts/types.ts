export interface MoonConfig {
    name: string;
    period: number;
}

export interface AstronomicalConfig {
    daysInYear: number;
    moon: MoonConfig;
}

export interface LeapYearConfig {
    first: number;
    frequency: number;
}

export interface FullMoonConfig {
    year: number;
    day: number;
}

export interface CalendarMonth {
    name: string;
    alias?: string;
    days: number;
    isFestival?: boolean;
    leapDayMode?: "extra-day" | "leap-only";
}

export interface CalendarDay {
    name: string;
    short: string;
}

export interface CalendarConfig {
    yearName: string;
    isMonthsWeeksSynced: boolean;
    springEquinox: number;
    leapYear: LeapYearConfig;
    fullMoon: FullMoonConfig;
    months: CalendarMonth[];
    days: CalendarDay[];
}

export interface AppProps {
    astronomical: AstronomicalConfig;
    calendar: CalendarConfig;
}

export interface MoonProps {
    astronomical: AstronomicalConfig;
    calendar: CalendarConfig;
}

export interface CalendarDate {
    year: number;
    month: string;
    day: number;
}

export enum MoonPhaseState {
    Full = "full",
    New = "new",
    HalfWaning = "half-waning",
    HalfWaxing = "half-waxing",
    None = "none",
}

export type MonthMoonPhases = Partial<Record<number, MoonPhaseState>>;

export interface QueryParams {
    year: number | null;
    month: string | null;
    day: number | null;
}
