import type { FunctionComponent, JSX } from "preact";
import { useId } from "preact/hooks";
import { Flex } from "./flex";

type NativeInputProps = JSX.IntrinsicElements["input"];
type NumberInputProps = Extract<NativeInputProps, { type: "number" }>;

export type InputProps = (
  | (NativeInputProps & { onValueChange?: never })
  | (NumberInputProps & {
      onValueChange: (value: number) => void;
    })
  | (Omit<NumberInputProps, "type"> & {
      type: "integer";
      onValueChange?: (value: number) => void;
    })
) & {
  label?: string;
};

export const Input: FunctionComponent<InputProps> = ({
  label,
  id,
  onInput,
  onValueChange,
  ...inputProps
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isInteger = inputProps.type === "integer";
  const nativeProps: NativeInputProps =
    inputProps.type === "integer"
      ? { ...inputProps, type: "number", step: inputProps.step ?? 1 }
      : inputProps;

  return (
    <Flex gap="half">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        {...nativeProps}
        onInput={(event) => {
          if (onValueChange) {
            const value = event.currentTarget.valueAsNumber;
            if (
              Number.isFinite(value) &&
              (!isInteger || Number.isInteger(value))
            ) {
              onValueChange(value);
            }
          }
          onInput?.(event);
        }}
      />
    </Flex>
  );
};
