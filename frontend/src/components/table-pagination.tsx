"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type PageMeta = {
  page: number
  limit: number
  itemCount: number
  pageCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export type TablePaginationProps = {
  meta: PageMeta
  page: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  /** Rows currently shown (usually page length). */
  shownCount?: number
  limitOptions?: number[]
  disabled?: boolean
  className?: string
  showingLabel?: (shown: number, total: number) => string
}

function pageWindow(page: number, pageCount: number): number[] {
  if (pageCount <= 0) return []
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  const start = Math.min(Math.max(1, page - 2), pageCount - 4)
  return Array.from({ length: 5 }, (_, i) => start + i)
}

/** Shared admin table pagination (limit select + page buttons). */
export function TablePagination({
  meta,
  page,
  limit,
  onPageChange,
  onLimitChange,
  shownCount,
  limitOptions = [10, 20, 50],
  disabled = false,
  className,
  showingLabel,
}: TablePaginationProps) {
  if (meta.pageCount <= 0 && meta.itemCount <= 0) return null

  const pages = pageWindow(page, meta.pageCount)
  const shown = shownCount ?? Math.min(limit, meta.itemCount)

  return (
    <div
      className={
        className ??
        "flex flex-col gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      }
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Select
          value={String(limit)}
          onValueChange={(v) => {
            if (v) onLimitChange(Number(v))
          }}
        >
          <SelectTrigger className="h-8! w-16 rounded-md" disabled={disabled}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>
          {showingLabel
            ? showingLabel(shown, meta.itemCount)
            : `عرض ${shown} من أصل ${meta.itemCount}`}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-md"
          disabled={!meta.hasPreviousPage || disabled}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          السابق
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            type="button"
            variant={p === page ? "default" : "outline"}
            size="sm"
            className="size-8 rounded-md p-0"
            disabled={disabled}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-md"
          disabled={!meta.hasNextPage || disabled}
          onClick={() => onPageChange(page + 1)}
        >
          التالي
        </Button>
      </div>
    </div>
  )
}
