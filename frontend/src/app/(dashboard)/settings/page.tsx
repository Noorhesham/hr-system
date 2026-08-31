"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UploadCloud, Loader2, Info } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { apiFetch, uploadFile } from "@/lib/api-client"
import { formatTime12h } from "@/lib/format-time"
import { useAuth } from "@/hooks/use-auth"
import { cycleToApi, workDaysToWeekendDays } from "@/lib/onboarding/draft"
import {
  INDUSTRY_OPTIONS,
  companyProfileSchema,
  type CompanyProfileValues,
  adminProfileSchema,
  type AdminProfileValues,
  WORK_DAYS,
  DEFAULT_WORK_DAYS,
  CURRENCIES,
  CYCLES,
  payrollSettingsSchema,
  type PayrollSettingsInput,
  type PayrollSettingsValues,
  INSURANCE_PROVIDERS,
  INSURANCE_TIERS,
  benefitsSettingsSchema,
  type BenefitsSettingsValues,
  apiCycleToForm,
  weekendDaysToWorkDays,
} from "@/lib/company-setup/schemas"

type CompanyResponse = {
  id: string
  name: string
  website: string | null
  industry: string | null
  logoUrl: string | null
}

type PolicyResponse = {
  defaultWeekendDays: string[]
  currency: string
  payrollCycle: string
  payrollPayoutDay: number
  directBankTransfer: boolean
  medicalInsuranceProvider: string | null
  medicalInsuranceTier: string | null
  gosiAutoEnroll: boolean
  benefitHousingAllowance: boolean
  benefitHousingAllowanceAmount: string | number | null
  benefitHousingAllowanceIsPercentage: boolean
  benefitTransportAllowance: boolean
  benefitTransportAllowanceAmount: string | number | null
  benefitAnnualTickets: boolean
  benefitAnnualTicketsAmount: string | number | null
}

function SaveBar({
  pending,
  disabled,
}: {
  pending: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex justify-start pt-2">
      <Button
        type="submit"
        disabled={pending || disabled}
        className="h-11 min-w-36 rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {pending ? "جارٍ الحفظ…" : "حفظ التغييرات"}
      </Button>
    </div>
  )
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-2xl border border-border/80 bg-white p-5 shadow-[0_1px_3px_rgb(0,0,0,0.04)] sm:p-6">
      {children}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <React.Suspense
      fallback={
        <>
          <SiteHeader title="الإعدادات" />
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </>
      }
    >
      <SettingsPageInner />
    </React.Suspense>
  )
}

function SettingsPageInner() {
  const { user, refreshSession } = useAuth()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const initialTab =
    tabParam === "admin" ||
    tabParam === "attendance" ||
    tabParam === "payroll" ||
    tabParam === "benefits"
      ? tabParam
      : "company"
  const [tab, setTab] = React.useState(initialTab)
  const [loading, setLoading] = React.useState(true)
  const [company, setCompany] = React.useState<CompanyResponse | null>(null)
  const [policy, setPolicy] = React.useState<PolicyResponse | null>(null)

  React.useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  React.useEffect(() => {
    void (async () => {
      try {
        const [c, p] = await Promise.all([
          apiFetch<CompanyResponse>("/company"),
          apiFetch<PolicyResponse>("/company/policy"),
        ])
        setCompany(c)
        setPolicy(p)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "تعذر تحميل الإعدادات")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <>
        <SiteHeader title="الإعدادات" />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
          <div className="space-y-4 rounded-2xl border border-border/80 bg-white p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader title="الإعدادات" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">إعدادات الشركة</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            عدّل بيانات الشركة والسياسات التي أدخلتها أثناء الإعداد الأولي.
          </p>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            if (v) setTab(v)
          }}
          className="w-full gap-5"
        >
          <TabsList
            variant="line"
            className="mb-0 h-auto w-fit justify-start gap-5 rounded-none bg-transparent p-0"
          >
            <TabsTrigger
              value="company"
              className="flex-none rounded-none px-0 pb-3 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"
            >
              ملف الشركة
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="flex-none rounded-none px-0 pb-3 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"
            >
              مسؤول النظام
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="flex-none rounded-none px-0 pb-3 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"
            >
              الحضور
            </TabsTrigger>
            <TabsTrigger
              value="payroll"
              className="flex-none rounded-none px-0 pb-3 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"
            >
              الرواتب
            </TabsTrigger>
            <TabsTrigger
              value="benefits"
              className="flex-none rounded-none px-0 pb-3 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"
            >
              المزايا
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-0 w-full">
            <SettingsCard>
              <CompanyTab
                company={company}
                onSaved={(c) => setCompany(c)}
              />
            </SettingsCard>
          </TabsContent>
          <TabsContent value="admin" className="mt-0 w-full">
            <SettingsCard>
              <AdminTab
                email={user?.email ?? ""}
                fullName={user?.fullName ?? ""}
                phone={user?.phone ?? ""}
                jobTitle={user?.jobTitle ?? ""}
                onSaved={refreshSession}
              />
            </SettingsCard>
          </TabsContent>
          <TabsContent value="attendance" className="mt-0 w-full">
            <SettingsCard>
              <AttendanceTab policy={policy} onSaved={setPolicy} />
            </SettingsCard>
          </TabsContent>
          <TabsContent value="payroll" className="mt-0 w-full">
            <SettingsCard>
              <PayrollTab policy={policy} onSaved={setPolicy} />
            </SettingsCard>
          </TabsContent>
          <TabsContent value="benefits" className="mt-0 w-full">
            <SettingsCard>
              <BenefitsTab policy={policy} onSaved={setPolicy} />
            </SettingsCard>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

function CompanyTab({
  company,
  onSaved,
}: {
  company: CompanyResponse | null
  onSaved: (c: CompanyResponse) => void
}) {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(
    company?.logoUrl ?? null,
  )
  const [logoUploading, setLogoUploading] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const form = useForm<CompanyProfileValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: company?.name ?? "",
      website: company?.website ?? "",
      industry: company?.industry ?? "",
    },
    mode: "onChange",
  })

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار صورة للشعار")
      return
    }
    setLogoUploading(true)
    try {
      const uploaded = await uploadFile(file)
      setLogoUrl(uploaded.url)
      toast.success("تم رفع الشعار")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر رفع الشعار")
    } finally {
      setLogoUploading(false)
    }
  }

  async function onSubmit(values: CompanyProfileValues) {
    setPending(true)
    try {
      const updated = await apiFetch<CompanyResponse>("/company", {
        method: "PATCH",
        body: {
          name: values.companyName,
          website: values.website,
          industry: values.industry,
          ...(logoUrl ? { logoUrl } : {}),
        },
      })
      onSaved(updated)
      toast.success("تم حفظ ملف الشركة")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحفظ")
    } finally {
      setPending(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={logoUploading}
            className="flex size-20 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#c8e6c9] bg-[#F5FBF5]"
          >
            {logoUploading ? (
              <Loader2 className="size-6 animate-spin text-primary" />
            ) : logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <UploadCloud className="size-6 text-primary" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-primary hover:underline"
          >
            تغيير شعار الشركة
          </button>
        </div>

        <FormInput
          name="companyName"
          label="اسم الشركة"
          formType="input"
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            name="website"
            label="الموقع الالكتروني"
            formType="input"
            required
          />
          <FormInput
            name="industry"
            label="قطاع العمل"
            formType="select"
            options={INDUSTRY_OPTIONS}
            required
          />
        </div>
        <SaveBar pending={pending} disabled={logoUploading} />
      </form>
    </Form>
  )
}

function AdminTab({
  email,
  fullName,
  phone,
  jobTitle,
  onSaved,
}: {
  email: string
  fullName: string
  phone: string
  jobTitle: string
  onSaved: () => Promise<void>
}) {
  const [pending, setPending] = React.useState(false)
  const form = useForm<AdminProfileValues>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: {
      email,
      fullName,
      phone: phone.replace(/\D/g, "").replace(/^966/, "").replace(/^0/, ""),
      jobTitle,
    },
    mode: "onChange",
  })

  async function onSubmit(values: AdminProfileValues) {
    setPending(true)
    try {
      await apiFetch("/auth/profile", {
        method: "PATCH",
        body: {
          fullName: values.fullName,
          phone: values.phone,
          jobTitle: values.jobTitle,
        },
      })
      await onSaved()
      toast.success("تم حفظ بيانات المسؤول")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحفظ")
    } finally {
      setPending(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            name="jobTitle"
            label="المسمى الوظيفي"
            formType="input"
            required
          />
          <FormInput
            name="fullName"
            label="الاسم الكامل"
            formType="input"
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            name="phone"
            label="رقم الجوال"
            formType="phone"
            placeholder="50 123 4567"
            required
          />
          <FormInput
            name="email"
            label="البريد الالكتروني"
            formType="input"
            inputType="email"
            required
            disabled
          />
        </div>
        <p className="text-xs text-muted-foreground">
          لا يمكن تعديل البريد الإلكتروني بعد إنشاء الحساب.
        </p>
        <SaveBar pending={pending} />
      </form>
    </Form>
  )
}

function AttendanceTab({
  policy,
  onSaved,
}: {
  policy: PolicyResponse | null
  onSaved: (p: PolicyResponse) => void
}) {
  const [workDays, setWorkDays] = React.useState<string[]>(
    () => weekendDaysToWorkDays(policy?.defaultWeekendDays) || DEFAULT_WORK_DAYS,
  )
  const [savingDays, setSavingDays] = React.useState(false)
  const [shifts, setShifts] = React.useState<
    {
      id: string
      name: string
      startTime: string
      endTime: string
      gracePeriodMinutes: number
    }[]
  >([])
  const [loadingShifts, setLoadingShifts] = React.useState(true)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState({
    name: "",
    startTime: "08:00",
    endTime: "17:00",
    gracePeriodMinutes: 15,
  })
  const [savingShift, setSavingShift] = React.useState(false)
  const [deleteShift, setDeleteShift] = React.useState<{
    id: string
    name: string
  } | null>(null)
  const [deletingShift, setDeletingShift] = React.useState(false)

  const loadShifts = React.useCallback(async () => {
    setLoadingShifts(true)
    try {
      const res = await apiFetch<{
        data: {
          id: string
          name: string
          startTime: string
          endTime: string
          gracePeriodMinutes: number
        }[]
      }>("/shifts?limit=50&page=1")
      setShifts(res.data ?? [])
    } catch {
      setShifts([])
    } finally {
      setLoadingShifts(false)
    }
  }, [])

  React.useEffect(() => {
    void loadShifts()
  }, [loadShifts])

  React.useEffect(() => {
    setWorkDays(
      weekendDaysToWorkDays(policy?.defaultWeekendDays) || DEFAULT_WORK_DAYS,
    )
  }, [policy?.defaultWeekendDays])

  async function saveWorkDays() {
    if (!workDays.length) {
      toast.error("اختر يوم عمل واحد على الأقل")
      return
    }
    setSavingDays(true)
    try {
      const updated = await apiFetch<PolicyResponse>("/company/policy", {
        method: "PATCH",
        body: { defaultWeekendDays: workDaysToWeekendDays(workDays) },
      })
      onSaved(updated)
      toast.success("تم حفظ أيام العمل")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحفظ")
    } finally {
      setSavingDays(false)
    }
  }

  function startCreate() {
    setEditingId("__new__")
    setDraft({
      name: "",
      startTime: "08:00",
      endTime: "17:00",
      gracePeriodMinutes: 15,
    })
  }

  function startEdit(s: (typeof shifts)[number]) {
    setEditingId(s.id)
    setDraft({
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      gracePeriodMinutes: s.gracePeriodMinutes,
    })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveShift() {
    if (!draft.name.trim()) {
      toast.error("اسم الوردية مطلوب")
      return
    }
    setSavingShift(true)
    try {
      if (editingId === "__new__") {
        await apiFetch("/shifts", {
          method: "POST",
          body: {
            name: draft.name.trim(),
            startTime: draft.startTime,
            endTime: draft.endTime,
            gracePeriodMinutes: draft.gracePeriodMinutes,
          },
        })
        toast.success("تم إضافة الوردية")
      } else if (editingId) {
        await apiFetch(`/shifts/${editingId}`, {
          method: "PATCH",
          body: {
            name: draft.name.trim(),
            startTime: draft.startTime,
            endTime: draft.endTime,
            gracePeriodMinutes: draft.gracePeriodMinutes,
          },
        })
        toast.success("تم تحديث الوردية")
      }
      setEditingId(null)
      await loadShifts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حفظ الوردية")
    } finally {
      setSavingShift(false)
    }
  }

  async function confirmRemoveShift() {
    if (!deleteShift) return
    setDeletingShift(true)
    try {
      await apiFetch(`/shifts/${deleteShift.id}`, { method: "DELETE" })
      toast.success("تم حذف الوردية")
      if (editingId === deleteShift.id) setEditingId(null)
      setDeleteShift(null)
      await loadShifts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحذف")
    } finally {
      setDeletingShift(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Company work days */}
      <section className="space-y-4">
        <div>
          <h3 className="font-almarai text-base font-bold">أيام العمل</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            أيام عمل الشركة الافتراضية (نهاية الأسبوع = الأيام غير المحددة).
          </p>
        </div>
        <ToggleGroup
          multiple
          value={workDays}
          onValueChange={(v) => {
            if (v.length) setWorkDays(v)
          }}
          spacing={2}
          className="flex w-full flex-wrap gap-2"
        >
          {WORK_DAYS.map((day) => (
            <ToggleGroupItem
              key={day.value}
              value={day.value}
              className="h-10 min-w-[4.5rem] flex-1 rounded-[6px] border border-[#d6d6d6] bg-white text-sm aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {day.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          type="button"
          className="rounded-lg"
          disabled={savingDays}
          onClick={() => void saveWorkDays()}
        >
          {savingDays ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "حفظ أيام العمل"
          )}
        </Button>
      </section>

      {/* Shifts */}
      <section className="space-y-4 border-t border-border/70 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-almarai text-base font-bold">الورديات</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              أنشئ ورديات متعددة (صباحية / مسائية / ليلية) ثم عيّن لكل موظف
              ورديته عند الإضافة أو التعديل.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-lg"
            disabled={editingId === "__new__"}
            onClick={startCreate}
          >
            + إضافة وردية
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-[6px] bg-[#EAF7EA] px-4 py-3 text-sm text-primary">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            مواعيد الشركة أيام العمل عامة. ساعات الحضور الفعلية والتأخير تُحسب
            من <strong>وردية الموظف</strong> المحددة له.
          </p>
        </div>

        {loadingShifts ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.length === 0 && editingId !== "__new__" ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                لا توجد ورديات بعد — أضف وردية واحدة على الأقل قبل تعيينها
                للموظفين.
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shifts.map((s) =>
              editingId === s.id ? (
                <div key={s.id} className="sm:col-span-2 xl:col-span-3">
                <ShiftEditor
                  draft={draft}
                  setDraft={setDraft}
                  saving={savingShift}
                  onCancel={cancelEdit}
                  onSave={() => void saveShift()}
                />
                </div>
              ) : (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/80 bg-white p-4 shadow-[0_1px_2px_rgb(0,0,0,0.03)]"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                      {formatTime12h(s.startTime)} – {formatTime12h(s.endTime)}
                      <span className="mx-2 text-border">|</span>
                      سماح {s.gracePeriodMinutes} دقيقة
                    </p>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => startEdit(s)}
                    >
                      تعديل
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        setDeleteShift({ id: s.id, name: s.name })
                      }
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              ),
            )}
            </div>

            {editingId === "__new__" ? (
              <ShiftEditor
                draft={draft}
                setDraft={setDraft}
                saving={savingShift}
                onCancel={cancelEdit}
                onSave={() => void saveShift()}
              />
            ) : null}
          </div>
        )}
      </section>

      <ConfirmDeleteDialog
        open={deleteShift != null}
        onOpenChange={(open) => {
          if (!open && !deletingShift) setDeleteShift(null)
        }}
        title={
          deleteShift
            ? `حذف الوردية «${deleteShift.name}»؟`
            : "حذف الوردية؟"
        }
        description="سيتم حذف الوردية نهائيًا. لا يمكن التراجع عن هذا الإجراء."
        loading={deletingShift}
        onConfirm={confirmRemoveShift}
      />
    </div>
  )
}

function ShiftEditor({
  draft,
  setDraft,
  saving,
  onCancel,
  onSave,
}: {
  draft: {
    name: string
    startTime: string
    endTime: string
    gracePeriodMinutes: number
  }
  setDraft: React.Dispatch<
    React.SetStateAction<{
      name: string
      startTime: string
      endTime: string
      gracePeriodMinutes: number
    }>
  >
  saving: boolean
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium">اسم الوردية</label>
          <input
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="مثال: الوردية الصباحية"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">من</label>
          <input
            type="time"
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            value={draft.startTime}
            onChange={(e) =>
              setDraft((d) => ({ ...d, startTime: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">إلى</label>
          <input
            type="time"
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            value={draft.endTime}
            onChange={(e) =>
              setDraft((d) => ({ ...d, endTime: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">فترة السماح (دقائق)</label>
          <input
            type="number"
            min={0}
            max={240}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            value={draft.gracePeriodMinutes}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                gracePeriodMinutes: Number(e.target.value) || 0,
              }))
            }
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          className="rounded-lg"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : "حفظ الوردية"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          disabled={saving}
          onClick={onCancel}
        >
          إلغاء
        </Button>
      </div>
    </div>
  )
}

function PayrollTab({
  policy,
  onSaved,
}: {
  policy: PolicyResponse | null
  onSaved: (p: PolicyResponse) => void
}) {
  const [pending, setPending] = React.useState(false)
  const form = useForm<PayrollSettingsInput, unknown, PayrollSettingsValues>({
    resolver: zodResolver(payrollSettingsSchema),
    defaultValues: {
      currency: policy?.currency ?? "SAR",
      cycle: apiCycleToForm(policy?.payrollCycle),
      payoutDay: policy?.payrollPayoutDay ?? 27,
      directDeposit: policy?.directBankTransfer ?? true,
    },
    mode: "onChange",
  })
  const cycle = form.watch("cycle") as string
  const currency = form.watch("currency") as string
  const directDeposit = form.watch("directDeposit") as boolean

  async function onSubmit(values: PayrollSettingsValues) {
    setPending(true)
    try {
      const updated = await apiFetch<PolicyResponse>("/company/policy", {
        method: "PATCH",
        body: {
          currency: values.currency,
          payrollCycle: cycleToApi(values.cycle),
          payrollPayoutDay: values.payoutDay,
          directBankTransfer: values.directDeposit,
        },
      })
      onSaved(updated)
      toast.success("تم حفظ إعدادات الرواتب")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحفظ")
    } finally {
      setPending(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="space-y-2.5">
          <label className="text-sm font-medium">العملة</label>
          <Select
            value={currency}
            onValueChange={(v) => {
              if (v !== null)
                form.setValue("currency", v, { shouldValidate: true })
            }}
          >
            <SelectTrigger className="h-12! w-full! rounded-[6px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2.5">
          <label className="text-sm font-medium">دورة الرواتب</label>
          <ToggleGroup
            multiple={false}
            value={cycle ? [cycle] : []}
            onValueChange={(v) => {
              if (v[0]) form.setValue("cycle", v[0], { shouldValidate: true })
            }}
            className="w-full gap-2"
          >
            {CYCLES.map((opt) => (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                className="h-10 flex-1 rounded-[6px] border border-[#d6d6d6] text-sm data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="max-w-xs">
          <FormInput
            name="payoutDay"
            label="يوم صرف الرواتب"
            formType="input"
            inputType="number"
            required
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-[6px] border p-4">
          <div>
            <p className="font-medium">تفعيل التحويل البنكي المباشر</p>
            <p className="mt-1 text-sm text-muted-foreground">
              تمكين دفع الرواتب عبر الربط المصرفي.
            </p>
          </div>
          <Switch
            checked={directDeposit}
            onCheckedChange={(v) =>
              form.setValue("directDeposit", v, { shouldValidate: true })
            }
          />
        </div>
        <SaveBar pending={pending} />
      </form>
    </Form>
  )
}

function BenefitsTab({
  policy,
  onSaved,
}: {
  policy: PolicyResponse | null
  onSaved: (p: PolicyResponse) => void
}) {
  const [pending, setPending] = React.useState(false)
  const form = useForm<BenefitsSettingsValues>({
    resolver: zodResolver(benefitsSettingsSchema),
    defaultValues: {
      provider: policy?.medicalInsuranceProvider ?? "",
      tier: policy?.medicalInsuranceTier ?? "B",
      gosiEnabled: policy?.gosiAutoEnroll ?? true,
      housingAllowance: policy?.benefitHousingAllowance ?? false,
      transportAllowance: policy?.benefitTransportAllowance ?? false,
      annualTickets: policy?.benefitAnnualTickets ?? false,
      directDeposit: policy?.directBankTransfer ?? false,
      housingAmount: Number(policy?.benefitHousingAllowanceAmount ?? 25),
      housingIsPercentage: policy?.benefitHousingAllowanceIsPercentage ?? true,
      transportAmount: Number(policy?.benefitTransportAllowanceAmount ?? 500),
      annualTicketsAmount: Number(policy?.benefitAnnualTicketsAmount ?? 3600),
    },
    mode: "onChange",
  })
  const values = form.watch()

  async function onSubmit(data: BenefitsSettingsValues) {
    setPending(true)
    try {
      const updated = await apiFetch<PolicyResponse>("/company/policy", {
        method: "PATCH",
        body: {
          medicalInsuranceProvider: data.provider || undefined,
          medicalInsuranceTier: data.tier || undefined,
          gosiAutoEnroll: data.gosiEnabled,
          benefitHousingAllowance: data.housingAllowance,
          benefitHousingAllowanceAmount: data.housingAllowance
            ? Number(data.housingAmount)
            : undefined,
          benefitHousingAllowanceIsPercentage: data.housingIsPercentage,
          benefitTransportAllowance: data.transportAllowance,
          benefitTransportAllowanceAmount: data.transportAllowance
            ? Number(data.transportAmount)
            : undefined,
          benefitAnnualTickets: data.annualTickets,
          benefitAnnualTicketsAmount: data.annualTickets
            ? Number(data.annualTicketsAmount)
            : undefined,
          directBankTransfer: data.directDeposit,
        },
      })
      onSaved(updated)
      toast.success("تم حفظ المزايا والتأمينات")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحفظ")
    } finally {
      setPending(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2.5">
            <label className="text-sm font-medium">مزود التأمين</label>
            <Select
              value={values.provider || null}
              onValueChange={(v) => {
                if (v !== null)
                  form.setValue("provider", v, { shouldValidate: true })
              }}
            >
              <SelectTrigger className="h-12! w-full! rounded-[6px]">
                <SelectValue placeholder="اختر مزود التأمين" />
              </SelectTrigger>
              <SelectContent>
                {INSURANCE_PROVIDERS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2.5">
            <label className="text-sm font-medium">فئة التأمين</label>
            <ToggleGroup
              multiple={false}
              value={values.tier ? [values.tier] : []}
              onValueChange={(v) => {
                if (v[0]) form.setValue("tier", v[0], { shouldValidate: true })
              }}
              className="w-full gap-2"
            >
              {INSURANCE_TIERS.map((t) => (
                <ToggleGroupItem
                  key={t}
                  value={t}
                  className="h-12 flex-1 rounded-[6px] border border-[#d6d6d6] text-sm data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {t}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-[6px] border p-4">
          <div>
            <p className="font-medium">التأمينات الاجتماعية (GOSI)</p>
            <p className="mt-1 text-sm text-muted-foreground">
              التسجيل التلقائي للموظفين الجدد
            </p>
          </div>
          <Switch
            checked={values.gosiEnabled}
            onCheckedChange={(v) =>
              form.setValue("gosiEnabled", v, { shouldValidate: true })
            }
          />
        </div>

        <BenefitRow
          checked={values.housingAllowance}
          onToggle={() =>
            form.setValue("housingAllowance", !values.housingAllowance, {
              shouldValidate: true,
            })
          }
          title="بدل سكن"
          description="نسبة من الراتب أو مبلغ ثابت"
        >
          {values.housingAllowance && (
            <div className="space-y-2">
              <FormInput
                name="housingAmount"
                label={
                  values.housingIsPercentage
                    ? "النسبة (%)"
                    : "المبلغ الشهري (ريال)"
                }
                formType="input"
                inputType="number"
                required
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={values.housingIsPercentage}
                  onCheckedChange={(c) =>
                    form.setValue("housingIsPercentage", c === true, {
                      shouldValidate: true,
                    })
                  }
                />
                احتساب كنسبة من الراتب الأساسي
              </label>
            </div>
          )}
        </BenefitRow>

        <BenefitRow
          checked={values.transportAllowance}
          onToggle={() =>
            form.setValue("transportAllowance", !values.transportAllowance, {
              shouldValidate: true,
            })
          }
          title="بدل مواصلات"
          description="قيمة ثابتة شهرياً"
        >
          {values.transportAllowance && (
            <FormInput
              name="transportAmount"
              label="المبلغ الشهري (ريال)"
              formType="input"
              inputType="number"
              required
            />
          )}
        </BenefitRow>

        <BenefitRow
          checked={values.annualTickets}
          onToggle={() =>
            form.setValue("annualTickets", !values.annualTickets, {
              shouldValidate: true,
            })
          }
          title="تذاكر سنوية"
          description="قيمة سنوية تُحتسب شهرياً (÷ 12)"
        >
          {values.annualTickets && (
            <FormInput
              name="annualTicketsAmount"
              label="القيمة السنوية (ريال)"
              formType="input"
              inputType="number"
              required
            />
          )}
        </BenefitRow>

        <SaveBar pending={pending} />
      </form>
    </Form>
  )
}

function BenefitRow({
  checked,
  onToggle,
  title,
  description,
  children,
}: {
  checked: boolean
  onToggle: () => void
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[6px] border p-4",
        checked ? "border-primary bg-primary/5" : "border-[#d6d6d6]",
      )}
    >
      <label className="flex cursor-pointer items-start gap-2.5">
        <Checkbox checked={checked} onCheckedChange={onToggle} className="mt-0.5" />
        <span>
          <span className="block text-sm font-medium">{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        </span>
      </label>
      {children}
    </div>
  )
}
