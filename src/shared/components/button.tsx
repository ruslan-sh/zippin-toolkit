import type { FunctionComponent, JSX } from "preact";

type ButtonProps = JSX.IntrinsicElements["button"];

export const Button: FunctionComponent<ButtonProps> = ({ ...buttonProps }) => {
  return <button {...buttonProps}></button>;
};
