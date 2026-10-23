import type { ComponentChildren } from "preact";
import "./card.scss";

interface CardProps {
  children: ComponentChildren;
  class?: string;
  link?: string;
}

export const Card = ({ children, class: className, link }: CardProps) => {
  const classes = className ? `card ${className}` : "card";
  const card = <div class={classes}>{children}</div>;

  return link !== undefined ? (
    <a class="card-link" href={link}>
      {card}
    </a>
  ) : (
    card
  );
};
