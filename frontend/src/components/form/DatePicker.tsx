"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { Modifiers } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarMonthYearSelects, calendarOverlayClass } from "@/components/form/calendar-month-year-selects"
import { cn } from "@/lib/utils"

export type DatePickerProps = {
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
  /** Inclusive min calendar day `YYYY-MM-DD`. */
  min?: string
  /** Inclusive max calendar day `YYYY-MM-DD`. */
  max?: string
  /** Earliest year in the year select (default 1940, or year of `min`). */
  fromYear?: number
  /** Latest year in the year select (default current year + 5, or year of `max`). */
  toYear?: number
}

function parseDateOnly(raw: string | undefined): Date | undefined {
  if (!raw) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number)
    const date = new Date(y!, m! - 1, d!)
    return isValid(date) ? date : undefined
  }
  const parsed = parseISO(raw)
  return isValid(parsed) ? parsed : undefined
}

/**
 * Day calendar rendered in-page (no Popover portal).
 * Portalled UI inside a Dialog is inert — clicks never reach the days.
 */
export function DatePicker({
  value = "",
  onChange,
  onBlur,
  disabled = false,
  placeholder = "اختر التاريخ",
  className,
  id,
  min,
  max,
  fromYear,
  toYear,
}: DatePickerProps) {
  const selectedDate = React.useMemo(() => parseDateOnly(value), [value])
  const minDate = React.useMemo(() => parseDateOnly(min), [min])
  const maxDate = React.useMemo(() => parseDateOnly(max), [max])
  const now = new Date()

  const startYear = fromYear ?? minDate?.getFullYear() ?? 1940
  const endYear = toYear ?? maxDate?.getFullYear() ?? now.getFullYear() + 5

  const years = React.useMemo(() => {
    const list: number[] = []
    for (let y = endYear; y >= startYear; y--) list.push(y)
    return list
  }, [startYear, endYear])

  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const [month, setMonth] = React.useState<Date>(
    () => selectedDate ?? maxDate ?? now,
  )

  function closePanel() {
    setOpen(false)
    onBlur?.()
  }

  function openPanel() {
    setMonth(selectedDate ?? maxDate ?? now)
    setOpen(true)
  }

  React.useEffect(() => {
    if (!open) return
    function onDoc(e: PointerEvent) {
      const el = e.target as HTMLElement | null
      if (!el) return
      if (rootRef.current?.contains(el)) return
      closePanel()
    }
    document.addEventListener("pointerdown", onDoc)
    return () => document.removeEventListener("pointerdown", onDoc)
  }, [open])

  function setViewMonth(next: Date) {
    let d = next
    if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) {
      d = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    }
    if (maxDate) {
      const maxStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
      if (d > maxStart) d = maxStart
    }
    setMonth(d)
  }

  function handleDayClick(date: Date, modifiers: Modifiers) {
    if (modifiers.disabled) return
    onChange?.(format(date, "yyyy-MM-dd"))
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <Button
        id={id}
        variant="outline"
        type="button"
        disabled={disabled}
        className={cn(
          "h-12 w-full justify-start rounded-[6px] border-[#d6d6d6] bg-white text-start font-normal hover:border-neutral-300",
          !selectedDate && "text-muted-foreground",
          className,
        )}
        onClick={() => (open ? closePanel() : openPanel())}
      >
        <CalendarIcon className="me-2 h-4 w-4 shrink-0 opacity-70" />
        <span className="truncate tabular-nums">
          {selectedDate ? format(selectedDate, "yyyy-MM-dd") : placeholder}
        </span>
      </Button>

      {open ? (
        <div
          className={calendarOverlayClass}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <CalendarMonthYearSelects
            month={month}
            years={years}
            onViewMonth={setViewMonth}
          />
          <div className="flex w-full justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              month={month}
              onMonthChange={setViewMonth}
              captionLayout="label"
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              onSelect={() => undefined}
              onDayClick={handleDayClick}
              className="pointer-events-auto [--cell-size:--spacing(8)] p-0"
              classNames={{
                month_caption: "hidden",
                nav: "hidden",
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default DatePicker
