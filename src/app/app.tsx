import { FunctionalComponent } from "preact";
import { ToolCard } from "./components/tool-card";
import { Flex } from "../shared/components/flex";

export const App: FunctionalComponent = () => (
  <>
    <main class="toolkit">
      <h1>Zippin's Toolkit</h1>
      <p>
        A growing collection of focused tools for tabletop role-playing games.
      </p>

      <section aria-labelledby="tools-title">
        <h2 id="tools-title">Available tools</h2>
        <Flex direction="column">
          <ToolCard
            link="apps/calendar/"
            title="Fantasy Calendar"
            icon="calendar_month"
            description="Explore the Calendar of Harptos, festivals, leap days, and moon phases."
          />
          <ToolCard
            link="apps/encounters/"
            title="Encounter Difficulty Calculator"
            icon="casino"
            description="Calculate party XP thresholds and rank a custom encounter."
          />
          <ToolCard
            link="apps/map-editor/"
            title="Map Drawing Tool"
            icon="grid_on"
            description="Paint a color-coded hex map and export it as a PNG image."
          />
        </Flex>
      </section>
    </main>
    <footer>
      <a
        href="https://github.com/ruslan-sh/zippin-toolkit"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on GitHub
      </a>
    </footer>
  </>
);
