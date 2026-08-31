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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiFetch } from "@/lib/api-client"

type PlanRow = {
  id: string
  name: string
  maxEmployees: number
  monthlyPrice: string | number
  _count?: { companies: number }
}

const schema = z.object({
  name: z.string().trim().min(1, "اسم الباقة مطلوب").max(80),
  maxEmployees: z.coerce.number().int().min(1, "حد الموظفين مطلوب"),
  monthlyPrice: z.coerce.number().min(0, "السعر لا يقل عن صفر"),
})

type FormValues = z.infer<typeof schema>

function money(v: string | number) {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "—"
}

export default function PlatformPlansPage() {
  const [rows, setRows] = React.useState<PlanRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PlanRow | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<PlanRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", maxEmployees: 10, monthlyPrice: 0 },
  })

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<PlanRow[]>("/platform/plans")
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحميل الباقات")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    form.reset({ name: "", maxEmployees: 10, monthlyPrice: 0 })
    setDialogOpen(true)
  }

  function openEdit(row: PlanRow) {
    setEditing(row)
    form.reset({
      name: row.name,
      maxEmployees: row.maxEmployees,
      monthlyPrice: Number(row.monthlyPrice),
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/platform/plans/${editing.id}`, {
          method: "PATCH",
          body: values,
        })
        toast.success("تم تحديث الباقة")
      } else {
        await apiFetch("/platform/plans", { method: "POST", body: values })
        toast.success("تم إنشاء الباقة")
      }
      setDialogOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حفظ الباقة")
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiFetch(`/platform/plans/${deleteTarget.id}`, { method: "DELETE" })
      toast.success("تم حذف الباقة")
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حذف الباقة")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <SiteHeader
        title="الباقات"
        breadcrumbs={["المنصة", "الباقات"]}
      />
      <div className="flex flex-1 flex-col bg-[#F8F9FA]/50">
        <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-almarai text-2xl font-bold tracking-tight">
                باقات الاشتراك
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                إنشاء وتعديل وحذف باقات المنصة. الشركات تشوف الباقات دي في صفحة
                التسعير.
              </p>
            </div>
            <Button
              type="button"
              className="h-10 shrink-0 gap-2 rounded-lg"
              onClick={openCreate}
            >
              <PlusIcon className="size-4" />
              باقة جديدة
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">الاسم</TableHead>
                  <TableHead>حد الموظفين</TableHead>
                  <TableHead>السعر الشهري</TableHead>
                  <TableHead>شركات مشتركة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j} className="px-4 py-3.5">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-40 text-center text-muted-foreground"
                    >
                      لا توجد باقات. أنشئ باقة للبدء.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      <TableCell className="px-4 font-medium">
                        {row.name}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.maxEmployees}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {money(row.monthlyPrice)} ر.س
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row._count?.companies ?? 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(row)}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "تعديل الباقة" : "باقة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormInput name="name" label="اسم الباقة" required />
              <FormInput
                name="maxEmployees"
                label="حد الموظفين"
                inputType="number"
                required
              />
              <FormInput
                name="monthlyPrice"
                label="السعر الشهري (ر.س)"
                inputType="number"
                required
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
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="حذف الباقة"
        description={
          deleteTarget
            ? `هتتمسح باقة "${deleteTarget.name}". لو فيه شركات مشتركة فيها العملية هترفض.`
            : ""
        }
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  )
}
