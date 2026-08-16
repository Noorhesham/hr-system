"use client"

import React, { useState } from "react"
import { useFormContext } from "react-hook-form"
import { Eye, EyeOff, ChevronsUpDown } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  FormField,
  FormLabel,
  FormItem,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { FormInputProps } from "@/lib/types/form.types"
import { formRtlClasses } from "@/lib/utils/formRtl"
import { PhoneInput } from "./PhoneInput"
import { DatePicker } from "./DatePicker"
import { Combobox } from "./Combobox"

const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  placeholder,
  description,
  formType = "input",
  options,
  inputType = "text",
  disabled = false,
  required = false,
  className = "",
  rows = 3,
  password = false,
  serverError,
  hideLabel = false,
  onChange,
  min,
  max,
  step,
  onKeyDown,
  prefixNode,
  suffixNode,
  lazyQueryKey,
  lazyFetchFn,
  lazyFetchItemFn,
  lazyExcludeIds,
  lazyLeadingOptions,
  searchPlaceholder,
}) => {
  const rtl = formRtlClasses()
  const formContext = useFormContext()
  const [showPassword, setShowPassword] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [comboSearch, setComboSearch] = useState("")

  if (!formContext) return null

  const { control } = formContext
  // Email stays LTR; password keeps RTL so Arabic placeholders start from the right
  const forceLtr = inputType === "email"
  // Native date inputs are not allowed — always use the Shadcn calendar.
  const effectiveType =
    formType === "input" && inputType === "date" ? "datepicker" : formType

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          dir={rtl.itemDir}
          className={cn("form-field w-full space-y-2.5", className)}
        >
          {effectiveType !== "switch" && !hideLabel && label != null && label !== "" && (
            <FormLabel className={rtl.label}>
              <span className="min-w-0">{label}</span>
              {required && <span className={rtl.requiredMark}>*</span>}
            </FormLabel>
          )}

          <FormControl>
            {(() => {
              const commonProps = {
                ...field,
                disabled,
                dir: forceLtr ? ("ltr" as const) : rtl.itemDir,
              }

              switch (effectiveType) {
                case "input": {
                  const inputEl = (
                    <div className="relative min-w-0 flex-1">
                      <Input
                        {...commonProps}
                        type={
                          password
                            ? showPassword
                              ? "text"
                              : "password"
                            : inputType
                        }
                        placeholder={placeholder || ""}
                        min={min}
                        max={max}
                        step={
                          step || (inputType === "number" ? "any" : undefined)
                        }
                        onKeyDown={onKeyDown}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val)
                          onChange?.(e)
                        }}
                        className={cn(
                          "h-12 rounded-[6px] border-[#d6d6d6] bg-white px-4 text-sm transition-[border-color,box-shadow] hover:border-neutral-300 focus-visible:border-primary focus-visible:ring-primary/20",
                          forceLtr ? "text-left" : rtl.input,
                          password && rtl.passwordInput,
                        )}
                      />
                      {password && (
                        <button
                          type="button"
                          className={rtl.passwordToggle}
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={disabled}
                          tabIndex={-1}
                          aria-label={
                            showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                          }
                        >
                          {showPassword ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  )

                  if (!prefixNode && !suffixNode) {
                    return <div className="relative w-full">{inputEl}</div>
                  }

                  return (
                    <div dir={rtl.itemDir} className={rtl.affixRow}>
                      {prefixNode && <div className="shrink-0">{prefixNode}</div>}
                      {inputEl}
                      {suffixNode && <div className="shrink-0">{suffixNode}</div>}
                    </div>
                  )
                }

                case "textarea":
                  return (
                    <Textarea
                      {...commonProps}
                      placeholder={placeholder || ""}
                      rows={rows}
                      className={cn(
                        "rounded-[6px] border-[#d6d6d6] bg-white transition-[border-color,box-shadow] hover:border-neutral-300 focus-visible:border-primary",
                        rtl.input,
                      )}
                    />
                  )

                case "switch":
                  return (
                    <div className="flex items-center gap-3">
                      <FormLabel className="m-0 cursor-pointer font-medium text-foreground">
                        {label}
                      </FormLabel>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        disabled={disabled}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  )

                case "phone":
                  return (
                    <PhoneInput
                      name={name}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={disabled}
                      placeholder={placeholder || "5X XXX XXXX"}
                      countryIso2="SA"
                      returnFullPhone={false}
                    />
                  )

                case "datepicker":
                  return (
                    <DatePicker
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={disabled}
                      placeholder={placeholder || "اختر التاريخ"}
                      min={min != null ? String(min) : undefined}
                      max={max != null ? String(max) : undefined}
                    />
                  )

                case "select": {
                  const selectValue = field.value
                    ? String(field.value)
                    : undefined
                  return (
                    <Select
                      onValueChange={(v) => field.onChange(v ?? "")}
                      value={selectValue}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-12! w-full! rounded-[6px] border border-[#d6d6d6] bg-white px-4 transition-[border-color,box-shadow] hover:border-neutral-300 focus-visible:border-primary",
                          "justify-between text-start [&>span]:text-start",
                        )}
                      >
                        <SelectValue placeholder={placeholder || "اختر..."}>
                          {(v: string | null) =>
                            options?.find((o) => o.value === v)?.label ||
                            placeholder ||
                            "اختر..."
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        sideOffset={4}
                        className="z-[100] rounded-xl"
                      >
                        {options?.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="rounded-lg"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }

                case "combobox": {
                  if (lazyFetchFn) {
                    return (
                      <Combobox
                        value={field.value ? String(field.value) : ""}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={disabled}
                        placeholder={placeholder || "اختر..."}
                        searchPlaceholder={searchPlaceholder || "بحث..."}
                        queryKey={lazyQueryKey ?? `form-combobox-${name}`}
                        fetchFn={lazyFetchFn}
                        fetchItemFn={lazyFetchItemFn}
                        excludeIds={lazyExcludeIds}
                        leadingOptions={lazyLeadingOptions}
                      />
                    )
                  }
                  const selected = options?.find(
                    (o) => o.value === String(field.value ?? ""),
                  )
                  const filtered = (options ?? []).filter((o) =>
                    !comboSearch.trim()
                      ? true
                      : o.label
                          .toLowerCase()
                          .includes(comboSearch.trim().toLowerCase()),
                  )
                  return (
                    <Popover
                      open={comboOpen}
                      onOpenChange={(open) => {
                        setComboOpen(open)
                        if (!open) setComboSearch("")
                      }}
                    >
                      <PopoverTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            disabled={disabled}
                            role="combobox"
                            aria-expanded={comboOpen}
                            className={cn(
                              "h-12 w-full justify-between rounded-[6px] border-[#d6d6d6] bg-white px-4 font-normal hover:border-neutral-300",
                              !selected && "text-muted-foreground",
                            )}
                          />
                        }
                      >
                        <span className="truncate">
                          {selected?.label || placeholder || "اختر..."}
                        </span>
                        <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-(--anchor-width) max-w-none rounded-xl p-2"
                        align="start"
                        sideOffset={4}
                      >
                        <Input
                          value={comboSearch}
                          onChange={(e) => setComboSearch(e.target.value)}
                          placeholder={searchPlaceholder || "بحث..."}
                          className="mb-2 h-10 rounded-lg"
                          autoFocus
                        />
                        <div className="max-h-60 overflow-y-auto">
                          {filtered.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                              لا توجد نتائج
                            </p>
                          ) : (
                            filtered.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                className={cn(
                                  "flex w-full items-center rounded-lg px-3 py-2 text-start text-sm hover:bg-accent",
                                  selected?.value === opt.value &&
                                    "bg-primary/10 font-medium text-primary",
                                )}
                                onClick={() => {
                                  field.onChange(opt.value)
                                  setComboOpen(false)
                                  setComboSearch("")
                                }}
                              >
                                {opt.label}
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )
                }

                default:
                  return (
                    <Input
                      {...commonProps}
                      type={inputType === "date" ? "text" : inputType}
                      placeholder={placeholder || ""}
                      min={min}
                      max={max}
                      step={
                        step || (inputType === "number" ? "any" : undefined)
                      }
                      onKeyDown={onKeyDown}
                      className="h-12 rounded-[6px] border-[#d6d6d6] bg-white"
                    />
                  )
              }
            })()}
          </FormControl>

          {description && (
            <FormDescription className={rtl.message}>{description}</FormDescription>
          )}

          {serverError ? (
            <p
              className={cn(
                "text-[0.8rem] font-medium text-destructive",
                rtl.message,
              )}
            >
              {serverError}
            </p>
          ) : (
            <FormMessage className={rtl.message} />
          )}
        </FormItem>
      )}
    />
  )
}

export default FormInput
