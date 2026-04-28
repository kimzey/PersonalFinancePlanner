"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { parseCalculatorInput } from "@/lib/calculators";
import { cn } from "@/lib/utils";

type InlineCalculatorInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "type" | "value"
> & {
  value: number;
  onValueChange: (value: number) => void;
  precision?: number;
};

export function InlineCalculatorInput({
  className,
  onBlur,
  onKeyDown,
  onValueChange,
  precision = 2,
  value,
  ...props
}: InlineCalculatorInputProps) {
  const [draft, setDraft] = useState({
    sourceValue: value,
    text: formatInputValue(value, precision),
  });
  const [error, setError] = useState("");
  const currentDraft =
    draft.sourceValue === value
      ? draft
      : {
          sourceValue: value,
          text: formatInputValue(value, precision),
        };

  function commitValue() {
    try {
      const parsedValue = Math.max(0, parseCalculatorInput(currentDraft.text));
      setError("");
      setDraft({
        sourceValue: parsedValue,
        text: formatInputValue(parsedValue, precision),
      });
      onValueChange(parsedValue);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "สูตรไม่ถูกต้อง");
    }
  }

  return (
    <div className="grid gap-1">
      <Input
        {...props}
        aria-invalid={error.length > 0}
        className={cn(error && "border-[var(--destructive)]", className)}
        inputMode="decimal"
        onBlur={(event) => {
          commitValue();
          onBlur?.(event);
        }}
        onChange={(event) => {
          setDraft({
            sourceValue: value,
            text: event.target.value,
          });
          if (error) setError("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }

          onKeyDown?.(event);
        }}
        value={currentDraft.text}
      />
      {error ? (
        <span className="text-xs text-[var(--destructive)]">{error}</span>
      ) : null}
    </div>
  );
}

function formatInputValue(value: number, precision: number) {
  if (!Number.isFinite(value)) return "0";
  return Number(value.toFixed(precision)).toString();
}
