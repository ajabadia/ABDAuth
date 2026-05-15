"use client"

import * as React from "react"
import { Search } from "lucide-react"

interface IndustrialSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}

export function IndustrialSearchInput({ value, onChange, placeholder, ariaLabel }: IndustrialSearchInputProps) {
  return (
    <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
        <input 
          type="text" 
          aria-label={ariaLabel}
          placeholder={placeholder} 
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 text-xs pl-10 h-8 text-foreground placeholder:text-muted-foreground/50" 
        />
      </div>
    </div>
  )
}
