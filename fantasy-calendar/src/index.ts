import "./scss/index.scss";
import { registerCalendarDateSelection, renderInput } from "./ts/render";
import { readDateFromUrl } from "./ts/url-utils";

const { year, month, day } = readDateFromUrl();
registerCalendarDateSelection();
renderInput(year, month, day);
