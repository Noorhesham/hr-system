"use client"

import * as React from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type ComboboxOption = {
  label: string
  value: string
}

export type ComboboxPage = {
  data: ComboboxOption[]
  meta: { pageCount: number; itemCount: number }
}

export type ComboboxProps = {
  value?: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  /** Static options (client filter). Ignored when `fetchFn` is set. */
  options?: ComboboxOption[]
  /** TanStack Query key namespace for lazy fetch. */
  queryKey?: string | readonly unknown[]
  /** Server-side paginated + searchable fetch. */
  fetchFn?: (params: {
    page: number
    limit: number
    search?: string
  }) => Promise<ComboboxPage>
  /** Resolve label when value is set but not in the loaded page. */
  fetchItemFn?: (id: string) => Promise<ComboboxOption | null>
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  limit?: number
  /** Extra ids to hide (e.g. self when picking a manager). */
  excludeIds?: string[]
  /** Always shown at the top (e.g. "كل الموظفين") — not fetched from server. */
  leadingOptions?: ComboboxOption[]
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

/**
 * Searchable combobox. With `fetchFn` uses TanStack Query infinite loading;
 * otherwise filters static `options` client-side.
 */
export function Combobox({
  value,
  onValueChange,
  onBlur,
  options = [],
  queryKey = "combobox",
  fetchFn,
  fetchItemFn,
  placeholder = "اختر...",
  searchPlaceholder = "بحث...",
  emptyText = "لا توجد نتائج",
  disabled = false,
  className,
  limit = 20,
  excludeIds = [],
  leadingOptions = [],
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [resolved, setResolved] = React.useState<ComboboxOption | null>(null)
  const exclude = React.useMemo(() => new Set(excludeIds), [excludeIds])
  const leadingValues = React.useMemo(
    () => new Set(leadingOptions.map((o) => o.value)),
    [leadingOptions],
  )

  const isLazy = typeof fetchFn === "function"

  const query = useInfiniteQuery({
    queryKey: [
      ...(Array.isArray(queryKey) ? queryKey : [queryKey]),
      debouncedSearch,
      limit,
    ],
    queryFn: async ({ pageParam }) => {
      const page = await fetchFn!({
        page: pageParam as number,
        limit,
        search: debouncedSearch.trim() || undefined,
      })
      return page
    },
    getNextPageParam: (last, all) => {
      const pageCount = last.meta?.pageCount ?? 1
      return all.length < pageCount ? all.length + 1 : undefined
    },
    initialPageParam: 1,
    enabled: isLazy && (open || (!!value && !leadingValues.has(value))),
  })

  const lazyOptions = React.useMemo(() => {
    if (!isLazy) return []
    const flat = query.data?.pages.flatMap((p) => p.data) ?? []
    return flat.filter(
      (o) => !exclude.has(o.value) && !leadingValues.has(o.value),
    )
  }, [isLazy, query.data, exclude, leadingValues])

  const staticOptions = React.useMemo(() => {
    const list = options.filter(
      (o) => !exclude.has(o.value) && !leadingValues.has(o.value),
    )
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search, exclude, leadingValues])

  const filteredLeading = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leadingOptions
    return leadingOptions.filter((o) => o.label.toLowerCase().includes(q))
  }, [leadingOptions, search])

  const visible = React.useMemo(
    () => [...filteredLeading, ...(isLazy ? lazyOptions : staticOptions)],
    [filteredLeading, isLazy, lazyOptions, staticOptions],
  )

  React.useEffect(() => {
    if (!value || !fetchItemFn || leadingValues.has(value)) return
    const found = visible.find((o) => o.value === value)
    if (found) {
      setResolved(found)
      return
    }
    let cancelled = false
    void fetchItemFn(value).then((item) => {
      if (!cancelled && item) setResolved(item)
    })
    return () => {
      cancelled = true
    }
  }, [value, visible, fetchItemFn, leadingValues])

  const selected =
    leadingOptions.find((o) => o.value === value) ??
    visible.find((o) => o.value === value) ??
    (resolved?.value === value ? resolved : null) ??
    options.find((o) => o.value === value) ??
    null

  const isLoading =
    isLazy &&
    (query.isLoading || query.isFetching) &&
    lazyOptions.length === 0 &&
    filteredLeading.length === 0

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isLazy || !query.hasNextPage || query.isFetchingNextPage) return
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      void query.fetchNextPage()
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setSearch("")
          onBlur?.()
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "h-12 w-full justify-between rounded-[6px] border-[#d6d6d6] bg-white px-4 font-normal hover:border-neutral-300",
              !selected && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <span className="truncate">
          {selected?.label || placeholder}
        </span>
        {isLoading ? (
          <Loader2 className="ms-2 size-4 shrink-0 animate-spin opacity-50" />
        ) : (
          <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-(--anchor-width) max-w-none gap-0 rounded-xl p-2"
        align="start"
        sideOffset={4}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="mb-2 h-10 rounded-lg"
          autoFocus
        />
        <div
          className="max-h-60 overflow-y-auto"
          onScroll={handleScroll}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
            </div>
          ) : visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            visible.map((opt) => {
              const active = value === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors hover:bg-accent",
                    active && "bg-primary/10 font-medium text-primary",
                  )}
                  onClick={() => {
                    onValueChange(opt.value)
                    setResolved(opt)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              )
            })
          )}
          {isLazy && query.isFetchingNextPage ? (
            <div className="flex justify-center py-2">
              <Loader2 className="size-4 animate-spin text-primary/60" />
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default Combobox
