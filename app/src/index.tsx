import { render } from "preact";
import { App } from "./app";
import "./scss/index.scss";

const root = document.getElementById("app");
if (root) {
  render(<App />, root);
}
