import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#f36e21] text-white shadow hover:bg-[#e05e11]",
        secondary:
          "border-transparent bg-[#3a3637] text-white hover:bg-[#4a4647]",
        destructive:
          "border-transparent bg-[#ef4444] text-white shadow hover:bg-[#dc2626]",
        outline: "text-[#e0e0e0] border-[#3a3637]",
        success: "border-transparent bg-[#22c55e] text-white shadow hover:bg-[#16a34a]",
        warning: "border-transparent bg-[#eab308] text-white shadow hover:bg-[#ca8a04]",
        info: "border-transparent bg-[#3b82f6] text-white shadow hover:bg-[#2563eb]",
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
