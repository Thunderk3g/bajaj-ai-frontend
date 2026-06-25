import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Lift + brand border on hover (for interactive tiles). */
  interactive?: boolean;
}

/** Base white surface tile with a hairline border and soft elevation. */
export function Card({ children, interactive = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-line rounded-2xl shadow-e1",
        interactive &&
          "transition-all duration-200 hover:-translate-y-1 hover:shadow-e3 hover:border-brand/40",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
