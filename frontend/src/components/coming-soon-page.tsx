import { SiteHeader } from "@/components/site-header"

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <>
      <SiteHeader title={title} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <h2 className="font-almarai text-2xl font-bold">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          هذه الصفحة قيد التطوير — قريبًا ستتوفر بالكامل ضمن نظام نجاز.
        </p>
      </div>
    </>
  )
}
