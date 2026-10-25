import { render } from "preact";
import { App } from "./app";
import "./scss/index.scss";
import { registerCalendarDateSelection } from "./ts/render";

const root = document.getElementById("app");
if (root) {
  render(<App />, root);
}
registerCalendarDateSelection();
