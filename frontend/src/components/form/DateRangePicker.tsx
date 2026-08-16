"use client"

import * as React from "react"
import { format, isValid, parseISO, startOfDay } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange, Modifiers } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  CalendarMonthYearSelects,
  MONTHS_AR,
  calendarOverlayClass,
} from "@/components/form/calendar-month-year-selects"
import { cn } from "@/lib/utils"

export type DateRangeValue = {
  from: string
  to: string
}

export type DateRangePickerProps = {
  from?: string
  to?: string
  onChange?: (value: DateRangeValue) => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
  min?: string
  max?: string
  fromYear?: number
  toYear?: number
  hint?: string
  showThisMonth?: boolean
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

function ymd(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

function formatDayAr(date: Date): string {
  return `${date.getDate()} ${MONTHS_AR[date.getMonth()]} ${date.getFullYear()}`
}

function formatRangeLabel(from?: Date, to?: Date): string | null {
  if (!from) return null
  if (!to || ymd(from) === ymd(to)) return formatDayAr(from)
  if (from.getFullYear() === to.getFullYear()) {
    return `${from.getDate()} ${MONTHS_AR[from.getMonth()]} – ${to.getDate()} ${MONTHS_AR[to.getMonth()]} ${to.getFullYear()}`
  }
  return `${formatDayAr(from)} – ${formatDayAr(to)}`
}

/**
 * Range calendar rendered in-page (no Popover portal).
 * Portalled UI inside a Dialog is inert — clicks never reach the days.
 */
export function DateRangePicker({
  from = "",
  to = "",
  onChange,
  onBlur,
  disabled = false,
  placeholder = "اختر فترة الإجازة",
  className,
  id,
  min,
  max,
  fromYear,
  toYear,
  hint = "اختر يوم البداية ثم يوم النهاية. نفس اليوم = يوم واحد.",
  showThisMonth = false,
}: DateRangePickerProps) {
  const fromDate = React.useMemo(() => parseDateOnly(from), [from])
  const toDate = React.useMemo(() => parseDateOnly(to), [to])
  const minDate = React.useMemo(() => parseDateOnly(min), [min])
  const maxDate = React.useMemo(() => parseDateOnly(max), [max])
  const now = new Date()

  const startYear = fromYear ?? minDate?.getFullYear() ?? now.getFullYear() - 5
  const endYear = toYear ?? maxDate?.getFullYear() ?? now.getFullYear() + 5
  const years = React.useMemo(() => {
    const list: number[] = []
    for (let y = endYear; y >= startYear; y--) list.push(y)
    return list
  }, [startYear, endYear])

  const [open, setOpen] = React.useState(false)
  const pickingEnd = React.useRef(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const [month, setMonth] = React.useState<Date>(
    () => fromDate ?? minDate ?? startOfDay(now),
  )

  const selected: DateRange | undefined = fromDate
    ? { from: fromDate, to: toDate }
    : undefined

  const [draft, setDraft] = React.useState<DateRange | undefined>(selected)
  const draftRef = React.useRef(draft)
  draftRef.current = draft

  function emit(nextFrom?: Date, nextTo?: Date) {
    onChange?.({
      from: nextFrom ? ymd(nextFrom) : "",
      to: nextTo ? ymd(nextTo) : nextFrom ? ymd(nextFrom) : "",
    })
  }

  function closePanel(commitSingle: boolean) {
    if (
      commitSingle &&
      pickingEnd.current &&
      draftRef.current?.from &&
      !draftRef.current.to
    ) {
      emit(draftRef.current.from, draftRef.current.from)
    }
    pickingEnd.current = false
    setOpen(false)
    onBlur?.()
  }

  function openPanel() {
    pickingEnd.current = false
    setDraft(selected)
    setMonth(fromDate ?? minDate ?? startOfDay(now))
    setOpen(true)
  }

  React.useEffect(() => {
    if (!open) return
    function onDoc(e: PointerEvent) {
      const el = e.target as HTMLElement | null
      if (!el) return
      if (rootRef.current?.contains(el)) return
      closePanel(true)
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
    if (!pickingEnd.current) {
      setDraft({ from: date, to: undefined })
      pickingEnd.current = true
      return
    }
    const start = draftRef.current?.from ?? date
    const nextFrom = start <= date ? start : date
    const nextTo = start <= date ? date : start
    setDraft({ from: nextFrom, to: nextTo })
    emit(nextFrom, nextTo)
    pickingEnd.current = false
  }

  const label = formatRangeLabel(
    open ? draft?.from : fromDate,
    open ? (draft?.to ?? draft?.from) : (toDate ?? fromDate),
  )

  return (
    <div ref={rootRef} className="relative w-fit max-w-full">
      <Button
        id={id}
        variant="outline"
        type="button"
        disabled={disabled}
        className={cn(
          "h-12 w-full justify-start rounded-[6px] border-[#d6d6d6] bg-white text-start font-normal hover:border-neutral-300",
          !fromDate && "text-muted-foreground",
          className,
        )}
        onClick={() => (open ? closePanel(true) : openPanel())}
      >
        <CalendarIcon className="me-2 h-4 w-4 shrink-0 opacity-70" />
        <span className="truncate">{label ?? placeholder}</span>
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
              mode="range"
              selected={draft}
              month={month}
              onMonthChange={setViewMonth}
              captionLayout="label"
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              onSelect={() => undefined}
              onDayClick={(date, modifiers, e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDayClick(date, modifiers)
              }}
              className="pointer-events-auto [--cell-size:--spacing(8)] p-0"
              classNames={{
                month_caption: "hidden",
                nav: "hidden",
                range_middle: "bg-primary/15 rounded-none",
              }}
            />
          </div>
          {hint ? (
            <p className="mt-2 px-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
          {showThisMonth ? (
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-primary"
                onClick={() => {
                  const first = new Date(now.getFullYear(), now.getMonth(), 1)
                  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                  emit(first, last)
                  setDraft({ from: first, to: last })
                  setMonth(first)
                  pickingEnd.current = false
                }}
              >
                هذا الشهر
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default DateRangePicker
