"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Combobox } from "./Combobox";
import { MultiCombobox } from "./MultiCombobox";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface FormComboboxProps {
  name: string;
  label?: string;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  description?: string;
  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  className?: string;
  namespace?: string;
  multiple?: boolean;
}

export function FormCombobox({
  name,
  label,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  description,
  disabled,
  isLoading,
  required,
  className,
  multiple,
}: FormComboboxProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("w-full space-y-2.5", className)}>
          {label && (
            <FormLabel className="flex items-center gap-0.5 text-foreground font-semibold">
              {label}
              {required && <span className="shrink-0 text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>
            {multiple ? (
              <MultiCombobox
                options={options}
                values={Array.isArray(field.value) ? field.value : []}
                onValuesChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyText={emptyText}
                disabled={disabled}
                isLoading={isLoading}
              />
            ) : (
              <Combobox
                options={options}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyText={emptyText}
                disabled={disabled}
                isLoading={isLoading}
              />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Keep a default export for backward compatibility or if needed by FormInput (though we'll update it)
export default FormCombobox;
