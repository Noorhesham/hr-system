"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";

interface PaginatedResponse<T> {
  data: T[];
  meta?: { pageCount?: number; itemCount?: number };
  totalPages?: number;
}

interface InfiniteComboboxProps<T extends object> {
  /** Unique key to namespace the query — REQUIRED when using multiple comboboxes */
  queryKey?: string;
  fetchFn: (params: { page: number; limit: number; search?: string }) => Promise<PaginatedResponse<T>>;
  /** Optional: fetch a single item by ID to resolve initial selected label */
  fetchItemFn?: (id: string) => Promise<T>;
  /** Controlled selected value(s) — can be a single ID or an array of IDs */
  value?: string | string[] | null;
  /**
   * Called when user selects/deselects an item.
   * Receives (value, fullItem) — fullItem is null on deselect.
   */
  onValueChange?: (value: string | null, item: T | null) => void;
  /** Called when user selects an item (alternative callback pattern) */
  onSelect?: (item: T) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  label?: string;
  /** Key to use as the display label — supports nested i18n objects */
  labelKey: string;
  /** Key to use as the unique value */
  valueKey: string;
  /** Key for image URL (supports string or array of strings) */
  imageKey?: string;
  disabled?: boolean;
  limit?: number;
  className?: string;
  /** React Hook Form integration */
  name?: string;
  required?: boolean;
  selectedText?: string;
}

export function InfiniteCombobox<T extends object>({
  queryKey = "infinite-combobox",
  fetchFn,
  fetchItemFn,
  value: externalValue,
  onValueChange,
  onSelect,
  placeholder = "Select item...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  labelKey,
  valueKey,
  imageKey,
  disabled = false,
  limit = 20,
  className,
  name,
  label,
  required,
  selectedText,
}: InfiniteComboboxProps<T>) {
  const locale = "en";
  const formContext = useFormContext();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [resolvedItem, setResolvedItem] = React.useState<T | null>(null);
  const [isResolving, setIsResolving] = React.useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: [queryKey, debouncedSearch, limit],
    queryFn: ({ pageParam = 1 }) => fetchFn({ page: pageParam as number, limit, search: debouncedSearch }),
    getNextPageParam: (lastPage: any, allPages: any) => {
      const totalPages = lastPage.meta?.pageCount ?? lastPage.totalPages ?? 1;
      return allPages.length < totalPages ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: open || !!externalValue,
  });

  const items: T[] = React.useMemo(() => data?.pages.flatMap((page: any) => page.data) ?? [], [data]);

  // Resolve label for pre-selected item
  const resolvedValueRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const singleValue = Array.isArray(externalValue) ? null : (externalValue ?? null);
    if (!singleValue || !fetchItemFn) return;

    // If already found in loaded items, use that
    const found = items.find((item) => String((item as any)[valueKey]) === singleValue);
    if (found) {
      setResolvedItem(found);
      resolvedValueRef.current = singleValue;
      return;
    }

    // Don't re-fetch if we already resolved for this value
    if (resolvedValueRef.current === singleValue) return;

    setIsResolving(true);
    fetchItemFn(singleValue)
      .then((item) => {
        if (item) {
          setResolvedItem(item);
          resolvedValueRef.current = singleValue;
        }
      })
      .catch(() => setResolvedItem(null))
      .finally(() => setIsResolving(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue, items.length, fetchItemFn, valueKey]);

  // Infinite scroll via onScroll
  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (!hasNextPage || isFetchingNextPage) return;

      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < 150) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const getLabel = (item: T): string => {
    const raw = (item as any)[labelKey];
    if (raw !== null && typeof raw === "object") {
      const obj = raw as Record<string, string>;
      return obj[locale] ?? obj["en"] ?? obj["ar"] ?? "";
    }
    return String(raw ?? "");
  };

  const getImageUrl = (item: T): string | null => {
    if (!imageKey) return null;
    const raw = (item as any)[imageKey];
    if (Array.isArray(raw)) return raw[0] ?? null;
    if (typeof raw === "string") return raw;
    return null;
  };

  const isSelected = (itemValue: string) => {
    if (Array.isArray(externalValue)) return externalValue.includes(itemValue);
    return externalValue === itemValue;
  };

  const selectedItem =
    externalValue && !Array.isArray(externalValue)
      ? (items.find((item) => String((item as any)[valueKey]) === externalValue) ?? resolvedItem)
      : null;

  const displayLabel = selectedItem
    ? getLabel(selectedItem)
    : externalValue && !Array.isArray(externalValue)
      ? isResolving
        ? "..."
        : externalValue
      : placeholder;

  const handleSelect = (item: T) => {
    const itemValue = String((item as any)[valueKey]);
    const alreadySelected = isSelected(itemValue);

    onSelect?.(item);
    onValueChange?.(alreadySelected ? null : itemValue, alreadySelected ? null : item);

    if (!Array.isArray(externalValue)) {
      setOpen(false);
      setSearch("");
    }
  };

  const comboboxContent = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between rounded-xl h-11 bg-muted/30 border-none shadow-none text-start px-4 font-normal",
            !selectedItem && !Array.isArray(externalValue) && "text-muted-foreground",
            Array.isArray(externalValue) && externalValue.length > 0 && "font-medium",
            className,
          )}
        >
          <span className="truncate">
            {Array.isArray(externalValue)
              ? externalValue.length > 0
                ? selectedText
                  ? `${selectedText} (${externalValue.length})`
                  : `${externalValue.length} selected`
                : placeholder
              : displayLabel}
          </span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 rounded-xl overflow-hidden   border-border/50"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} className="h-10" />
          <div onScroll={handleScroll} className="max-h-[300px] overflow-y-auto no-scrollbar scroll-smooth">
            <CommandList className="max-h-none overflow-visible">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading...</span>
                </div>
              ) : items.length === 0 ? (
                <CommandEmpty className="py-10">{emptyText}</CommandEmpty>
              ) : null}

              <CommandGroup>
                {items.map((item, idx) => {
                  const itemValue = String((item as any)[valueKey]);
                  const label = getLabel(item);
                  const imageUrl = getImageUrl(item);
                  const selected = isSelected(itemValue);

                  return (
                    <CommandItem
                      key={`${itemValue}-${idx}`}
                      value={itemValue}
                      onSelect={() => handleSelect(item)}
                      className="rounded-lg cursor-pointer flex items-center gap-2"
                    >
                      <Check
                        className={cn("h-4 w-4 flex-shrink-0", selected ? "opacity-100 text-primary" : "opacity-0")}
                      />

                      {imageUrl && (
                        <div className="w-8 h-8 rounded-md bg-muted overflow-hidden flex-shrink-0 border border-border/50">
                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <span className="truncate flex-1 font-medium">{label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              {(hasNextPage || isFetchingNextPage) && (
                <div className="flex items-center justify-center py-4 min-h-[40px]">
                  {isFetchingNextPage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary/50" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                  )}
                </div>
              )}
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (formContext && name && !(arguments[0] as any)._isNested) {
    return (
      <FormField
        control={formContext.control}
        name={name}
        render={({ field }) => (
          <FormItem className="space-y-2">
            {label && (
              <FormLabel className="font-semibold">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <InfiniteCombobox
                {...{
                  ...field,
                  value: field.value || null,
                  onValueChange: (val) => field.onChange(val),
                  queryKey,
                  fetchFn,
                  fetchItemFn,
                  placeholder,
                  searchPlaceholder,
                  emptyText,
                  labelKey,
                  valueKey,
                  imageKey,
                  disabled,
                  limit,
                  className,
                  selectedText,
                  // @ts-ignore
                  _isNested: true,
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return comboboxContent;
}
