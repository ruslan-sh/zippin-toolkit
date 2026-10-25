import { props } from "./props";
import { Calendar } from "./calendar";
import { Moon } from "./moon";
import { writeDateToUrl } from "./url-utils";
import { MoonPhaseState } from "./types";
import type { CalendarDate, MonthMoonPhases } from "./types";

const calendar = new Calendar({
    calendar: props.calendar,
    astronomical: props.astronomical,
});
const moon = new Moon(props, calendar);

function getRequiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing required element: ${id}`);
    }
    return element as T;
}

function renderMoonPhase(
    moonPhases: MonthMoonPhases,
    dayId: number,
    element: HTMLElement,
): void {
    switch (moonPhases[dayId]) {
        case MoonPhaseState.Full:
            element.classList.add("calendar__day--moon-full");
            break;
        case MoonPhaseState.New:
            element.classList.add("calendar__day--moon-new");
            break;
        case MoonPhaseState.HalfWaning:
            element.classList.add("calendar__day--moon-half-waning");
            break;
        case MoonPhaseState.HalfWaxing:
            element.classList.add("calendar__day--moon-half-waxing");
            break;
        default:
            break;
    }

    const moonSymbol = document.createElement("span");
    moonSymbol.classList.add("calendar__moon-symbol");
    element.appendChild(moonSymbol);
}

function setInteractiveDateTarget(
    element: HTMLElement,
    yearId: number,
    monthName: string,
    dayId: number,
): void {
    element.dataset.year = String(yearId);
    element.dataset.month = monthName;
    element.dataset.day = String(dayId);
}

function readInteractiveDateTarget(element: HTMLElement): CalendarDate | null {
    const { year, month, day } = element.dataset;
    if (!year || !month || !day) {
        return null;
    }

    return {
        year: Number(year),
        month,
        day: Number(day),
    };
}

export function renderSelectedDate(date: CalendarDate): void {
    renderYear(date);
    writeDateToUrl(date.year, date.month, date.day);
}

function selectDate(date: CalendarDate): void {
    writeDateToUrl(date.year, date.month, date.day);
}

export function registerCalendarDateSelection(): void {
    getRequiredElement<HTMLDivElement>("calendarContainer").onclick = (
        event: MouseEvent,
    ) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const interactiveDateElement = target.closest<HTMLElement>(
            "[data-year][data-month][data-day]",
        );
        if (!interactiveDateElement) {
            return;
        }

        const date = readInteractiveDateTarget(interactiveDateElement);
        if (!date) {
            return;
        }

        selectDate(date);
    };
}

function renderMonth(
    yearId: number,
    monthName: string,
    currentDay: number,
): HTMLDivElement {
    function calculateFirstDay(): number {
        return 0;
    }

    function renderWeek(
        tbody: HTMLTableSectionElement,
        dayIndex: number,
        firstDay: number,
        weekLength: number,
        daysInMonth: number,
        moonPhases: MonthMoonPhases,
    ): number {
        const tr = document.createElement("tr");
        for (let dayOffset = 0; dayOffset < weekLength; dayOffset += 1) {
            const td = document.createElement("td");
            if (dayIndex === 0 && dayOffset < firstDay) {
                td.textContent = "";
                tr.appendChild(td);
                continue;
            }

            if (dayIndex >= daysInMonth) {
                td.textContent = "";
                tr.appendChild(td);
                continue;
            }

            dayIndex += 1;
            td.textContent = String(dayIndex);
            td.classList.add("calendar__day");
            setInteractiveDateTarget(td, yearId, monthName, dayIndex);
            if (dayIndex === currentDay) {
                td.classList.add("calendar__day--current");
            }

            renderMoonPhase(moonPhases, dayIndex, td);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
        return dayIndex;
    }

    const month = calendar.getMonthByName(monthName);
    const daysInMonth = calendar.getDaysInMonth(yearId, month);
    const moonPhases = moon.getMonthMoonPhases(yearId, monthName);

    const container = document.createElement("div");
    container.classList.add("calendar__month");
    const monthHeader = document.createElement("h2");
    monthHeader.textContent = month.name;
    container.appendChild(monthHeader);

    const monthAlias = document.createElement("p");
    monthAlias.classList.add("calendar__month-alias");
    monthAlias.textContent = month.alias ?? "";
    container.appendChild(monthAlias);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    const headerRow = document.createElement("tr");
    for (const day of props.calendar.days) {
        const th = document.createElement("th");
        th.textContent = day.short;
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);

    const firstDay = calculateFirstDay();
    let dayIndex = 0;
    while (dayIndex < daysInMonth) {
        dayIndex = renderWeek(
            tbody,
            dayIndex,
            firstDay,
            props.calendar.days.length,
            daysInMonth,
            moonPhases,
        );
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);

    return container;
}

function renderFestival(
    yearId: number,
    festivalName: string,
    currentDay: number,
): HTMLDivElement | null {
    const festival = calendar.getMonthByName(festivalName);
    if (festival.leapDayMode === "leap-only" && !calendar.isLeapYear(yearId)) {
        return null;
    }

    const container = document.createElement("div");
    container.classList.add("calendar__festival");

    const monthHeader = document.createElement("h3");
    monthHeader.classList.add("calendar__festival-title");
    monthHeader.textContent = `${festival.name} Festival`;
    setInteractiveDateTarget(monthHeader, yearId, festivalName, 1);
    if (currentDay === 1) {
        monthHeader.classList.add("calendar__festival-title--current");
    }

    const moonPhases = moon.getMonthMoonPhases(yearId, festivalName);
    renderMoonPhase(moonPhases, 1, monthHeader);

    container.appendChild(monthHeader);
    return container;
}

function renderYear(currentDate: CalendarDate): void {
    const {
        year: currentYear,
        month: currentMonth,
        day: currentDay,
    } = currentDate;
    const container = getRequiredElement<HTMLDivElement>("calendarContainer");
    container.classList.add("calendar");
    container.innerHTML = "";

    const yearHeader = document.createElement("h1");
    yearHeader.classList.add("calendar__year");
    yearHeader.textContent = `${currentYear} ${props.calendar.yearName}`;
    container.appendChild(yearHeader);

    const monthsContainer = document.createElement("div");
    monthsContainer.classList.add("calendar__months");

    let lastMonthContainer: HTMLDivElement | null = null;
    for (const month of props.calendar.months) {
        const currentDayOfMonth = month.name === currentMonth ? currentDay : 0;
        if (month.isFestival) {
            const festivalElement = renderFestival(
                currentYear,
                month.name,
                currentDayOfMonth,
            );
            if (festivalElement && lastMonthContainer) {
                lastMonthContainer.appendChild(festivalElement);
            }
            continue;
        }

        lastMonthContainer = renderMonth(
            currentYear,
            month.name,
            currentDayOfMonth,
        );
        monthsContainer.appendChild(lastMonthContainer);
    }

    container.appendChild(monthsContainer);
}
