"use client";

import { useState, type KeyboardEvent } from "react";
import { useFormContext } from "react-hook-form";
import { X } from "lucide-react";
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { getColorHex } from "@/lib/utils/colorMap";
import { cn } from "@/lib/utils";

type ColorTagsFieldProps = {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

function parseValues(raw: unknown): string[] {
  return String(raw ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function ColorTagsField({
  name,
  label,
  placeholder = "black, white, blue",
  required,
  className,
}: ColorTagsFieldProps) {
  const { control } = useFormContext();
  const [input, setInput] = useState("");

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const values = parseValues(field.value);

        const update = (next: string[]) => {
          field.onChange(next.join(", "));
        };

        const commitInput = () => {
          const trimmed = input.trim();
          if (!trimmed) return;
          const parts = trimmed
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          if (parts.length) update([...values, ...parts]);
          setInput("");
        };

        const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "," || e.key === "Enter") {
            e.preventDefault();
            commitInput();
          }
          if (e.key === "Backspace" && !input && values.length) {
            update(values.slice(0, -1));
          }
        };

        return (
          <FormItem className={cn("w-full space-y-2.5", className)}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-destructive ms-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <div className="flex h-[48px] w-full items-center gap-2 overflow-x-auto rounded-full border border-[#d6d6d6] bg-white px-4 [&::-webkit-scrollbar]:hidden">
                {values.map((color) => (
                  <Badge
                    key={color}
                    variant="secondary"
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-sm font-medium text-[#1e2b34]"
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: getColorHex(color) }}
                    />
                    {color}
                    <button
                      type="button"
                      className="text-[#8ca6bb] hover:text-[#1e2b34]"
                      onClick={() => update(values.filter((v) => v !== color))}
                      aria-label={`Remove ${color}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  className="min-w-[80px] flex-1 border-0 bg-transparent text-sm font-medium text-[#1e2b34] outline-none placeholder:text-[#8ca6bb]"
                  value={input}
                  placeholder={values.length ? "" : placeholder}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.includes(",")) {
                      const parts = v
                        .split(",")
                        .map((p) => p.trim())
                        .filter(Boolean);
                      if (parts.length) update([...values, ...parts]);
                      setInput("");
                    } else {
                      setInput(v);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onBlur={commitInput}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
