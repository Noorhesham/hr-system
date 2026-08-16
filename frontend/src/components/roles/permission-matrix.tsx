"use client"

import { Checkbox } from "@/components/ui/checkbox"
import {
  PERMISSION_COLUMNS,
  PERMISSION_MODULES,
} from "@/lib/roles"
import { cn } from "@/lib/utils"

const boxClass =
  "pointer-events-none size-5 rounded-[6px] border-border bg-white shadow-none data-checked:border-primary data-checked:bg-primary data-checked:text-white"

export function PermissionMatrix({
  selected,
  disabled,
  onToggle,
}: {
  selected: Set<string>
  disabled?: boolean
  onToggle: (action: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80">
      <table className="w-full min-w-180 caption-bottom text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="h-12 px-4 text-start text-sm font-medium text-muted-foreground whitespace-nowrap">
              النظام الفرعي / القائمة
            </th>
            {PERMISSION_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="h-12 w-22 px-2 text-center text-sm font-medium text-muted-foreground whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_MODULES.map((mod) => (
            <tr key={mod.id} className="border-b last:border-0">
              <td className="px-4 py-3.5 text-sm font-medium">{mod.label}</td>
              {PERMISSION_COLUMNS.map((col) => {
                const action = mod.cells[col.key]
                const mapped = Boolean(action)
                const checked = mapped ? selected.has(action!) : false
                return (
                  <td key={col.key} className="px-2 py-2 text-center">
                    {mapped ? (
                      <button
                        type="button"
                        disabled={disabled}
                        aria-pressed={checked}
                        aria-label={`${mod.label} — ${col.label}`}
                        className={cn(
                          "inline-flex size-9 items-center justify-center rounded-lg",
                          disabled
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-primary/10",
                        )}
                        onClick={() => onToggle(action!)}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          tabIndex={-1}
                          className={boxClass}
                        />
                      </button>
                    ) : (
                      <span className="text-muted-foreground/40" aria-hidden>
                        —
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
