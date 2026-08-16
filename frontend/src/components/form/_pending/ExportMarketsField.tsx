"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import OptionalLabelSuffix from "@/components/common/OptionalLabelSuffix";
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { EXPORT_MARKET_OPTIONS, type ExportMarketValue } from "@/lib/utils/exportMarketOptions";
import { cn } from "@/lib/utils";

type ExportMarketsFieldProps = {
  name?: string;
  label?: string;
  optional?: boolean;
  placeholder?: string;
  className?: string;
};

export function ExportMarketsField({
  name = "exportMarkets",
  label = "Export Markets",
  optional = true,
  placeholder = "Select market",
  className,
}: ExportMarketsFieldProps) {
  const t = useTranslations("Common");
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const values: ExportMarketValue[] = Array.isArray(field.value) ? field.value : [];

        const isSelected = (country: string) =>
          values.some((v) => v.country === country && !v._destroy);

        const toggleValue = (country: string) => {
          const existing = values.find((v) => v.country === country);
          if (existing) {
            field.onChange(
              values.map((v) =>
                v.country === country ? { ...v, _destroy: !v._destroy } : v,
              ),
            );
          } else {
            field.onChange([...values, { country, _destroy: false }]);
          }
        };

        const selectedLabels = values
          .filter((v) => !v._destroy)
          .map((v) => t(`markets.${v.country}`, { defaultValue: v.country }))
          .join(", ");

        return (
          <FormItem className={cn("relative w-full space-y-2.5", className)}>
            <div ref={wrapperRef} className="relative w-full space-y-2.5">
            <FormLabel className="text-sm font-medium text-[#1e2b34]">
              <span>{label}</span>
              {optional && <OptionalLabelSuffix />}
            </FormLabel>
            <FormControl>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-between rounded-full border border-[#e1e8ef] bg-white px-4 text-sm font-medium text-[#3c5768] outline-none focus:border-[#1e2b34]"
                onClick={() => setOpen((prev) => !prev)}
              >
                <span className={cn("truncate text-left", selectedLabels ? "text-[#101828]" : "text-[#667085]")}>
                  {selectedLabels || placeholder}
                </span>
                <ChevronDown className="size-5 shrink-0 text-[#232b32]" />
              </button>
            </FormControl>

            {open && (
              <div className="absolute top-[calc(100%+4px)] z-50 w-full rounded-xl border border-[#e4e7ec] bg-white py-2 shadow-lg">
                {EXPORT_MARKET_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm hover:bg-[#f9fafb]"
                  >
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={isSelected(opt.value)}
                      onChange={() => toggleValue(opt.value)}
                    />
                    <span>{t(`markets.${opt.value}`, { defaultValue: opt.label })}</span>
                  </label>
                ))}
              </div>
            )}
            <FormMessage />
            </div>
          </FormItem>
        );
      }}
    />
  );
}
