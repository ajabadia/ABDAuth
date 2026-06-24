/**
 * @purpose Renderiza un componente etiqueta estilizado.
 * @purpose_en Renders a styled label component.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:0,imports:2,sig:q8nn3h
 * @lastUpdated 2026-06-23T22:40:46.577Z
 */

import * as React from "react"
import { cn } from "@/lib/utils/tailwind"

const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<"label">>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
