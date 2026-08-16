"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandInput } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Option {
  label: string;
  value: string;
}

interface MultiComboboxProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  onBlur?: () => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function MultiCombobox({
  values,
  onValuesChange,
  onBlur,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  isLoading = false,
  className,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [scrollEl, setScrollEl] = React.useState<HTMLDivElement | null>(null);

  const selectedLabels = options
    .filter((opt) => values.includes(opt.value))
    .map((opt) => opt.label)
    .join(", ");

  const filteredOptions = React.useMemo(
    () => (search.trim() ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase())) : options),
    [options, search],
  );

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => 44,
    overscan: 8,
  });

  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  React.useEffect(() => {
    if (scrollEl) scrollEl.scrollTop = 0;
  }, [options, scrollEl]);

  const toggleValue = (value: string) => {
    onValuesChange(
      values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            "w-full justify-between h-[48px] rounded-full border-[#d6d6d6] bg-white px-4 font-normal transition-colors hover:border-neutral-300",
            !values.length ? "text-muted-foreground hover:text-muted-foreground" : "text-foreground",
            className,
          )}
        >
          <span className="truncate">{selectedLabels || placeholder}</span>
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        avoidCollisions={true}
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-border/50 z-1100"
      >
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} className="h-11" />

          {filteredOptions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            <div ref={setScrollEl} className="max-h-[300px] overflow-y-auto p-1">
              <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                {virtualizer.getVirtualItems().map((vItem) => {
                  const opt = filteredOptions[vItem.index];
                  const selected = values.includes(opt.value);
                  return (
                    <button
                      key={vItem.key}
                      type="button"
                      title={opt.label}
                      onClick={() => toggleValue(opt.value)}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: vItem.size,
                        transform: `translateY(${vItem.start}px)`,
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 pe-4 text-sm transition-colors hover:bg-[#301989] hover:text-white",
                        selected && "bg-[#301989] text-white",
                      )}
                    >
                      <Check className={cn("h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
