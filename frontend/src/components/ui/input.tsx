import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-[6px] border border-[#30363d] bg-[#0d1117] px-3 py-1 text-xs text-[#e6edf3] placeholder:text-[#6e7681] focus-visible:outline-none focus-visible:border-[#2f81f7] focus-visible:ring-2 focus-visible:ring-[#2f81f7]/30 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-inner",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
