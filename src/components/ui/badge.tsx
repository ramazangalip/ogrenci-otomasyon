import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "success" | "destructive" | "warning" | "outline";
}) {
  const variants = {
    default: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    secondary: "bg-slate-700/50 text-slate-300 border-slate-600/50",
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    destructive: "bg-red-500/20 text-red-300 border-red-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    outline: "border-slate-600 text-slate-300",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
