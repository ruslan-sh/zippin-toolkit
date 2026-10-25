import { afterEach } from "vitest";
import { act, cleanup } from "@testing-library/preact";

afterEach(() => {
  act(() => { cleanup(); });
});
