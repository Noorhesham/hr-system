"use client"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type RankConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading?: boolean
  onConfirm: () => void
}

export function RankConfirmDialog({
  open,
  onOpenChange,
  loading = false,
  onConfirm,
}: RankConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="default"
        className="sm:max-w-md"
        overlayClassName="bg-black/40 supports-backdrop-filter:backdrop-blur-[2px]"
      >
        <AlertDialogHeader className="place-items-center text-center sm:place-items-center sm:text-center">
          <AlertDialogMedia className="mb-1 size-12 rounded-xl bg-orange-100 text-orange-600">
            <AlertTriangleIcon className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle className="font-almarai text-lg">
            تأكيد تغيير الرتبة الوظيفية
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center leading-relaxed">
            أنت على وشك تغيير الرتبة الوظيفية لهذا الموظف. سيؤدي هذا التغيير إلى
            تحديث صلاحياته داخل النظام وفقاً للرتبة الجديدة. هل ترغب في
            المتابعة؟
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-between">
          <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            className="bg-orange-600 text-white hover:bg-orange-600/90"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2Icon className="size-4 animate-spin" />
                جارٍ الحفظ…
              </span>
            ) : (
              "تأكيد التغيير"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type EditSuccessDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBackToProfile: () => void
}

export function EditSuccessDialog({
  open,
  onOpenChange,
  onBackToProfile,
}: EditSuccessDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="default"
        className="sm:max-w-md"
        overlayClassName="bg-black/40 supports-backdrop-filter:backdrop-blur-[2px]"
      >
        <AlertDialogHeader className="place-items-center text-center sm:place-items-center sm:text-center">
          <AlertDialogMedia className="mb-1 size-14 rounded-full bg-primary/15 text-primary">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-white">
              <CheckCircle2Icon className="size-5" />
            </span>
          </AlertDialogMedia>
          <AlertDialogTitle className="font-almarai text-lg">
            تم تعديل البيانات بنجاح
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center leading-relaxed">
            تم حفظ جميع التعديلات التي أجريتها بنجاح، ويمكنك الآن مراجعة البيانات
            المحدثة والتأكد من أنها بالشكل المطلوب.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            إغلاق
          </Button>
          <Button
            type="button"
            className="rounded-lg"
            onClick={onBackToProfile}
          >
            العودة إلى الرئيسية
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type EditErrorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRetry: () => void
}

export function EditErrorDialog({
  open,
  onOpenChange,
  onRetry,
}: EditErrorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="default"
        className="sm:max-w-md"
        overlayClassName="bg-black/40 supports-backdrop-filter:backdrop-blur-[2px]"
      >
        <AlertDialogHeader className="place-items-center text-center sm:place-items-center sm:text-center">
          <AlertDialogMedia className="mb-1 size-14 rounded-full bg-destructive/10 text-destructive">
            <XCircleIcon className="size-8" />
          </AlertDialogMedia>
          <AlertDialogTitle className="font-almarai text-lg">
            خطأ في حفظ التعديلات
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center leading-relaxed">
            حدث خطأ أثناء محاولة حفظ التعديلات. يرجى المحاولة مرة أخرى أو التحقق
            من صحة البيانات المدخلة.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            إغلاق
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="gap-2 rounded-lg"
            onClick={onRetry}
          >
            <RefreshCwIcon className="size-4" />
            تعديل والمحاولة مرة أخرى
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
