import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-mono leading-none tracking-normal transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-[#388bfd]/40 bg-[#388bfd]/15 text-[#58a6ff] font-medium",
        secondary:
          "border-[#30363d] bg-[#21262d] text-[#848d97] font-medium",
        destructive:
          "border-rose-500/40 bg-rose-500/15 text-rose-400 font-medium",
        success:
          "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-medium",
        warning:
          "border-amber-500/40 bg-amber-500/15 text-amber-400 font-medium",
        info:
          "border-sky-500/40 bg-sky-500/15 text-sky-400 font-medium",
        outline:
          "border-[#30363d] text-[#848d97] bg-transparent",
        counter:
          "border-transparent bg-[#30363d] text-[#e6edf3] font-semibold text-[11px] px-2 py-0.5 tabular-nums",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
