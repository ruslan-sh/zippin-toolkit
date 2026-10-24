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

interface CalendarControls {
    container: HTMLDivElement;
    yearInput: HTMLInputElement;
    monthInput: HTMLSelectElement;
    dayInput: HTMLInputElement;
}

let calendarControls: CalendarControls | null = null;

function getRequiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing required element: ${id}`);
    }
    return element as T;
}

function getCalendarControls(): CalendarControls {
    if (!calendarControls) {
        throw new Error("Calendar controls have not been rendered");
    }

    return calendarControls;
}

function renderMoonPhase(moonPhases: MonthMoonPhases, dayId: number, element: HTMLElement): void {
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

function readInteractiveDateTarget(
    element: HTMLElement,
): CalendarDate | null {
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

function syncDayInputState(monthName: string): void {
    const month = calendar.getMonthByName(monthName);
    const { dayInput } = getCalendarControls();
    dayInput.disabled = Boolean(month.isFestival);
    if (month.isFestival) {
        dayInput.value = "1";
    }
}

function renderSelectedDate(): void {
    const { yearInput, monthInput, dayInput } = getCalendarControls();

    const year = Number(yearInput.value);
    const month = monthInput.value;
    const day = Number(dayInput.value);

    renderYear(year, month, day);
    writeDateToUrl(year, month, day);
}

function selectDate(date: CalendarDate): void {
    const { yearInput, monthInput, dayInput } = getCalendarControls();

    const currentSelection: CalendarDate = {
        year: Number(yearInput.value),
        month: monthInput.value,
        day: Number(dayInput.value),
    };

    if (
        currentSelection.year === date.year &&
        currentSelection.month === date.month &&
        currentSelection.day === date.day
    ) {
        return;
    }

    yearInput.value = String(date.year);
    monthInput.value = date.month;
    dayInput.value = String(date.day);
    syncDayInputState(date.month);
    renderSelectedDate();
}

export function registerCalendarDateSelection(): void {
    getRequiredElement<HTMLDivElement>("calendarContainer").onclick = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const interactiveDateElement = target.closest<HTMLElement>("[data-year][data-month][data-day]");
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

function renderMonth(yearId: number, monthName: string, currentDay: number): HTMLDivElement {
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
    const daysInMonth = calendar.getMonthDaysInYear(yearId, month);
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

function renderFestival(yearId: number, festivalName: string, currentDay: number): HTMLDivElement | null {
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

function renderYear(yearId: number, currentMonth: string, currentDay: number): void {
    const container = getRequiredElement<HTMLDivElement>("calendarContainer");
    container.classList.add("calendar");
    container.innerHTML = "";

    const yearHeader = document.createElement("h1");
    yearHeader.classList.add("calendar__year");
    yearHeader.textContent = `${yearId} ${props.calendar.yearName}`;
    container.appendChild(yearHeader);

    const monthsContainer = document.createElement("div");
    monthsContainer.classList.add("calendar__months");

    let lastMonthContainer: HTMLDivElement | null = null;
    for (const month of props.calendar.months) {
        const currentDayOfMonth = month.name === currentMonth ? currentDay : 0;
        if (month.isFestival) {
            const festivalElement = renderFestival(yearId, month.name, currentDayOfMonth);
            if (festivalElement && lastMonthContainer) {
                lastMonthContainer.appendChild(festivalElement);
            }
            continue;
        }

        lastMonthContainer = renderMonth(yearId, month.name, currentDayOfMonth);
        monthsContainer.appendChild(lastMonthContainer);
    }

    container.appendChild(monthsContainer);
}

export function renderInput(
    initialYear: number | null,
    initialMonth: string | null,
    initialDay: number | null
): void {
    const container = getRequiredElement<HTMLDivElement>("inputContainer");
    container.classList.add("calendar-controls");
    container.innerHTML = "";

    const yearInputContainer = document.createElement("div");
    yearInputContainer.classList.add("calendar-controls__group");
    yearInputContainer.textContent = "Year: ";
    const yearInput = document.createElement("input");
    yearInput.type = "number";
    yearInput.id = "yearInput";
    yearInput.placeholder = "Enter year";
    yearInput.value = String(initialYear ?? 1500);
    yearInputContainer.appendChild(yearInput);
    container.appendChild(yearInputContainer);

    yearInput.onchange = () => {
        const yearValue = Number(yearInput.value);
        const monthInput = getRequiredElement<HTMLSelectElement>("monthInput");
        monthInput
            .querySelectorAll<HTMLOptionElement>(".calendar-controls__month-option--leap-only")
            .forEach((option) => {
                option.disabled = !calendar.isLeapYear(yearValue);
            });
        syncDayInputState(monthInput.value);
        renderSelectedDate();
    };

    const monthInputContainer = document.createElement("div");
    monthInputContainer.classList.add("calendar-controls__group");
    monthInputContainer.textContent = "Month: ";
    const monthInput = document.createElement("select");
    monthInput.id = "monthInput";
    for (const month of props.calendar.months) {
        const option = document.createElement("option");
        option.value = month.name;
        option.textContent = `${month.isFestival ? "[Day] " : ""}${month.name}`;
        if (month.leapDayMode === "leap-only") {
            option.classList.add("calendar-controls__month-option--leap-only");
        }
        monthInput.appendChild(option);
    }

    if (initialMonth) {
        monthInput.value = initialMonth;
    }

    monthInputContainer.appendChild(monthInput);
    container.appendChild(monthInputContainer);

    monthInput.onchange = () => {
        syncDayInputState(monthInput.value);
        renderSelectedDate();
    };

    const dayInputContainer = document.createElement("div");
    dayInputContainer.classList.add("calendar-controls__group");
    dayInputContainer.textContent = "Day: ";
    const dayInput = document.createElement("input");
    dayInput.type = "number";
    dayInput.id = "dayInput";
    dayInput.placeholder = "Enter day";
    dayInput.value = String(initialDay ?? 1);
    dayInputContainer.appendChild(dayInput);
    container.appendChild(dayInputContainer);

    calendarControls = {
        container,
        yearInput,
        monthInput,
        dayInput,
    };

    dayInput.onchange = renderSelectedDate;

    const calculatorContainer = document.createElement("div");
    calculatorContainer.classList.add("calendar-controls__group");
    calculatorContainer.textContent = "Add days: ";

    const calculatorInputContainer = document.createElement("span");
    const calculatorInput = document.createElement("input");
    calculatorInput.type = "number";
    calculatorInput.id = "calculatorInput";
    calculatorInput.value = "0";
    calculatorInputContainer.appendChild(calculatorInput);

    const calculatorButton = document.createElement("button");
    calculatorButton.textContent = "Add";
    calculatorButton.onclick = () => {
        const { yearInput, monthInput, dayInput } = getCalendarControls();
        const currentDate: CalendarDate = {
            year: Number(yearInput.value),
            month: monthInput.value,
            day: Number(dayInput.value),
        };

        const newDate = calendar.calculateDate(currentDate, Number(calculatorInput.value));
        yearInput.value = String(newDate.year);
        monthInput.value = newDate.month;
        dayInput.value = String(newDate.day);
        renderSelectedDate();
    };

    calculatorInputContainer.appendChild(calculatorButton);
    calculatorInputContainer.classList.add("calendar-controls__calculator-group");
    calculatorContainer.appendChild(calculatorInputContainer);
    container.appendChild(calculatorContainer);

    const hideInputButton = document.createElement("span");
    hideInputButton.classList.add("material-icons", "calendar-controls__toggle");
    hideInputButton.onclick = () => {
        getCalendarControls().container.classList.toggle("calendar-controls--collapsed");
    };
    container.appendChild(hideInputButton);

    syncDayInputState(monthInput.value);
    renderSelectedDate();
}
