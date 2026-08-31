"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CheckIcon,
  Loader2Icon,
  PlusIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { CreateSuccessDialog } from "@/components/employees/create/create-dialogs"
import {
  EMPLOYMENT_TYPE_EDIT_AR,
  GENDER_AR,
  JOB_RANK_AR,
  MARITAL_STATUS_AR,
  SALARY_BASIS_AR,
  WORK_LOCATION_AR,
  arabicInitials,
  toE164Sa,
  type Gender,
  type JobRank,
  type MaritalStatus,
  type WorkLocation,
} from "@/components/employees/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiFetch, uploadFile } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { PhoneInput, DatePicker, Combobox } from "@/components/form"
import {
  fetchDepartmentOption,
  fetchDepartmentOptions,
  fetchEmployeeOption,
  fetchEmployeeOptions,
  fetchShiftOption,
  fetchShiftOptions,
} from "@/lib/lazy-options"

const STEPS = [
  {
    id: 1,
    title: "المعلومات الأساسية",
    desc: "الاسم، بيانات التواصل، الصورة",
  },
  {
    id: 2,
    title: "المعلومات الشخصية",
    desc: "الهوية، الحالة الاجتماعية، العنوان",
  },
  {
    id: 3,
    title: "تفاصيل الوظيفة",
    desc: "المسمى الوظيفي، القسم، تواريخ التوظيف",
  },
  {
    id: 4,
    title: "إعدادات الرواتب",
    desc: "الراتب الأساسي، البنك، المزايا",
  },
] as const

type WizardState = {
  name: string
  email: string
  phoneLocal: string
  photoUrl: string
  nationalId: string
  dateOfBirth: string
  gender: Gender | ""
  maritalStatus: MaritalStatus | ""
  address: string
  emergencyContactName: string
  emergencyContactRelation: string
  emergencyContactPhone: string
  departmentId: string
  subDepartment: string
  managerId: string
  position: string
  employmentType: "PERMANENT" | "CONTRACT" | "TEMPORARY" | "PROBATION"
  contractDurationYears: string
  workLocation: WorkLocation
  hireDate: string
  jobRank: JobRank
  shiftId: string
  probationDays: string
  salaryBasis: "MONTHLY" | "DAILY" | "HOURLY"
  basicSalary: string
  bankName: string
  iban: string
  hasHealthInsurance: boolean
  isGosiRegistered: boolean
  hasTransportAllowance: boolean
  hasHousingAllowance: boolean
  hasMealAllowance: boolean
}

const INITIAL: WizardState = {
  name: "",
  email: "",
  phoneLocal: "",
  photoUrl: "",
  nationalId: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  address: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",
  departmentId: "",
  subDepartment: "",
  managerId: "",
  position: "",
  employmentType: "PERMANENT",
  contractDurationYears: "1",
  workLocation: "HEADQUARTERS",
  hireDate: "",
  jobRank: "EMPLOYEE",
  shiftId: "",
  probationDays: "90",
  salaryBasis: "MONTHLY",
  basicSalary: "0",
  bankName: "",
  iban: "",
  hasHealthInsurance: true,
  isGosiRegistered: true,
  hasTransportAllowance: false,
  hasHousingAllowance: false,
  hasMealAllowance: false,
}

type Patch = <K extends keyof WizardState>(
  key: K,
  value: WizardState[K],
) => void

export function EmployeeCreateWizard() {
  const router = useRouter()
  const [step, setStep] = React.useState(1) // 1-4 form, 5 = summary
  const [form, setForm] = React.useState<WizardState>(INITIAL)
  const [shiftsCount, setShiftsCount] = React.useState<number | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [successOpen, setSuccessOpen] = React.useState(false)
  const [createdId, setCreatedId] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const page = await fetchShiftOptions({ page: 1, limit: 1 })
        if (cancelled) return
        setShiftsCount(page.meta.itemCount)
        if (page.data[0] && !form.shiftId) {
          setForm((prev) =>
            prev.shiftId ? prev : { ...prev, shiftId: page.data[0]!.value },
          )
        }
      } catch {
        if (!cancelled) setShiftsCount(0)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [])

  function patch<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!form.name.trim()) return "الاسم الكامل مطلوب"
      if (!form.email.trim()) return "البريد الإلكتروني مطلوب"
      if (!form.phoneLocal.trim()) return "رقم الهاتف مطلوب"
    }
    if (s === 2) {
      if (!form.nationalId.trim()) return "رقم الهوية / جواز السفر مطلوب"
      if (!form.dateOfBirth) return "تاريخ الميلاد مطلوب"
      if (!form.gender) return "الجنس مطلوب"
      if (!form.maritalStatus) return "الحالة الاجتماعية مطلوبة"
      if (!form.address.trim()) return "عنوان السكن مطلوب"
    }
    if (s === 3) {
      if (!form.departmentId) return "القسم مطلوب"
      if (!form.managerId) return "المدير المباشر مطلوب"
      if (!form.position.trim()) return "المسمى الوظيفي مطلوب"
      if (!form.contractDurationYears.trim()) return "مدة العقد مطلوبة"
      if (!form.hireDate) return "تاريخ التعيين مطلوب"
      if (shiftsCount && shiftsCount > 0 && !form.shiftId)
        return "الوردية مطلوبة"
    }
    if (s === 4) {
      const sal = Number(form.basicSalary)
      if (!Number.isFinite(sal) || sal < 0) return "الراتب الأساسي غير صالح"
      if (!form.bankName.trim()) return "اسم البنك مطلوب"
      if (!form.iban.trim()) return "رقم الآيبان مطلوب"
    }
    return null
  }

  function goNext() {
    const err = validateStep(step)
    if (err) {
      toast.error(err)
      return
    }
    setStep((s) => Math.min(5, s + 1))
  }

  function goPrev() {
    setStep((s) => Math.max(1, s - 1))
  }

  /** Jump via sidebar — back always ok; forward validates every skipped step. */
  function goToStep(target: number) {
    if (target < 1 || target > 4 || target === step) return
    if (target < step || step === 5) {
      setStep(target)
      return
    }
    for (let s = 1; s < target; s++) {
      const err = validateStep(s)
      if (err) {
        toast.error(err)
        setStep(s)
        return
      }
    }
    setStep(target)
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("يجب ألا تتعدى الصورة 5MB")
      return
    }
    setUploading(true)
    try {
      const res = await uploadFile(file)
      patch("photoUrl", res.url)
      toast.success("تم رفع الصورة")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر رفع الصورة")
    } finally {
      setUploading(false)
    }
  }

  async function submit() {
    setSaving(true)
    try {
      const basic = Number(form.basicSalary)
      const years = Number(form.contractDurationYears)
      const probation = Number(form.probationDays)
      const created = await apiFetch<{ id: string }>("/employees", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: toE164Sa(form.phoneLocal),
          photoUrl: form.photoUrl || undefined,
          nationalId: form.nationalId.trim(),
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || undefined,
          maritalStatus: form.maritalStatus || undefined,
          address: form.address.trim(),
          emergencyContactName: form.emergencyContactName.trim() || undefined,
          emergencyContactRelation:
            form.emergencyContactRelation.trim() || undefined,
          emergencyContactPhone: form.emergencyContactPhone.trim()
            ? toE164Sa(form.emergencyContactPhone)
            : undefined,
          departmentId: form.departmentId || undefined,
          subDepartment: form.subDepartment.trim() || undefined,
          managerId: form.managerId || undefined,
          position: form.position.trim(),
          employmentType: form.employmentType,
          contractDurationYears: Number.isFinite(years) ? years : undefined,
          workLocation: form.workLocation,
          hireDate: form.hireDate || undefined,
          jobRank: form.jobRank,
          shiftId: form.shiftId || undefined,
          probationDays: Number.isFinite(probation) ? probation : undefined,
          salaryBasis: form.salaryBasis,
          basicSalary: basic,
          bankName: form.bankName.trim(),
          iban: form.iban.trim(),
          isGosiRegistered: form.isGosiRegistered,
          hasHealthInsurance: form.hasHealthInsurance,
          hasTransportAllowance: form.hasTransportAllowance,
          hasHousingAllowance: form.hasHousingAllowance,
          hasMealAllowance: form.hasMealAllowance,
        },
      })
      setCreatedId(created.id)
      setSuccessOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر إنشاء الموظف")
    } finally {
      setSaving(false)
    }
  }

  const currentStepMeta = STEPS[Math.min(step, 4) - 1]!
  const headerSubtitle =
    step === 5
      ? "ملخص حساب الموظف"
      : `خطوة رقم ${step} من أصل 4 خطوات • ${currentStepMeta.title}`

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <h1 className="font-almarai text-xl font-bold sm:text-2xl">
              إضافة موظف جديد
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {headerSubtitle}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => router.push("/employees")}
          >
            إلغاء
          </Button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[315px_1fr]">
          {/* Stepper */}
          <aside className="flex flex-col gap-4 border-b border-border/70 px-4 py-6 lg:border-b-0 lg:border-e lg:border-e-border">
            <ol className="flex flex-col gap-4">
              {STEPS.map((s) => {
                const done = step > s.id || (step === 5 && s.id <= 4)
                const active = step === s.id
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goToStep(s.id)}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-start transition-colors",
                        "cursor-pointer hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        done && !active && "border-primary bg-primary text-white",
                        active &&
                          "border-primary bg-primary/10 text-primary",
                        !done &&
                          !active &&
                          "border-border/80 bg-white text-foreground hover:border-primary/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          done && !active && "bg-white/20 text-white",
                          active && "border border-primary bg-white text-primary",
                          !done &&
                            !active &&
                            "border border-border text-muted-foreground",
                        )}
                      >
                        {done && !active ? (
                          <CheckIcon className="size-3.5" />
                        ) : (
                          String(s.id).padStart(2, "0")
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug">
                          {s.title}
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 text-xs leading-snug",
                            done && !active
                              ? "text-white/80"
                              : active
                                ? "text-primary/80"
                                : "text-muted-foreground",
                          )}
                        >
                          {s.desc}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ol>
          </aside>

          {/* Content */}
          <div className="flex min-h-[28rem] flex-col">
            <div className="flex-1 space-y-5 p-5 sm:p-6">
              {step === 1 ? (
                <StepBasic
                  form={form}
                  patch={patch}
                  uploading={uploading}
                  fileRef={fileRef}
                  onPhoto={onPhoto}
                />
              ) : null}
              {step === 2 ? <StepPersonal form={form} patch={patch} /> : null}
              {step === 3 ? (
                <StepJob
                  form={form}
                  patch={patch}
                  shiftsCount={shiftsCount}
                />
              ) : null}
              {step === 4 ? <StepPayroll form={form} patch={patch} /> : null}
              {step === 5 ? <StepSummary form={form} /> : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-4 sm:px-6">
              {step === 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => router.push("/employees")}
                >
                  إلغاء
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={goPrev}
                  disabled={saving}
                >
                  السابق
                </Button>
              )}

              {step < 5 ? (
                <Button
                  type="button"
                  className="rounded-lg"
                  onClick={goNext}
                >
                  التالي
                </Button>
              ) : (
                <Button
                  type="button"
                  className="gap-1.5 rounded-lg"
                  disabled={saving}
                  onClick={() => void submit()}
                >
                  {saving ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <PlusIcon className="size-4" />
                  )}
                  إضافة الموظف
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateSuccessDialog
        open={successOpen}
        employeeId={createdId}
        onOpenChange={setSuccessOpen}
        onAddAnother={() => {
          setSuccessOpen(false)
          setCreatedId(null)
          setForm(INITIAL)
          setStep(1)
        }}
      />
    </>
  )
}

function Field({
  label,
  required,
  children,
  className,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
  hint?: React.ReactNode
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint ? (
        <div className="text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  )
}

function PhoneField({
  value,
  onChange,
  placeholder = "5X XXX XXXX",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <PhoneInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      countryIso2="SA"
      returnFullPhone={false}
    />
  )
}

function StepBasic({
  form,
  patch,
  uploading,
  fileRef,
  onPhoto,
}: {
  form: WizardState
  patch: Patch
  uploading: boolean
  fileRef: React.RefObject<HTMLInputElement | null>
  onPhoto: (file: File | undefined) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-almarai text-lg font-bold">المعلومات الأساسية</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            بيانات الهوية الأساسية المستخدمة في جميع أنحاء النظام.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
            {form.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.photoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <UserIcon className="size-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void onPhoto(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <UploadIcon className="size-3.5" />
              )}
              رفع صورة
            </Button>
            <p className="mt-1 max-w-[12rem] text-[11px] text-muted-foreground">
              ارفع الصورة بصيغة JPG أو PNG، يجب ألا تتعدى الصورة 5MB
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم الكامل" required>
          <Input
            value={form.name}
            onChange={(e) => patch("name", e.target.value)}
            className="h-10 rounded-lg"
            placeholder="مهاب محمد"
          />
        </Field>
        <Field label="البريد الإلكتروني للعمل" required>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => patch("email", e.target.value)}
            className="h-10 rounded-lg"
            placeholder="name@company.com"
            dir="ltr"
          />
        </Field>
        <Field label="رقم الهاتف" required>
          <PhoneField
            value={form.phoneLocal}
            onChange={(v) => patch("phoneLocal", v)}
          />
        </Field>
        <Field label="رقم الموظف">
          <Input
            value="يتم تعيينه تلقائياً من قبل النظام"
            disabled
            className="h-10 rounded-lg bg-muted/40"
          />
        </Field>
      </div>
    </div>
  )
}

function StepPersonal({
  form,
  patch,
}: {
  form: WizardState
  patch: Patch
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-almarai text-lg font-bold">المعلومات الشخصية</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          بيانات شخصية محمية وتُستخدم للامتثال والسجلات الرسمية فقط.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="رقم الهوية الوطنية / جواز السفر" required>
          <Input
            value={form.nationalId}
            onChange={(e) => patch("nationalId", e.target.value)}
            className="h-10 rounded-lg"
            placeholder="مثال: 29801234567890"
            dir="ltr"
          />
        </Field>
        <Field label="تاريخ الميلاد" required>
          <DatePicker
            value={form.dateOfBirth}
            onChange={(v) => patch("dateOfBirth", v)}
            placeholder="اختر تاريخ الميلاد"
            max={new Date().toISOString().slice(0, 10)}
            fromYear={1940}
            toYear={new Date().getFullYear()}
          />
        </Field>
        <Field label="الجنس" required>
          <Select
            value={form.gender || null}
            onValueChange={(v) => {
              if (v) patch("gender", v as Gender)
            }}
          >
            <SelectTrigger className="h-10! w-full rounded-lg">
              <SelectValue placeholder="ذكر/أنثى">
                {(v: string | null) =>
                  (v && GENDER_AR[v as Gender]) || "ذكر/أنثى"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(GENDER_AR) as Gender[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {GENDER_AR[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="الحالة الاجتماعية" required>
          <Select
            value={form.maritalStatus || null}
            onValueChange={(v) => {
              if (v) patch("maritalStatus", v as MaritalStatus)
            }}
          >
            <SelectTrigger className="h-10! w-full rounded-lg">
              <SelectValue placeholder="أعزب / عزباء">
                {(v: string | null) =>
                  (v && MARITAL_STATUS_AR[v as MaritalStatus]) ||
                  "أعزب / عزباء"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MARITAL_STATUS_AR) as MaritalStatus[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {MARITAL_STATUS_AR[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="عنوان السكن" required className="sm:col-span-2">
          <Input
            value={form.address}
            onChange={(e) => patch("address", e.target.value)}
            className="h-10 rounded-lg"
            placeholder="الدولة، المدينة، الحي، الشارع"
          />
        </Field>
      </div>

      <div className="space-y-4 border-t border-border/70 pt-5">
        <h3 className="font-almarai text-base font-bold">
          جهة الاتصال في حالات الطوارئ
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم جهة الاتصال (اختياري)">
            <Input
              value={form.emergencyContactName}
              onChange={(e) => patch("emergencyContactName", e.target.value)}
              className="h-10 rounded-lg"
              placeholder="الاسم الكامل"
            />
          </Field>
          <Field label="صلة القرابة (اختياري)">
            <Input
              value={form.emergencyContactRelation}
              onChange={(e) =>
                patch("emergencyContactRelation", e.target.value)
              }
              className="h-10 rounded-lg"
              placeholder="الزوج / الزوجة"
            />
          </Field>
          <Field label="رقم الهاتف (اختياري)" className="sm:col-span-2">
            <PhoneField
              value={form.emergencyContactPhone}
              onChange={(v) => patch("emergencyContactPhone", v)}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

function StepJob({
  form,
  patch,
  shiftsCount,
}: {
  form: WizardState
  patch: Patch
  shiftsCount: number | null
}) {
  const hasShifts = (shiftsCount ?? 0) > 0
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-almarai text-lg font-bold">تفاصيل الوظيفة</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          تحدد هذه المعلومات مكان الموظف داخل المؤسسة وموعد بدء عمله.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="القسم" required>
          <Combobox
            value={form.departmentId}
            onValueChange={(v) => patch("departmentId", v)}
            queryKey="employee-create-departments"
            fetchFn={fetchDepartmentOptions}
            fetchItemFn={fetchDepartmentOption}
            placeholder="اختر القسم..."
            className="h-10!"
          />
        </Field>
        <Field label="القسم الفرعي (اختياري)">
          <Input
            value={form.subDepartment}
            onChange={(e) => patch("subDepartment", e.target.value)}
            className="h-10 rounded-lg"
            placeholder="اختر القسم الفرعي..."
          />
        </Field>
        <Field label="المدير المباشر" required>
          <Combobox
            value={form.managerId}
            onValueChange={(v) => patch("managerId", v)}
            queryKey="employee-create-managers"
            fetchFn={(params) =>
              fetchEmployeeOptions({ ...params, managersOnly: true })
            }
            fetchItemFn={fetchEmployeeOption}
            placeholder="اختر أو ادخل اسم المدير..."
            emptyText="لا يوجد مديرين — عيّن رتبة قائد فريق أو مدير قسم لموظفين أولاً"
            className="h-10!"
          />
        </Field>
        <Field label="المسمى الوظيفي" required>
          <Input
            value={form.position}
            onChange={(e) => patch("position", e.target.value)}
            className="h-10 rounded-lg"
            placeholder="مثال: مصمم جرافيك"
          />
        </Field>
        <Field label="نوع التوظيف" required>
          <Select
            value={form.employmentType}
            onValueChange={(v) => {
              if (v)
                patch(
                  "employmentType",
                  v as WizardState["employmentType"],
                )
            }}
          >
            <SelectTrigger className="h-10! w-full rounded-lg">
              <SelectValue>
                {(v: string | null) =>
                  (v && EMPLOYMENT_TYPE_EDIT_AR[v]) || v
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EMPLOYMENT_TYPE_EDIT_AR).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="مدة العقد (بالسنين)"
          required
          hint="يرجى كتابة مدة العقد كأرقام فقط (مثال: 1, 2, 3.5, 5)."
        >
          <Input
            type="number"
            min={0}
            step={0.5}
            value={form.contractDurationYears}
            onChange={(e) => patch("contractDurationYears", e.target.value)}
            className="h-10 rounded-lg"
            placeholder="مثال: 1"
            dir="ltr"
          />
        </Field>
        <Field label="مكان العمل" required>
          <Select
            value={form.workLocation}
            onValueChange={(v) => {
              if (v) patch("workLocation", v as WorkLocation)
            }}
          >
            <SelectTrigger className="h-10! w-full rounded-lg">
              <SelectValue>
                {(v: string | null) =>
                  (v && WORK_LOCATION_AR[v as WorkLocation]) || v
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(WORK_LOCATION_AR) as WorkLocation[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {WORK_LOCATION_AR[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="تاريخ التعيين" required>
          <DatePicker
            value={form.hireDate}
            onChange={(v) => patch("hireDate", v)}
            placeholder="اختر تاريخ التعيين"
          />
        </Field>
        <Field
          label="الوردية"
          required={hasShifts}
          hint={
            !hasShifts ? (
              <span>
                لا توجد ورديات — أضفها من{" "}
                <Link
                  href="/settings?tab=attendance"
                  className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  إعدادات الشركة › الحضور
                </Link>
                .
              </span>
            ) : (
              "تحدد مواعيد الحضور والانصراف وحساب التأخير لهذا الموظف."
            )
          }
        >
          <Combobox
            value={form.shiftId}
            onValueChange={(v) => patch("shiftId", v)}
            queryKey="employee-create-shifts"
            fetchFn={fetchShiftOptions}
            fetchItemFn={fetchShiftOption}
            placeholder="اختر الوردية..."
            emptyText="لا توجد ورديات"
            className="h-10!"
            disabled={!hasShifts && shiftsCount !== null}
          />
        </Field>
        <Field
          label="الرتبة الوظيفية"
          required
          className="sm:col-span-2"
          hint="اختر الرتبة الوظيفية للموظف (مثال: موظف، قائد فريق، مدير قسم...)"
        >
          <Select
            value={form.jobRank}
            onValueChange={(v) => {
              if (v) patch("jobRank", v as JobRank)
            }}
          >
            <SelectTrigger className="h-10! w-full max-w-md rounded-lg">
              <SelectValue>
                {(v: string | null) =>
                  (v && JOB_RANK_AR[v as JobRank]) || v
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(JOB_RANK_AR) as JobRank[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {JOB_RANK_AR[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="space-y-3 border-t border-border/70 pt-5">
        <h3 className="font-almarai text-base font-bold">فترة الاختبار</h3>
        <Field label="مدة فترة الاختبار (بالأيام)">
          <Input
            type="number"
            min={0}
            value={form.probationDays}
            onChange={(e) => patch("probationDays", e.target.value)}
            className="h-10 max-w-md rounded-lg"
            dir="ltr"
          />
        </Field>
      </div>
    </div>
  )
}

function StepPayroll({
  form,
  patch,
}: {
  form: WizardState
  patch: Patch
}) {
  const benefits: {
    key: keyof WizardState
    label: string
  }[] = [
    { key: "hasHealthInsurance", label: "التأمين الصحي" },
    { key: "isGosiRegistered", label: "التأمينات الاجتماعية" },
    { key: "hasTransportAllowance", label: "بدل مواصلات" },
    { key: "hasHousingAllowance", label: "بدل سكن" },
    { key: "hasMealAllowance", label: "بدل وجبات" },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-almarai text-lg font-bold">إعدادات الرواتب</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          حدّد دورة الراتب، الراتب الأساسي، وبيانات الحساب البنكي والمزايا.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="دورة الراتب" required>
          <Select
            value={form.salaryBasis}
            onValueChange={(v) => {
              if (v)
                patch("salaryBasis", v as WizardState["salaryBasis"])
            }}
          >
            <SelectTrigger className="h-10! w-full rounded-lg">
              <SelectValue>
                {(v: string | null) => (v && SALARY_BASIS_AR[v]) || v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SALARY_BASIS_AR).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="الراتب الأساسي" required>
          <Input
            type="number"
            min={0}
            step={100}
            value={form.basicSalary}
            onChange={(e) => patch("basicSalary", e.target.value)}
            className="h-10 rounded-lg"
            dir="ltr"
          />
        </Field>
        <Field label="اسم البنك" required>
          <Input
            value={form.bankName}
            onChange={(e) => patch("bankName", e.target.value)}
            className="h-10 rounded-lg"
            placeholder="مثال: البنك التجاري الدولي (CIB)"
          />
        </Field>
        <Field label="رقم الحساب / رقم الآيبان (IBAN)" required>
          <Input
            value={form.iban}
            onChange={(e) => patch("iban", e.target.value)}
            className="h-10 rounded-lg"
            placeholder="SA00 ACCT-000003 0000"
            dir="ltr"
          />
        </Field>
      </div>

      <div className="space-y-3">
        <h3 className="font-almarai text-base font-bold">المزايا</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {benefits.map((b) => {
            const checked = Boolean(form[b.key])
            return (
              <label
                key={b.key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/80 bg-white px-3 py-3"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) =>
                    patch(b.key, Boolean(v) as never)
                  }
                />
                <span className="text-sm font-medium">{b.label}</span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StepSummary({ form }: { form: WizardState }) {
  const [deptName, setDeptName] = React.useState("—")
  const [managerName, setManagerName] = React.useState("—")
  const [shiftName, setShiftName] = React.useState("—")

  React.useEffect(() => {
    if (!form.departmentId) {
      setDeptName("—")
      return
    }
    void fetchDepartmentOption(form.departmentId).then((o) =>
      setDeptName(o?.label ?? "—"),
    )
  }, [form.departmentId])

  React.useEffect(() => {
    if (!form.managerId) {
      setManagerName("—")
      return
    }
    void fetchEmployeeOption(form.managerId).then((o) =>
      setManagerName(o?.label ?? "—"),
    )
  }, [form.managerId])

  React.useEffect(() => {
    if (!form.shiftId) {
      setShiftName("—")
      return
    }
    void fetchShiftOption(form.shiftId).then((o) =>
      setShiftName(o?.label ?? "—"),
    )
  }, [form.shiftId])

  const rows: { label: string; value: string }[] = [
    { label: "القسم", value: deptName },
    { label: "القسم الفرعي", value: form.subDepartment || "—" },
    { label: "المدير المباشر", value: managerName },
    { label: "المسمى الوظيفي", value: form.position || "—" },
    { label: "الرتبة الوظيفية", value: JOB_RANK_AR[form.jobRank] },
    { label: "الوردية", value: shiftName },
    {
      label: "دورة الراتب",
      value: SALARY_BASIS_AR[form.salaryBasis],
    },
    {
      label: "نوع العقد",
      value: EMPLOYMENT_TYPE_EDIT_AR[form.employmentType],
    },
    {
      label: "مدة العقد",
      value: form.contractDurationYears
        ? `${form.contractDurationYears} سنة`
        : "—",
    },
    {
      label: "تاريخ التعيين",
      value: form.hireDate
        ? new Date(form.hireDate + "T12:00:00").toLocaleDateString("ar-SA")
        : "—",
    },
    {
      label: "مكان العمل",
      value: WORK_LOCATION_AR[form.workLocation],
    },
    {
      label: "مدة الفترة التدريبية",
      value: form.probationDays ? `${form.probationDays} يوم` : "—",
    },
  ]

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-lg font-bold text-primary">
          {form.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.photoUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            arabicInitials(form.name || "؟")
          )}
        </div>
        <div>
          <p className="font-almarai text-lg font-bold">
            {form.name || "—"}
          </p>
          <p className="text-sm text-muted-foreground" dir="ltr">
            {form.email || "—"}
          </p>
        </div>
      </div>
      <dl className="divide-y divide-border/70 rounded-2xl border border-border/80">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
          >
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
