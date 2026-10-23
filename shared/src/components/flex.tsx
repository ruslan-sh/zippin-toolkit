import type { ComponentChildren, CSSProperties } from "preact";
import "./flex.scss";

interface FlexProps {
  children: ComponentChildren;
  class?: string;
  direction?: CSSProperties["flexDirection"];
  gap?: CSSProperties["gap"];
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: CSSProperties["flexWrap"];
}

export const Flex = ({
  children,
  class: className,
  direction = "row",
  gap = "1rem",
  align = "stretch",
  justify = "flex-start",
  wrap = "nowrap",
}: FlexProps) => (
  <div
    class={className ? `flex ${className}` : "flex"}
    style={{
      flexDirection: direction,
      gap,
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap,
    }}
  >
    {children}
  </div>
);
