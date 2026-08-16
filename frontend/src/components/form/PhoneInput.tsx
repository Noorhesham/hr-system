"use client"

import ReactPhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import "./PhoneInput.css"

import { useCallback } from "react"
import { cn } from "@/lib/utils"

export type PhoneInputProps = {
  name?: string
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  id?: string
  /**
   * When true, emits E.164 like `+966501234567`.
   * When false (default), emits national digits only (for `/^\d{8,10}$/` schemas).
   */
  returnFullPhone?: boolean
  /** ISO 2-letter country (e.g. "SA"). Default Saudi Arabia. */
  countryIso2?: string
}

function toDisplayValue(raw: string, dialCode: string): string {
  if (!raw) return ""
  const digits = raw.replace(/\D/g, "")
  if (raw.startsWith("+") || digits.startsWith(dialCode)) {
    return digits
  }
  // National-only value → prefix dial for the widget display
  return `${dialCode}${digits}`
}

/**
 * react-phone-input-2 wrapper — RTL-first, styled to match FormInput.
 * Flag sits on the right; national number entry on the left (LTR digits).
 */
export function PhoneInput({
  name = "phone",
  value = "",
  onChange,
  onBlur,
  disabled = false,
  placeholder = "5X XXX XXXX",
  searchPlaceholder = "بحث عن دولة...",
  className,
  id,
  returnFullPhone = false,
  countryIso2 = "SA",
}: PhoneInputProps) {
  const country = (countryIso2 || "SA").toLowerCase()
  // SA dial code used for national ↔ display conversion when country is SA;
  // react-phone-input-2 still emits the real dial in onChange data.
  const defaultDial =
    country === "sa" ? "966" : country === "eg" ? "20" : "966"

  const displayValue = toDisplayValue(String(value ?? ""), defaultDial)

  const emit = useCallback(
    (raw: string, data: { dialCode?: string }) => {
      const dial = data?.dialCode ?? defaultDial
      const digits = String(raw || "").replace(/\D/g, "")

      if (returnFullPhone) {
        const e164 = digits ? (digits.startsWith("+") ? digits : `+${digits}`) : ""
        // raw from library is without '+'; normalize
        const normalized = digits ? `+${digits}` : ""
        onChange?.(normalized || e164)
        return
      }

      const national =
        dial && digits.startsWith(dial) ? digits.slice(dial.length) : digits
      onChange?.(national)
    },
    [defaultDial, onChange, returnFullPhone],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault()
  }, [])

  return (
    <div
      className={cn("phone-input-container phone-input-rtl", className)}
      dir="rtl"
      id={id}
    >
      <ReactPhoneInput
        country={country}
        value={displayValue}
        onChange={(val: string, data: { dialCode?: string }) => emit(val, data)}
        onBlur={onBlur}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        enableSearch
        disabled={disabled}
        preferredCountries={["sa", "eg", "ae", "kw", "bh", "qa", "om"]}
        inputProps={{
          name,
          onKeyDown: handleKeyDown,
          disabled,
          autoComplete: "tel",
        }}
        containerClass="phone-rtl-container"
        inputClass="phone-rtl-input"
        buttonClass="phone-rtl-button"
        dropdownClass="phone-rtl-dropdown"
      />
    </div>
  )
}

export default PhoneInput
