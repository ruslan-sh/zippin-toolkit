import { act, fireEvent, render, screen } from "@testing-library/preact";
import { expect, it, vi } from "vitest";
import { useUrlChange } from "../../hooks/use-url-change";
import { Input } from "../input";
import { Select } from "../select";

it("links input labels to distinct generated IDs and forwards native input events", () => {
  const onInput = vi.fn();
  render(
    <>
      <Input label="First" value="a" onInput={onInput} />
      <Input label="Second" disabled />
    </>,
  );
  const first = screen.getByLabelText<HTMLInputElement>("First");
  const second = screen.getByLabelText<HTMLInputElement>("Second");
  expect(first.id).not.toBe(second.id);
  expect(second.disabled).toBe(true);
  fireEvent.input(first, { target: { value: "updated" } });
  expect(onInput).toHaveBeenCalledOnce();
});

it("preserves a supplied select ID and forwards selection changes", () => {
  const onChange = vi.fn();
  const onValueChange = vi.fn();
  render(
    <Select
      id="month"
      label="Month"
      value="Hammer"
      onChange={onChange}
      onValueChange={onValueChange}
    >
      <option>Hammer</option>
      <option>Alturiak</option>
    </Select>,
  );
  const select = screen.getByLabelText<HTMLSelectElement>("Month");
  expect(select.id).toBe("month");
  expect(select.value).toBe("Hammer");
  fireEvent.change(select, { target: { value: "Alturiak" } });
  expect(onChange).toHaveBeenCalledOnce();
  expect(onValueChange).toHaveBeenCalledExactlyOnceWith("Alturiak");
  expect(select.value).toBe("Alturiak");
});

it("converts integer input values to numbers while preserving bounds", () => {
  const onValueChange = vi.fn();
  render(
    <Input
      type="integer"
      label="Count"
      value={1}
      min={-10}
      max={10}
      onValueChange={onValueChange}
    />,
  );
  const input = screen.getByLabelText<HTMLInputElement>("Count");
  expect(input.type).toBe("number");
  expect(input.step).toBe("1");
  expect(input.min).toBe("-10");
  expect(input.max).toBe("10");
  fireEvent.input(input, { target: { value: "-2" } });
  fireEvent.input(input, { target: { value: "0" } });
  expect(onValueChange.mock.calls).toEqual([[-2], [0]]);
});

it("does not emit empty or fractional integer input values", () => {
  const onValueChange = vi.fn();
  render(
    <Input
      type="integer"
      label="Count"
      value={1}
      onValueChange={onValueChange}
    />,
  );
  const input = screen.getByLabelText("Count");
  fireEvent.input(input, { target: { value: "" } });
  fireEvent.input(input, { target: { value: "1.5" } });
  expect(onValueChange).not.toHaveBeenCalled();
});

it("allows decimal value callbacks for native number inputs", () => {
  const onValueChange = vi.fn();
  render(
    <Input
      type="number"
      label="Amount"
      step="any"
      onValueChange={onValueChange}
    />,
  );
  fireEvent.input(screen.getByLabelText("Amount"), {
    target: { value: "1.5" },
  });
  expect(onValueChange).toHaveBeenCalledExactlyOnceWith(1.5);
});

it("uses the latest URL callback and removes all subscriptions on unmount", () => {
  function Subscriber({ onChange }: { onChange: () => void }) {
    useUrlChange(onChange);
    return null;
  }
  const first = vi.fn();
  const next = vi.fn();
  const { rerender, unmount } = render(<Subscriber onChange={first} />);
  act(() => {
    window.dispatchEvent(new Event("hashchange"));
  });
  expect(first).toHaveBeenCalledOnce();
  rerender(<Subscriber onChange={next} />);
  for (const event of ["hashchange", "popstate", "urlchange"]) {
    act(() => {
      window.dispatchEvent(new Event(event));
    });
  }
  expect(first).toHaveBeenCalledOnce();
  expect(next).toHaveBeenCalledTimes(3);
  act(() => {
    unmount();
  });
  for (const event of ["hashchange", "popstate", "urlchange"]) {
    act(() => {
      window.dispatchEvent(new Event(event));
    });
  }
  expect(next).toHaveBeenCalledTimes(3);
});
