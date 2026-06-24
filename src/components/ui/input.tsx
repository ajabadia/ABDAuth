/**
 * @purpose Renderiza un componente de campo de entrada estilizado.
 * @purpose_en Renders a styled input field component.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:0,imports:2,sig:1eb1arg
 * @lastUpdated 2026-06-21T12:05:26.397Z
 */

import * as React from "react"
import { cn } from "@/lib/utils/tailwind"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
