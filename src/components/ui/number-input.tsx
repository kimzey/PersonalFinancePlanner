import * as React from "react";
import { Input } from "@/components/ui/input";

type NumberInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "type" | "value"
> & {
  max?: number;
  min?: number;
  onValueChange: (value: number) => void;
  precision?: number;
  value: number;
};

export function NumberInput({
  max,
  min,
  onBlur,
  onValueChange,
  precision = 2,
  value,
  ...props
}: NumberInputProps) {
  const [draft, setDraft] = React.useState({
    sourceValue: value,
    text: formatNumberInput(value, precision),
  });
  const currentDraft =
    draft.sourceValue === value
      ? draft
      : {
          sourceValue: value,
          text: formatNumberInput(value, precision),
        };

  function commitText(text: string) {
    const parsedValue = parseNumberInput(text);
    if (parsedValue === null) return;

    const nextValue = clamp(parsedValue, min, max);
    setDraft({
      sourceValue: nextValue,
      text,
    });
    onValueChange(nextValue);
  }

  return (
    <Input
      {...props}
      inputMode={props.inputMode ?? "decimal"}
      max={max}
      min={min}
      onBlur={(event) => {
        const parsedValue = parseNumberInput(currentDraft.text);
        const nextValue =
          parsedValue === null ? value : clamp(parsedValue, min, max);

        setDraft({
          sourceValue: nextValue,
          text: formatNumberInput(nextValue, precision),
        });
        onBlur?.(event);
      }}
      onChange={(event) => {
        const nextText = event.target.value;
        setDraft({
          sourceValue: value,
          text: nextText,
        });
        commitText(nextText);
      }}
      type="text"
      value={currentDraft.text}
    />
  );
}

function parseNumberInput(text: string) {
  const normalizedText = text.trim().replaceAll(",", "");

  if (normalizedText === "" || normalizedText === "." || normalizedText === "-") {
    return null;
  }

  const parsedValue = Number(normalizedText);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function formatNumberInput(value: number, precision: number) {
  if (!Number.isFinite(value)) return "0";
  return Number(value.toFixed(precision)).toString();
}

function clamp(value: number, min?: number, max?: number) {
  let nextValue = value;
  if (typeof min === "number") nextValue = Math.max(min, nextValue);
  if (typeof max === "number") nextValue = Math.min(max, nextValue);
  return nextValue;
}
