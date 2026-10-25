import type { FunctionComponent, JSX } from "preact";
import { useId } from "preact/hooks";
import { Flex } from "./flex";

type SelectProps = JSX.IntrinsicElements["select"] & {
  label?: string;
  onValueChange?: (value: string) => void;
};

export const Select: FunctionComponent<SelectProps> = ({
  label,
  id,
  children,
  onChange,
  onValueChange,
  ...selectProps
}) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Flex gap="half">
      {label && <label htmlFor={selectId}>{label}</label>}
      <select
        {...selectProps}
        id={selectId}
        onChange={(event) => {
          onValueChange?.(event.currentTarget.value);
          onChange?.(event);
        }}
      >
        {children}
      </select>
    </Flex>
  );
};
