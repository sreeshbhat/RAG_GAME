import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-400",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
