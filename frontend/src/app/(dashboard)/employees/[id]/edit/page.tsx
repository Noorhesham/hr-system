"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { EmployeeEditForm } from "@/components/employees/edit/employee-edit-form"
import { SiteHeader } from "@/components/site-header"

export default function EmployeeEditPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  return (
    <>
      <SiteHeader
        title="تعديل بيانات الموظف"
        breadcrumbs={[
          { label: "الموظفون", href: "/employees" },
          {
            label: "ملف الموظف",
            href: id ? `/employees/${id}` : "/employees",
          },
          { label: "تعديل" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        {id ? (
          <EmployeeEditForm employeeId={id} />
        ) : (
          <p className="text-sm text-muted-foreground">معرّف الموظف غير صالح</p>
        )}
      </div>
    </>
  )
}
