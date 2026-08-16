"use client"

import * as React from "react"
import { isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type MonthPickerProps = {
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
  fromYear?: number
  toYear?: number
}

const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const

function parseYearMonth(raw: string | undefined): Date | undefined {
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return undefined
  const [y, m] = raw.split("-").map(Number)
  const date = new Date(y!, m! - 1, 1)
  return isValid(date) ? date : undefined
}

function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function formatYearMonthAr(date: Date): string {
  return `${MONTHS_AR[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Shadcn Popover + Calendar for month filters.
 * Stores/returns `YYYY-MM`. Clicking any day selects that month.
 */
export function MonthPicker({
  value = "",
  onChange,
  onBlur,
  disabled = false,
  placeholder = "اختر الشهر",
  className,
  id,
  fromYear,
  toYear,
}: MonthPickerProps) {
  const now = new Date()
  const selected = parseYearMonth(value)
  const startYear = fromYear ?? 1940
  const endYear = toYear ?? now.getFullYear() + 5

  const years = React.useMemo(() => {
    const list: number[] = []
    for (let y = endYear; y >= startYear; y--) list.push(y)
    return list
  }, [startYear, endYear])

  const [open, setOpen] = React.useState(false)
  const [monthOpen, setMonthOpen] = React.useState(false)
  const [yearOpen, setYearOpen] = React.useState(false)
  const selectOpen = monthOpen || yearOpen

  const [month, setMonth] = React.useState<Date>(
    () => selected ?? new Date(now.getFullYear(), now.getMonth(), 1),
  )

  React.useEffect(() => {
    if (selected) setMonth(selected)
  }, [selected])

  function commit(next: Date) {
    const first = new Date(next.getFullYear(), next.getMonth(), 1)
    setMonth(first)
    onChange?.(toYearMonth(first))
    setOpen(false)
    onBlur?.()
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next && selectOpen) return
        setOpen(next)
        if (next) {
          setMonth(selected ?? new Date(now.getFullYear(), now.getMonth(), 1))
        } else {
          onBlur?.()
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            type="button"
            disabled={disabled}
            className={cn(
              "h-9 w-44 justify-start rounded-lg bg-white text-start font-normal",
              !selected && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="me-2 h-4 w-4 shrink-0 opacity-70" />
        <span className="truncate">
          {selected ? formatYearMonthAr(selected) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto gap-2 rounded-2xl p-3"
        align="start"
        sideOffset={4}
      >
        <div className="flex gap-2">
          <Select
            value={String(month.getMonth())}
            open={monthOpen}
            onOpenChange={setMonthOpen}
            onValueChange={(v) => {
              if (v == null) return
              setMonth(new Date(month.getFullYear(), Number(v), 1))
            }}
          >
            <SelectTrigger className="h-9! flex-1 rounded-lg">
              <SelectValue>
                {(v: string | null) =>
                  v != null ? MONTHS_AR[Number(v)] : "الشهر"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-[70] max-h-60">
              {MONTHS_AR.map((label, i) => (
                <SelectItem key={label} value={String(i)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(month.getFullYear())}
            open={yearOpen}
            onOpenChange={setYearOpen}
            onValueChange={(v) => {
              if (v == null) return
              setMonth(new Date(Number(v), month.getMonth(), 1))
            }}
          >
            <SelectTrigger className="h-9! w-[6.5rem] rounded-lg tabular-nums">
              <SelectValue>
                {(v: string | null) => v ?? "السنة"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-[70] max-h-60">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          captionLayout="label"
          onSelect={(date) => {
            if (date) commit(date)
          }}
          className="[--cell-size:--spacing(8)] p-0"
          classNames={{
            month_caption: "hidden",
            nav: "hidden",
          }}
        />

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-primary"
            onClick={() => commit(now)}
          >
            هذا الشهر
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default MonthPicker
