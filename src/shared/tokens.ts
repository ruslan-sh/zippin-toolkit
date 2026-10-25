export type IconName = "calendar_month" | "map" | "casino" | "grid_on";

export type Spacing = 0 | "half" | 1 | 2 | 3 | 4 | 6 | 8 | 12;

export function getSpacing(spacing: Spacing): string {
    if (spacing == 0) return "0";
    return `var(--space-${spacing})`;
}
