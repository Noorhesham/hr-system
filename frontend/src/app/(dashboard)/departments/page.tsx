"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { FormInput } from "@/components/form"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TablePagination,
  type PageMeta,
} from "@/components/table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiFetch } from "@/lib/api-client"

type DeptRow = {
  id: string
  name: string
  createdAt: string
  _count?: { employees: number }
}

const schema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب").max(120),
})

type FormValues = z.infer<typeof schema>

export default function DepartmentsPage() {
  const [rows, setRows] = React.useState<DeptRow[]>([])
  const [meta, setMeta] = React.useState<PageMeta | null>(null)
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<DeptRow | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<DeptRow | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  })

  const load = React.useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setInitialLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        orderBy: "name",
        order: "asc",
      })
      const res = await apiFetch<{ data: DeptRow[]; meta?: PageMeta }>(
        `/departments?${params}`,
      )
      setRows(res.data ?? [])
      setMeta(
        res.meta ?? {
          page,
          limit,
          itemCount: res.data?.length ?? 0,
          pageCount: 1,
          hasPreviousPage: page > 1,
          hasNextPage: false,
        },
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحميل الأقسام")
      setRows([])
      setMeta(null)
    } finally {
      setInitialLoading(false)
    }
  }, [page, limit])

  React.useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    form.reset({ name: "" })
    setDialogOpen(true)
  }

  function openEdit(row: DeptRow) {
    setEditing(row)
    form.reset({ name: row.name })
    setDialogOpen(true)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/departments/${editing.id}`, {
          method: "PATCH",
          body: { name: values.name.trim() },
        })
        toast.success("تم تحديث القسم")
      } else {
        await apiFetch("/departments", {
          method: "POST",
          body: { name: values.name.trim() },
        })
        toast.success("تم إنشاء القسم")
      }
      setDialogOpen(false)
      await load({ silent: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحفظ")
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    try {
      await apiFetch(`/departments/${deleteTarget.id}`, { method: "DELETE" })
      toast.success("تم حذف القسم")
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحذف")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <SiteHeader title="الأقسام" breadcrumbs={["الأقسام"]} />
      <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-almarai text-2xl font-bold">الأقسام</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              إدارة أقسام الشركة واستخدامها عند إنشاء وتصفية الموظفين.
            </p>
          </div>
          <Button
            type="button"
            className="gap-2 rounded-lg"
            onClick={openCreate}
          >
            <PlusIcon className="size-4" />
            قسم جديد
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>الاسم</TableHead>
                <TableHead>عدد الموظفين</TableHead>
                <TableHead className="w-36">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-28 text-center text-muted-foreground"
                  >
                    لا توجد أقسام — أنشئ قسمًا للبدء
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {r._count?.employees ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-lg"
                          onClick={() => openEdit(r)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-lg text-destructive"
                          disabled={deletingId === r.id}
                          onClick={() => setDeleteTarget(r)}
                        >
                          {deletingId === r.id ? (
                            <Loader2Icon className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2Icon className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {meta && meta.pageCount > 0 ? (
            <TablePagination
              meta={meta}
              page={page}
              limit={limit}
              shownCount={rows.length}
              disabled={initialLoading}
              onPageChange={setPage}
              onLimitChange={(n) => {
                setLimit(n)
                setPage(1)
              }}
            />
          ) : null}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing ? "تعديل القسم" : "قسم جديد"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormInput
                name="name"
                label="اسم القسم"
                formType="input"
                required
                placeholder="مثال: الهندسة"
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : editing ? (
                    "حفظ"
                  ) : (
                    "إنشاء"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDeleteTarget(null)
        }}
        title={
          deleteTarget
            ? `حذف القسم «${deleteTarget.name}»؟`
            : "حذف القسم؟"
        }
        description="لا يمكن الحذف إن كان القسم مرتبطًا بموظفين. لا يمكن التراجع عن هذا الإجراء."
        loading={deletingId != null}
        onConfirm={confirmDelete}
      />
    </>
  )
}
