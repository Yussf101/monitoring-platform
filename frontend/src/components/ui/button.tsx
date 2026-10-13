import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] text-sm font-medium leading-[20px] transition-all duration-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4493f8] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0d1117] disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#238636] text-white border border-[rgba(240,246,252,0.1)] shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset] hover:bg-[#2ea043] active:bg-[#238636]",
        primary:
          "bg-[#238636] text-white border border-[rgba(240,246,252,0.1)] shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset] hover:bg-[#2ea043] active:bg-[#238636]",
        destructive:
          "bg-[#212830] text-[#f85149] border border-[#30363d] hover:bg-[#da3633] hover:text-white hover:border-[#da3633] shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]",
        outline:
          "border border-[#30363d] bg-[#212830] text-[#f0f6fc] hover:bg-[#30363d] hover:border-[#8b949e] hover:text-white shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]",
        secondary:
          "bg-[#212830] text-[#f0f6fc] border border-[#30363d] hover:bg-[#30363d] hover:border-[#8b949e] hover:text-white shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]",
        ghost:
          "text-[#7d8590] hover:bg-[rgba(177,186,196,0.12)] hover:text-[#f0f6fc]",
        link: "text-[#4493f8] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 py-[5px]",
        sm: "h-7 px-2.5 py-[3px] text-xs leading-[18px] [&_svg]:size-3.5",
        lg: "h-9 px-4 py-[7px] text-sm leading-[20px]",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
