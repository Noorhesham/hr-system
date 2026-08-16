"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { TerminateEmployeeDialog } from "@/components/employees/delete-dialogs"
import { EmployeeProfileHeader } from "@/components/employees/profile-header"
import { TabAttendance } from "@/components/employees/tab-attendance"
import { TabEmployment } from "@/components/employees/tab-employment"
import { TabLeaves } from "@/components/employees/tab-leaves"
import { TabOverview } from "@/components/employees/tab-overview"
import { TabSalaries } from "@/components/employees/tab-salaries"
import type {
  EmployeeDetail,
  LeaveRow,
  PayrollSlipRow,
} from "@/components/employees/types"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiFetch } from "@/lib/api-client"

const TAB_VALUES = [
  "overview",
  "employment",
  "salaries",
  "attendance",
  "leaves",
] as const

type TabValue = (typeof TAB_VALUES)[number]

function parseTab(raw: string | null): TabValue {
  if (raw && (TAB_VALUES as readonly string[]).includes(raw)) {
    return raw as TabValue
  }
  return "overview"
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
      <div className="rounded-2xl border border-border/80 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Skeleton className="size-16 rounded-full sm:size-20" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-40 rounded-lg" />
          </div>
        </div>
      </div>
      <Skeleton className="h-8 w-full max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id

  const [tab, setTab] = React.useState<TabValue>(() =>
    parseTab(searchParams.get("tab")),
  )
  const [employee, setEmployee] = React.useState<EmployeeDetail | null>(null)
  const [slips, setSlips] = React.useState<PayrollSlipRow[]>([])
  const [leaves, setLeaves] = React.useState<LeaveRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [slipsLoading, setSlipsLoading] = React.useState(false)
  const [leavesLoading, setLeavesLoading] = React.useState(false)
  const [statusLoading, setStatusLoading] = React.useState(false)
  const [terminateOpen, setTerminateOpen] = React.useState(false)

  React.useEffect(() => {
    setTab(parseTab(searchParams.get("tab")))
  }, [searchParams])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const emp = await apiFetch<EmployeeDetail>(`/employees/${id}`)
        if (!cancelled) setEmployee(emp)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "تعذر تحميل ملف الموظف",
        )
        if (!cancelled) setEmployee(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  React.useEffect(() => {
    if (!employee) return
    let cancelled = false
    ;(async () => {
      setLeavesLoading(true)
      try {
        const data = await apiFetch<LeaveRow[]>(`/employees/${id}/leaves`)
        if (!cancelled) setLeaves(data)
      } catch {
        if (!cancelled) setLeaves([])
      } finally {
        if (!cancelled) setLeavesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, employee?.id])

  React.useEffect(() => {
    if (!employee || (tab !== "salaries" && tab !== "overview")) return
    let cancelled = false
    ;(async () => {
      setSlipsLoading(true)
      try {
        const data = await apiFetch<PayrollSlipRow[]>(
          `/employees/${id}/payroll-slips`,
        )
        if (!cancelled) setSlips(data)
      } catch {
        if (!cancelled) setSlips([])
      } finally {
        if (!cancelled) setSlipsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, employee?.id, tab])

  function setTabAndUrl(next: TabValue) {
    setTab(next)
    const params = new URLSearchParams()
    if (next !== "overview") params.set("tab", next)
    const qs = params.toString()
    router.replace(`/employees/${id}${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  async function patchActive(isActive: boolean) {
    if (!employee) return
    setStatusLoading(true)
    try {
      const updated = await apiFetch<EmployeeDetail>(`/employees/${id}`, {
        method: "PATCH",
        body: { isActive },
      })
      setEmployee(updated)
      toast.success(
        isActive ? "تم تفعيل حساب الموظف" : "تم تعطيل حساب الموظف",
      )
      setTerminateOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحديث الحالة")
    } finally {
      setStatusLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader title="ملف الموظف" breadcrumbs={["الموظفون"]} />
        <ProfileSkeleton />
      </>
    )
  }

  if (!employee) {
    return (
      <>
        <SiteHeader title="ملف الموظف" breadcrumbs={["الموظفون"]} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
          <p className="text-muted-foreground">الموظف غير موجود</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/employees")}
          >
            العودة للموظفين
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader
        title={employee.name}
        breadcrumbs={[
          { label: "الموظفون", href: "/employees" },
          { label: employee.name },
        ]}
      />
      <div className="flex flex-1 flex-col bg-[#F8F9FA]/50">
        <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              if (typeof v === "string") setTabAndUrl(parseTab(v))
            }}
            className="w-full gap-5"
          >
            <EmployeeProfileHeader
              employee={employee}
              statusLoading={statusLoading}
              onEdit={() => {
                router.push(`/employees/${id}/edit`)
              }}
              onToggleStatus={() => void patchActive(!employee.isActive)}
              onTerminate={() => setTerminateOpen(true)}
              footer={
                <TabsList
                  variant="line"
                  className="h-auto w-fit justify-start gap-5 rounded-none bg-transparent p-0"
                >
                  <TabsTrigger
                    value="overview"
                    className="flex-none rounded-none px-0 pb-3 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"
                  >
                    نبذة عامة
                  </TabsTrigger>
                  <TabsTrigger
                    value="employment"
                    className="flex-none rounded-none px-0 pb-3 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"
                  >
                    التوظيف
                  </TabsTrigger>
                  <TabsTrigger
                    value="salaries"
                    className="flex-none rounded-none px-0 pb-3 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"
                  >
                    الرواتب
                  </TabsTrigger>
                  <TabsTrigger
                    value="attendance"
                    className="flex-none rounded-none px-0 pb-3 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"
                  >
                    الحضور
                  </TabsTrigger>
                  <TabsTrigger
                    value="leaves"
                    className="flex-none rounded-none px-0 pb-3 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"
                  >
                    الإجازات
                  </TabsTrigger>
                </TabsList>
              }
            />

            <TabsContent value="overview" className="mt-0">
              <TabOverview
                employee={employee}
                leaves={leaves}
                slips={slips}
              />
            </TabsContent>
            <TabsContent value="employment" className="mt-0">
              <TabEmployment employee={employee} />
            </TabsContent>
            <TabsContent value="salaries" className="mt-0">
              <TabSalaries
                slips={slips}
                loading={slipsLoading}
                salaryBasis={employee.salaryBasis}
              />
            </TabsContent>
            <TabsContent value="attendance" className="mt-0">
              <TabAttendance employeeId={id} />
            </TabsContent>
            <TabsContent value="leaves" className="mt-0">
              <TabLeaves leaves={leaves} loading={leavesLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <TerminateEmployeeDialog
        open={terminateOpen}
        onOpenChange={setTerminateOpen}
        employeeName={employee.name}
        loading={statusLoading}
        onConfirm={() => void patchActive(false)}
      />
    </>
  )
}
