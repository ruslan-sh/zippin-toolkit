import "./index.scss";
import { initializeEncounterBuilder } from "./encounter-ui";
import { initializePartyCalculator } from "./party-ui";

initializePartyCalculator(document, initializeEncounterBuilder(document));
