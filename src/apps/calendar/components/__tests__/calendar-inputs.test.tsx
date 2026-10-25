import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { CalendarInputs } from "../calendar-inputs";
import { Calendar } from "../../ts/calendar";
import { props } from "../../ts/props";
import type { CalendarDate } from "../../ts/types";

const calendar = new Calendar(props);

function setup(date: CalendarDate = { year: 1500, month: "Hammer", day: 21 }) {
  const onDateChange = vi.fn();
  const view = render(<CalendarInputs calendar={calendar} date={date} onDateChange={onDateChange} />);
  return { ...view, onDateChange };
}

describe("CalendarInputs", () => {
  it("displays the supplied date and updates controlled values on rerender", () => {
    const { rerender, onDateChange } = setup();
    expect(screen.getByLabelText<HTMLInputElement>("Year:").value).toBe("1500");
    expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Hammer");
    expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("21");
    rerender(<CalendarInputs calendar={calendar} date={{ year: 1504, month: "Alturiak", day: 5 }} onDateChange={onDateChange} />);
    expect(screen.getByLabelText<HTMLInputElement>("Year:").value).toBe("1504");
    expect(screen.getByLabelText<HTMLSelectElement>("Month:").value).toBe("Alturiak");
    expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("5");
    expect(onDateChange).not.toHaveBeenCalled();
  });

  it("changes the year while preserving the month and day", () => {
    const { onDateChange } = setup();
    fireEvent.input(screen.getByLabelText("Year:"), { target: { value: "1504" } });
    expect(onDateChange).toHaveBeenCalledExactlyOnceWith({ year: 1504, month: "Hammer", day: 21 });
  });

  it("ignores an empty year input", () => {
    const { onDateChange } = setup();
    fireEvent.input(screen.getByLabelText("Year:"), { target: { value: "" } });
    expect(onDateChange).not.toHaveBeenCalled();
  });

  it("clamps the day when changing to a shorter festival month", () => {
    const { onDateChange } = setup();
    fireEvent.change(screen.getByLabelText("Month:"), { target: { value: "Midwinter" } });
    expect(onDateChange).toHaveBeenCalledExactlyOnceWith({ year: 1500, month: "Midwinter", day: 1 });
  });

  it("moves a leap-only date to the first regular month when changing to a non-leap year", () => {
    const { onDateChange } = setup({ year: 1500, month: "Shieldmeet", day: 1 });
    fireEvent.input(screen.getByLabelText("Year:"), { target: { value: "1501" } });
    expect(onDateChange).toHaveBeenCalledExactlyOnceWith({ year: 1501, month: "Hammer", day: 1 });
  });

  it("accepts a day change and caps days at the month length", () => {
    const { onDateChange } = setup();
    fireEvent.input(screen.getByLabelText("Day:"), { target: { value: "35" } });
    expect(onDateChange).toHaveBeenCalledExactlyOnceWith({ year: 1500, month: "Hammer", day: 30 });
  });

  it("adds the entered day count across a year boundary", () => {
    const { onDateChange } = setup({ year: 1500, month: "Nightal", day: 30 });
    fireEvent.input(screen.getByLabelText("Add days:"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onDateChange).toHaveBeenCalledExactlyOnceWith({ year: 1501, month: "Hammer", day: 2 });
  });

  it("hides and restores controls without changing the selected date", () => {
    const { onDateChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByLabelText("Year:")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByLabelText<HTMLInputElement>("Day:").value).toBe("21");
    expect(onDateChange).not.toHaveBeenCalled();
  });
});
