"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { UserPlus, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { OnboardingFooter } from "@/components/onboarding/onboarding-footer"
import { apiFetch } from "@/lib/api-client"
import {
  getOnboardingEmployeesCsv,
  setOnboardingEmployeesCsv,
  clearOnboardingDraft,
} from "@/lib/onboarding/draft"
import { advanceOnboardingTo } from "@/lib/onboarding/advance"
import { useAuth } from "@/hooks/use-auth"

const CSV_TEMPLATE = `name,email,basicSalary,employmentType,salaryBasis,isGosiRegistered,gosiNumber
Ahmed Ali,ahmed@example.com,5000,PERMANENT,MONTHLY,false,
Sara Omar,sara@example.com,4500,PERMANENT,MONTHLY,true,123456789
`

const MAX_CSV_BYTES = 5 * 1024 * 1024

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel"
  )
}

export default function OnboardingEmployeesPage() {
  const router = useRouter()
  const { refreshSession } = useAuth()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [csvName, setCsvName] = React.useState<string | null>(
    getOnboardingEmployeesCsv()?.name ?? null,
  )
  const [pending, setPending] = React.useState(false)
  const [importSummary, setImportSummary] = React.useState<string | null>(null)
  const [csvError, setCsvError] = React.useState<string | null>(null)

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "employees-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  function onCsvSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isCsvFile(file)) {
      setCsvError("يرجى اختيار ملف CSV صالح")
      setOnboardingEmployeesCsv(null)
      setCsvName(null)
      return
    }
    if (file.size > MAX_CSV_BYTES) {
      setCsvError("حجم الملف يجب ألا يتجاوز 5 ميجابايت")
      setOnboardingEmployeesCsv(null)
      setCsvName(null)
      return
    }
    setCsvError(null)
    setOnboardingEmployeesCsv(file)
    setCsvName(file.name)
    setImportSummary(null)
  }

  async function importCsvIfSelected() {
    const file = getOnboardingEmployeesCsv()
    if (!file) return true

    if (!isCsvFile(file) || file.size > MAX_CSV_BYTES) {
      setCsvError("ملف CSV غير صالح")
      return false
    }

    setPending(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const result = await apiFetch<{
        createdCount: number
        errorCount: number
      }>("/employees/import", { method: "POST", body: form })
      setImportSummary(
        `تم استيراد ${result.createdCount} موظف` +
          (result.errorCount ? ` (أخطاء: ${result.errorCount})` : ""),
      )
      toast.success(`تم استيراد ${result.createdCount} موظف`)
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل استيراد الملف")
      return false
    } finally {
      setPending(false)
    }
  }

  async function goComplete() {
    await advanceOnboardingTo("complete", refreshSession)
    router.push("/onboarding/complete")
  }

  async function handleNext() {
    const ok = await importCsvIfSelected()
    if (ok) await goComplete()
  }

  async function handleManualAdd() {
    // Finish onboarding first so AuthGuard doesn't bounce them back.
    try {
      await advanceOnboardingTo("complete", refreshSession)
      await apiFetch("/onboarding/complete", { method: "POST" })
      clearOnboardingDraft()
      await refreshSession()
      router.push("/dashboard")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر المتابعة")
    }
  }

  return (
    <OnboardingShell step={7}>
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          إضافة بيانات الموظفين
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ضف موظفيك الآن أو أضفهم لاحقاً، حسب رغبتك
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-3 rounded-[6px] border border-[#d6d6d6] p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#EAF7EA] text-primary">
            <UserPlus className="size-6" />
          </div>
          <p className="font-bold text-foreground">إضافة موظفين يدويًا</p>
          <p className="text-sm text-muted-foreground">
            أضف الموظفين واحدًا تلو الآخر مع إدخال جميع بياناتهم يدويًا
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleManualAdd()}
            className="mt-2 h-10 w-full rounded-[6px]"
          >
            ابدأ الإضافة يدويًا
          </Button>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-[6px] border border-[#d6d6d6] p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#EAF7EA] text-primary">
            <FileSpreadsheet className="size-6" />
          </div>
          <p className="font-bold text-foreground">استيراد ملف Excel/CSV</p>
          <p className="text-sm text-muted-foreground">
            قم برفع ملف بيانات الموظفين الحالي بصيغة CSV لتوفير الوقت
          </p>
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button
              type="button"
              onClick={downloadTemplate}
              className="h-10 w-full rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              تحميل النموذج
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-full rounded-[6px]"
            >
              {csvName ? "تغيير الملف" : "رفع ملف CSV"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onCsvSelected}
            />
            {csvName && (
              <p className="truncate text-xs text-muted-foreground" dir="ltr">
                {csvName}
              </p>
            )}
            {csvError && (
              <p className="text-xs text-destructive">{csvError}</p>
            )}
          </div>
        </div>
      </div>

      {importSummary && (
        <p className="mt-4 text-center text-sm font-medium text-primary">
          {importSummary}
        </p>
      )}

      <p className="mt-4 text-center text-sm text-muted-foreground">
        لا تقلق، يمكنك دائماً إضافة أو استيراد المزيد من بيانات الموظفين من
        لوحة التحكم لاحقاً
      </p>

      <OnboardingFooter
        onBack={() => router.push("/onboarding/benefits")}
        onNext={() => void handleNext()}
        onSkip={() => void goComplete()}
        nextPending={pending}
        nextLabel={csvName ? "استيراد ومتابعة" : "متابعة"}
      />
    </OnboardingShell>
  )
}
