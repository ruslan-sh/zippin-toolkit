import type { ComponentChildren, CSSProperties } from "preact";
import "./flex.scss";
import { getSpacing, Spacing } from "../tokens";

interface FlexProps {
  children: ComponentChildren;
  class?: string;
  direction?: CSSProperties["flexDirection"];
  gap?: Spacing;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: CSSProperties["flexWrap"];
}

export const Flex = ({
  children,
  class: className,
  direction = "row",
  gap = 1,
  align = "stretch",
  justify = "flex-start",
  wrap = "nowrap",
}: FlexProps) => (
  <div
    class={className ? `flex ${className}` : "flex"}
    style={{
      flexDirection: direction,
      gap: getSpacing(gap),
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap,
    }}
  >
    {children}
  </div>
);
