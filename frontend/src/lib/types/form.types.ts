import type { ChangeEvent, KeyboardEvent, ReactNode } from "react"

export type FormInputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "search"
  | "date"
  | "time"
  | "datetime-local"

export type FormFieldType =
  | "input"
  | "textarea"
  | "switch"
  | "datepicker"
  | "phone"
  | "select"
  | "combobox"

export type FormSelectOption = {
  label: string
  value: string
}

export type FormComboboxPage = {
  data: FormSelectOption[]
  meta: { pageCount: number; itemCount: number }
}

export type FormInputProps = {
  name: string
  label?: string
  placeholder?: string
  description?: string
  formType?: FormFieldType
  options?: FormSelectOption[]
  inputType?: FormInputType
  disabled?: boolean
  required?: boolean
  className?: string
  rows?: number
  password?: boolean
  serverError?: string
  hideLabel?: boolean
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  min?: number | string
  max?: number | string
  step?: number | string
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  prefixNode?: ReactNode
  suffixNode?: ReactNode
  /** TanStack Query key for lazy combobox. */
  lazyQueryKey?: string | readonly unknown[]
  /** Server fetch for lazy combobox (page + search). */
  lazyFetchFn?: (params: {
    page: number
    limit: number
    search?: string
  }) => Promise<FormComboboxPage>
  lazyFetchItemFn?: (id: string) => Promise<FormSelectOption | null>
  lazyExcludeIds?: string[]
  lazyLeadingOptions?: FormSelectOption[]
  searchPlaceholder?: string
}
