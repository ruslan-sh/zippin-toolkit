import { act, fireEvent, render, screen } from "@testing-library/preact";
import { beforeEach, expect, it, vi } from "vitest";
import { App } from "../app";
import { writeDateToUrl } from "../ts/url-utils";

beforeEach(() => {
  window.history.replaceState({}, "", "/calendar");
});

it.each(["#1500/Hammer/NaN", "#NaN/Hammer/1", "?y=Infinity&m=Hammer&d=NaN"])(
  "falls back from invalid numeric URL values without repeated history writes: %s",
  (url) => {
    window.history.replaceState({}, "", `/calendar${url}`);
    const pushState = vi.spyOn(window.history, "pushState");
    try {
      render(<App />);
      act(() => { window.dispatchEvent(new Event("urlchange")); });
      expect(screen.getByLabelText<HTMLInputElement>("Year:").value).toBe("1500");
      expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("1");
      expect(pushState).not.toHaveBeenCalled();
    } finally {
      pushState.mockRestore();
    }
  },
);

it("shows leap-only festival in leap years and removes it when navigating to an ordinary year", () => {
  window.history.replaceState({}, "", "/calendar#1504/Flamerule/2");
  render(<App />);
  expect(document.querySelector("[data-month='Shieldmeet']")).not.toBeNull();
  expect(Array.from(screen.getByLabelText<HTMLSelectElement>("Month:").options).map((option) => option.value)).toContain("Shieldmeet");

  act(() => {
    window.history.replaceState({}, "", "/calendar#1505/Flamerule/2");
    window.dispatchEvent(new Event("popstate"));
  });
  expect(document.querySelector("[data-month='Shieldmeet']")).toBeNull();
  expect(Array.from(screen.getByLabelText<HTMLSelectElement>("Month:").options).map((option) => option.value)).not.toContain("Shieldmeet");
});

it("selects a day through the UI and updates controls, URL, and highlight", () => {
  render(<App />);
  const day = document.querySelector<HTMLElement>('.calendar__day[data-month="Alturiak"][data-day="5"]');
  if (!day) throw new Error("Missing rendered day");
  fireEvent.click(day);
  expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Alturiak");
  expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("5");
  expect(window.location.hash).toBe("#1500/Alturiak/5");
  expect(document.querySelector('.calendar__day[data-month="Alturiak"][data-day="5"]')).toBe(day);
  expect(document.querySelector<HTMLElement>(".calendar__day--current")?.dataset.day).toBe("5");
});

it("selects festivals through their moon symbols and caps the day control", () => {
  render(<App />);
  const symbol = document.querySelector<HTMLElement>("[data-month='Midwinter'] .calendar__moon-symbol");
  if (!symbol) throw new Error("Missing festival moon symbol");
  fireEvent.click(symbol);
  expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Midwinter");
  expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("1");
  expect(screen.getByLabelText<HTMLInputElement>("Day:").max).toBe("1");
  expect(window.location.hash).toBe("#1500/Midwinter/1");
});

it("updates the URL and calendar from date controls and the day calculator", () => {
  render(<App />);
  fireEvent.input(screen.getByLabelText("Year:"), { target: { value: "1501" } });
  fireEvent.change(screen.getByLabelText("Month:"), { target: { value: "Nightal" } });
  fireEvent.input(screen.getByLabelText("Day:"), { target: { value: "30" } });
  expect(window.location.hash).toBe("#1501/Nightal/30");
  expect(document.querySelector<HTMLElement>(".calendar__day--current")?.dataset).toMatchObject({
    year: "1501", month: "Nightal", day: "30",
  });
  fireEvent.input(screen.getByLabelText("Add days:"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(window.location.hash).toBe("#1502/Hammer/2");
  expect(screen.getByLabelText<HTMLInputElement>("Year:").value).toBe("1502");
  expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Hammer");
  expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("2");
  expect(document.querySelector<HTMLElement>(".calendar__day--current")?.dataset).toMatchObject({
    year: "1502", month: "Hammer", day: "2",
  });
});

it("does not add a history entry when the selected date is clicked again", () => {
  render(<App />);
  const currentDay = document.querySelector<HTMLElement>(".calendar__day--current");
  if (!currentDay) throw new Error("Missing selected day");
  const historyLength = window.history.length;
  fireEvent.click(currentDay);
  expect(window.history.length).toBe(historyLength);
});

it.each(["hashchange", "popstate"])("updates controls on application URL writes and %s navigation without history loops", (eventName) => {
  render(<App />);
  act(() => writeDateToUrl(1505, "Alturiak", 5));
  expect(screen.getByLabelText<HTMLInputElement>("Year:").value).toBe("1505");
  expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Alturiak");

  window.history.replaceState({}, "", "/calendar#1504/Ches/9");
  const historyLength = window.history.length;
  act(() => { window.dispatchEvent(new Event(eventName)); });
  expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Ches");
  expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("9");
  expect(window.history.length).toBe(historyLength);
});

it.each([
  ["#1501/NotAMonth/9", "Hammer", "9"],
  ["#1501/Hammer/0", "Hammer", "1"],
  ["#1501/Hammer/99", "Hammer", "30"],
  ["#1501/Shieldmeet/1", "Hammer", "1"],
  ["#1501/%E0%A4%A/3", "Hammer", "3"],
])("normalizes URL date %s at the app boundary", (url, expectedMonth, expectedDay) => {
  window.history.replaceState({}, "", `/calendar${url}`);
  render(<App />);
  expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe(expectedMonth);
  expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe(expectedDay);
});
