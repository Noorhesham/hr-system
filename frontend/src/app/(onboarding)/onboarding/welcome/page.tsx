"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { setLocalOnboardingStep } from "@/lib/onboarding/draft"

export default function OnboardingWelcomePage() {
  const router = useRouter()

  return (
    <OnboardingShell step={1} percent={10}>
      <div className="flex flex-col items-center">
        <div className="relative aspect-[500/480] w-full max-w-[320px]">
          <Image
            src="/Profiling-bro 1.png"
            alt=""
            fill
            priority
            className="object-contain"
            sizes="320px"
          />
        </div>

        <div className="mt-2 flex flex-col items-center gap-6 text-center">
          <h1 className="text-[32px] leading-none font-bold text-foreground">
            مرحبـــًا بك في <span className="text-primary">نجـــــــاز</span> 👋
          </h1>

          <div className="flex flex-col items-center gap-2">
            <p className="max-w-[34rem] text-lg leading-7 font-normal text-foreground">
              يسعدنا انضمامك! سنساعدك في إعداد مساحة العمل الخاصة بشركتك
              بخطوات بسيطة لنتمكن من تفعيل النظام بشكل كامل.
            </p>
            <p className="text-sm text-muted-foreground">
              لن تستغرق العملية أكثر من 3 دقائق.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => {
              setLocalOnboardingStep("company-profile")
              router.push("/onboarding/company-profile")
            }}
            className="h-12 w-full max-w-[420px] rounded-[6px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            ابدأ الإعداد الآن
          </Button>
        </div>
      </div>
    </OnboardingShell>
  )
}
