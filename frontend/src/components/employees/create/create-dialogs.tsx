"use client"

import { CheckIcon, PlusIcon } from "lucide-react"
import Link from "next/link"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type CreateSuccessDialogProps = {
  open: boolean
  employeeId: string | null
  onOpenChange: (open: boolean) => void
  onAddAnother: () => void
}

export function CreateSuccessDialog({
  open,
  employeeId,
  onOpenChange,
  onAddAnother,
}: CreateSuccessDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="default"
        className="!max-w-lg w-[calc(100%-2rem)] gap-5 rounded-2xl p-6 sm:!max-w-lg"
        overlayClassName="bg-black/40 supports-backdrop-filter:backdrop-blur-[2px]"
      >
        <AlertDialogHeader className="!place-items-start gap-3 !text-start sm:!place-items-start sm:!text-start">
          <div className="flex w-full items-start gap-3">
            <AlertDialogMedia className="mb-0 size-12 shrink-0 rounded-xl bg-primary/15 text-primary">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-white">
                <CheckIcon className="size-4" strokeWidth={2.5} />
              </span>
            </AlertDialogMedia>
            <div className="min-w-0 flex-1 space-y-1.5">
              <AlertDialogTitle className="font-almarai text-base font-bold leading-snug sm:text-lg">
                تم إنشاء حساب الموظف بنجاح
              </AlertDialogTitle>
              <AlertDialogDescription className="text-start text-sm leading-relaxed text-muted-foreground">
                يمكنك الآن عرض ملف الموظف، أو إضافة موظف جديد، أو العودة إلى
                قائمة الموظفين.
              </AlertDialogDescription>
            </div>
          </div>
          {employeeId ? (
            <Link
              href={`/employees/${employeeId}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              عرض حساب الموظف
              <span aria-hidden className="text-base leading-none">
                ›
              </span>
            </Link>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className="!mx-0 !mb-0 grid !grid-cols-2 gap-3 border-t border-border/60 !bg-transparent pt-4 sm:!flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-lg border-primary text-primary hover:bg-primary/5 hover:text-primary"
            render={<Link href="/employees" />}
          >
            قائمة الموظفين
          </Button>
          <Button
            type="button"
            className="h-11 w-full gap-1.5 rounded-lg"
            onClick={onAddAnother}
          >
            <PlusIcon className="size-4" />
            إضافة موظف جديد
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
