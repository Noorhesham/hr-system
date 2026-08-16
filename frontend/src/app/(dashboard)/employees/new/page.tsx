"use client"

import { EmployeeCreateWizard } from "@/components/employees/create/employee-create-wizard"
import { SiteHeader } from "@/components/site-header"

export default function EmployeeCreatePage() {
  return (
    <>
      <SiteHeader
        title="إضافة موظف جديد"
        breadcrumbs={[
          { label: "الموظفون", href: "/employees" },
          { label: "إضافة موظف" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <EmployeeCreateWizard />
      </div>
    </>
  )
}
