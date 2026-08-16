"use client"

import * as React from "react"
import Link from "next/link"
import { BellIcon, CheckCheckIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"

type NotificationItem = {
  id: string
  title: string
  body: string
  type: string
  link: string | null
  readAt: string | null
  createdAt: string
}

export function NotificationBell() {
  const [items, setItems] = React.useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{
        items: NotificationItem[]
        unreadCount: number
      }>("/notifications?limit=20")
      setItems(res.items ?? [])
      setUnreadCount(res.unreadCount ?? 0)
    } catch {
      // Silent — bell is non-blocking
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
    const t = window.setInterval(() => void load(), 60_000)
    return () => window.clearInterval(t)
  }, [load])

  React.useEffect(() => {
    if (open) void load()
  }, [open, load])

  async function markRead(id: string) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH", body: {} })
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحديث الإشعار")
    }
  }

  async function markAll() {
    try {
      await apiFetch("/notifications/read-all", { method: "POST", body: {} })
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
      )
      setUnreadCount(0)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر التحديث")
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="الإشعارات"
            className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:bg-muted"
          />
        }
      >
        <BellIcon className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -start-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0" sideOffset={8}>
        <DropdownMenuGroup>
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <DropdownMenuLabel className="p-0 text-sm font-semibold text-foreground">
              الإشعارات
            </DropdownMenuLabel>
            {unreadCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={(e) => {
                  e.preventDefault()
                  void markAll()
                }}
              >
                <CheckCheckIcon className="size-3.5" />
                قراءة الكل
              </Button>
            ) : null}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuGroup className="max-h-80 overflow-y-auto p-0">
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              لا توجد إشعارات
            </p>
          ) : (
            items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  "cursor-pointer items-start gap-2 rounded-none px-3 py-2.5",
                  !n.readAt && "bg-primary/5",
                )}
                render={
                  n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => void markRead(n.id)}
                    />
                  ) : (
                    <button type="button" onClick={() => void markRead(n.id)} />
                  )
                }
              >
                <div className="min-w-0 flex-1 text-start">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {n.body}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
