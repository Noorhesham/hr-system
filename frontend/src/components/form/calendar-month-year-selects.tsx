"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export const calendarOverlayClass =
  "absolute start-0 top-full z-50 mt-1 w-max origin-top rounded-2xl border border-border bg-white p-3 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"

export const MONTHS_AR = [
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

type Option = { value: string; label: string }

function LocalMenu({
  value,
  label,
  options,
  onChange,
  className,
  menuClassName,
}: {
  value: string
  label: string
  options: Option[]
  onChange: (value: string) => void
  className?: string
  menuClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onDoc(e: PointerEvent) {
      const el = e.target as Node | null
      if (el && rootRef.current?.contains(el)) return
      setOpen(false)
    }
    document.addEventListener("pointerdown", onDoc)
    return () => document.removeEventListener("pointerdown", onDoc)
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{label}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <ul
          role="listbox"
          className={cn(
            "absolute start-0 z-80 mt-1 max-h-56 w-full origin-top overflow-y-auto rounded-xl border border-border bg-white py-1 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-100",
            menuClassName,
          )}
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={cn(
                  "flex w-full px-2.5 py-1.5 text-start text-sm hover:bg-accent",
                  opt.value === value && "bg-accent font-medium",
                )}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

type CalendarMonthYearSelectsProps = {
  month: Date
  years: number[]
  onViewMonth: (next: Date) => void
}

/** In-DOM month/year menus — no portal, works inside a modal Dialog. */
export function CalendarMonthYearSelects({
  month,
  years,
  onViewMonth,
}: CalendarMonthYearSelectsProps) {
  return (
    <div className="mb-2 flex w-full gap-2">
      <LocalMenu
        className="min-w-0 flex-1"
        value={String(month.getMonth())}
        label={MONTHS_AR[month.getMonth()]}
        options={MONTHS_AR.map((label, i) => ({
          value: String(i),
          label,
        }))}
        onChange={(v) =>
          onViewMonth(new Date(month.getFullYear(), Number(v), 1))
        }
      />
      <LocalMenu
        className="w-28 shrink-0"
        menuClassName="min-w-full"
        value={String(month.getFullYear())}
        label={String(month.getFullYear())}
        options={years.map((y) => ({
          value: String(y),
          label: String(y),
        }))}
        onChange={(v) =>
          onViewMonth(new Date(Number(v), month.getMonth(), 1))
        }
      />
    </div>
  )
}
