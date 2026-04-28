import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-transparent bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}
