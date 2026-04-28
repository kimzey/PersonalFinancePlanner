import * as React from "react";
import { cn } from "@/lib/utils";

export const Switch = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      className={cn("h-5 w-9 cursor-pointer accent-[var(--primary)]", className)}
      {...props}
    />
  ),
);
Switch.displayName = "Switch";
