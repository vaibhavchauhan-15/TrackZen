"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  error = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            "bg-bg-surface border-border hover:bg-bg-elevated hover:border-purple-400/50",
            "transition-all duration-200 group",
            !value && "text-muted-foreground",
            error && "border-red-500/50 hover:border-red-400/50",
            className
          )}
        >
          <CalendarIcon className={cn(
            "mr-2 h-4 w-4 transition-colors duration-200",
            "group-hover:text-purple-400",
            error && "text-red-400"
          )} />
          {value ? (
            <span className="text-text-primary">{format(value, "PPP")}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          initialFocus
        />
        <div className="flex items-center justify-between px-3 pb-3 border-t border-border/50 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange?.(undefined)
              setOpen(false)
            }}
            className="text-xs hover:text-red-400 hover:bg-red-500/10"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange?.(new Date())
              setOpen(false)
            }}
            className="text-xs hover:text-purple-400 hover:bg-purple-500/10"
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
