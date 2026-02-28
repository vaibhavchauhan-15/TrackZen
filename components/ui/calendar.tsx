"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks={true}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 min-h-[280px]",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-text-primary",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 text-muted-foreground hover:text-text-primary",
          "inline-flex items-center justify-center rounded-md transition-all duration-200",
          "hover:bg-purple-500/20 hover:scale-110 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "h-9 w-9",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          "[&:has([aria-selected].day-outside)]:bg-purple-500/10",
          "[&:has([aria-selected])]:bg-purple-500/10",
          "first:[&:has([aria-selected])]:rounded-l-md",
          "last:[&:has([aria-selected])]:rounded-r-md"
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal",
          "inline-flex items-center justify-center rounded-md transition-all duration-200",
          "hover:bg-purple-500/20 hover:text-purple-300 hover:scale-110",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50",
          "aria-selected:opacity-100 cursor-pointer"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-purple-500 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-500 focus:text-white",
        day_today: "bg-purple-500/20 text-purple-300 font-semibold ring-1 ring-purple-500/50",
        day_outside:
          "day-outside text-muted-foreground/50 aria-selected:bg-purple-500/10 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent hover:scale-100",
        day_range_middle:
          "aria-selected:bg-purple-500/10 aria-selected:text-text-primary",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
