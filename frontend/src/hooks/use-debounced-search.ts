"use client"

import * as React from "react"

/**
 * Unified search state: `search` for the input UI, `debouncedSearch` for API queries.
 */
export function useDebouncedSearch(delayMs = 300): {
  search: string
  setSearch: (value: string) => void
  debouncedSearch: string
} {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), delayMs)
    return () => clearTimeout(t)
  }, [search, delayMs])

  return { search, setSearch, debouncedSearch }
}
