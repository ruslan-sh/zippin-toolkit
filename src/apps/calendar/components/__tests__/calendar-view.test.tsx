import { render, screen, within } from "@testing-library/preact";
import { expect, it, vi } from "vitest";
import { CalendarView } from "../calendar-view";
import { Calendar } from "../../ts/calendar";
import { Moon } from "../../ts/moon";
import { props } from "../../ts/props";
import type { CalendarDate } from "../../ts/types";

const calendar = new Calendar(props);
const moon = new Moon(props, calendar);

function renderView(date: CalendarDate) {
  return render(
    <CalendarView calendar={calendar} moon={moon} date={date} onDateSelect={vi.fn()} />,
  );
}

it("renders all regular months, calendar days, and the existing table cell structure declaratively", () => {
  renderView({ year: 1501, month: "Hammer", day: 1 });
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(12);
  expect(screen.getAllByRole("table")).toHaveLength(12);
  expect(document.querySelectorAll(".calendar__day")).toHaveLength(360);
  expect(document.querySelectorAll("table tbody tr")).toHaveLength(36);
  expect(screen.getAllByRole("cell")).toHaveLength(360);
  expect(document.querySelector<HTMLElement>(".calendar__day--current")?.dataset).toMatchObject({
    year: "1501", month: "Hammer", day: "1",
  });
  expect(document.querySelectorAll(".calendar__month-alias")).toHaveLength(12);
});

it("renders moon phase classes and nests festivals under their preceding month", () => {
  renderView({ year: 1372, month: "Hammer", day: 1 });
  const fullMoon = document.querySelector<HTMLElement>(
    '.calendar__day[data-month="Hammer"][data-day="1"]',
  );
  expect(fullMoon?.classList.contains("calendar__day--moon-full")).toBe(true);
  expect(fullMoon?.querySelector(".calendar__moon-symbol")).not.toBeNull();
  const hammer = screen.getByRole("heading", { level: 2, name: "Hammer" }).parentElement;
  if (!hammer) throw new Error("Missing Hammer month container");
  expect(within(hammer).getByRole("heading", { level: 3, name: "Midwinter Festival" })).toBeTruthy();
  expect(document.querySelector("[data-month='Shieldmeet']")).not.toBeNull();
});

