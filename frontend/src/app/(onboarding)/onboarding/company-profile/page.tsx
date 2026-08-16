"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { UploadCloud, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { OnboardingFooter } from "@/components/onboarding/onboarding-footer"
import { uploadOnboardingLogo } from "@/lib/api-client"
import {
  getOnboardingDraft,
  patchOnboardingDraft,
  setLocalOnboardingStep,
} from "@/lib/onboarding/draft"

const INDUSTRY_OPTIONS = [
  { label: "تجارة وتجزئة", value: "retail" },
  { label: "تقنية المعلومات", value: "it" },
  { label: "الصناعة والتصنيع", value: "manufacturing" },
  { label: "الخدمات المهنية", value: "professional-services" },
  { label: "الرعاية الصحية", value: "healthcare" },
  { label: "التعليم", value: "education" },
  { label: "الخدمات اللوجستية", value: "logistics" },
  { label: "أخرى", value: "other" },
]

const companyProfileSchema = z.object({
  companyName: z.string().min(1, "اسم الشركة مطلوب"),
  website: z
    .string()
    .min(1, "الموقع الالكتروني مطلوب")
    .regex(/^(https?:\/\/)?[\w-]+(\.[\w-]+)+.*$/, "أدخل رابطًا صحيحًا"),
  industry: z.string().min(1, "قطاع العمل مطلوب"),
})

type CompanyProfileValues = z.infer<typeof companyProfileSchema>

export default function OnboardingCompanyProfilePage() {
  const router = useRouter()
  const draft = getOnboardingDraft().company
  const [logoUrl, setLogoUrl] = React.useState<string | null>(
    draft?.logoUrl ?? null,
  )
  const [logoUploading, setLogoUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const form = useForm<CompanyProfileValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: draft?.companyName ?? "",
      website: draft?.website ?? "",
      industry: draft?.industry ?? "",
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
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الشعار يجب ألا يتجاوز 2 ميجابايت")
      return
    }

    // Local preview immediately
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(reader.result as string)
    reader.readAsDataURL(file)

    setLogoUploading(true)
    try {
      const uploaded = await uploadOnboardingLogo(file)
      setLogoUrl(uploaded.url)
      const current = getOnboardingDraft().company
      if (current) {
        patchOnboardingDraft({
          company: { ...current, logoUrl: uploaded.url },
        })
      } else {
        // Keep URL ready even before the form is submitted.
        patchOnboardingDraft({
          company: {
            companyName: form.getValues("companyName") || "",
            website: form.getValues("website") || "",
            industry: form.getValues("industry") || "",
            logoUrl: uploaded.url,
          },
        })
      }
      toast.success("تم رفع الشعار")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر رفع الشعار")
      setLogoUrl(draft?.logoUrl ?? null)
    } finally {
      setLogoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <OnboardingShell step={2}>
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">إعداد ملف الشركة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          أخبرنا المزيد عن شركتك لنتمكن من تخصيص تجربتك.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            const effectiveLogo =
              logoUrl && !logoUrl.startsWith("data:")
                ? logoUrl
                : getOnboardingDraft().company?.logoUrl
            if (!effectiveLogo || effectiveLogo.startsWith("data:")) {
              toast.error("يرجى رفع شعار الشركة والانتظار حتى يكتمل الرفع")
              return
            }
            if (logoUploading) {
              toast.error("الرجاء انتظار اكتمال رفع الشعار")
              return
            }
            patchOnboardingDraft({
              company: {
                companyName: values.companyName,
                website: values.website,
                industry: values.industry,
                logoUrl: effectiveLogo,
              },
            })
            setLocalOnboardingStep("admin-account")
            router.push("/onboarding/admin-account")
          })}
          className="flex flex-col gap-6"
          noValidate
        >
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoUploading}
              className="flex size-20 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#c8e6c9] bg-[#F5FBF5] transition-colors hover:border-primary disabled:opacity-60"
            >
              {logoUploading ? (
                <Loader2 className="size-6 animate-spin text-primary" />
              ) : logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="شعار الشركة"
                  className="size-full object-cover"
                />
              ) : (
                <UploadCloud className="size-6 text-primary" strokeWidth={1.5} />
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
              disabled={logoUploading}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
            >
              {logoUploading ? "جارٍ رفع الشعار…" : "رفع شعار الشركة"}
            </button>
          </div>

          <FormInput
            name="companyName"
            label="اسم الشركة"
            placeholder="ادخل اسم شركتك"
            formType="input"
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              name="website"
              label="الموقع الالكتروني"
              placeholder="www.example.com"
              formType="input"
              required
            />
            <FormInput
              name="industry"
              label="قطاع العمل"
              placeholder="اختر القطاع"
              formType="select"
              options={INDUSTRY_OPTIONS}
              required
            />
          </div>

          <OnboardingFooter
            onBack={() => {
              setLocalOnboardingStep("welcome")
              router.push("/onboarding/welcome")
            }}
            nextType="submit"
            nextDisabled={!form.formState.isValid || logoUploading}
          />
        </form>
      </Form>
    </OnboardingShell>
  )
}
