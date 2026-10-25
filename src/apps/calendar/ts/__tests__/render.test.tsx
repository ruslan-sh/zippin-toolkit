import { act, fireEvent, render, screen } from "@testing-library/preact";
import { beforeEach, expect, it, vi } from "vitest";
import { App } from "../../app";
import { registerCalendarDateSelection } from "../render";
import { writeDateToUrl } from "../url-utils";

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

it("loads the URL date and synchronizes controls after application URL writes", () => {
  window.history.replaceState({}, "", "/calendar#1504/Hammer/1");
  render(<App />);
  expect(screen.getByLabelText<HTMLInputElement>("Year:").value).toBe("1504");
  act(() => writeDateToUrl(1505, "Alturiak", 5));
  expect(screen.getByLabelText<HTMLInputElement>("Year:").value).toBe("1505");
  expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Alturiak");
  expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("5");
});

it.each(["hashchange", "popstate"])("synchronizes controls on %s without adding history entries", (eventName) => {
  render(<App />);
  window.history.replaceState({}, "", "/calendar#1504/Ches/9");
  const historyLength = window.history.length;
  act(() => { window.dispatchEvent(new Event(eventName)); });
  expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Ches");
  expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("9");
  expect(window.history.length).toBe(historyLength);
});

it("selects a rendered day and updates the actual controls, URL and highlight", () => {
  render(<App />);
  registerCalendarDateSelection();
  const day = document.querySelector<HTMLElement>('.calendar__day[data-month="Alturiak"][data-day="5"]');
  if (!day) throw new Error("Missing rendered day");
  fireEvent.click(day);
  expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Alturiak");
  expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("5");
  expect(window.location.hash).toBe("#1500/Alturiak/5");
  expect(document.querySelector<HTMLElement>(".calendar__day--current")?.dataset.day).toBe("5");
});

it("selects a festival through its nested moon symbol and caps the day input", () => {
  render(<App />);
  registerCalendarDateSelection();
  const symbol = document.querySelector<HTMLElement>('[data-month="Midwinter"] .calendar__moon-symbol');
  if (!symbol) throw new Error("Missing festival moon symbol");
  fireEvent.click(symbol);
  expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Midwinter");
  expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("1");
  expect(screen.getByLabelText<HTMLInputElement>("Day:").max).toBe("1");
  expect(window.location.hash).toBe("#1500/Midwinter/1");
});

it("does not add history when clicking the already selected day", () => {
  render(<App />);
  registerCalendarDateSelection();
  const day = document.querySelector<HTMLElement>(".calendar__day--current");
  if (!day) throw new Error("Missing current day");
  const historyLength = window.history.length;
  fireEvent.click(day);
  expect(window.history.length).toBe(historyLength);
});
