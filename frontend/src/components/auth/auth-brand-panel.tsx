"use client"

import Image from "next/image"
import { Headset, ShieldCheck, BadgeCheck } from "lucide-react"

const TRUST_BADGES = [
  { label: "آمن", Icon: ShieldCheck },
  { label: "موثوق", Icon: BadgeCheck },
  { label: "دعم 24/7", Icon: Headset },
] as const

/**
 * Static brand panel for auth screens (right side in RTL).
 * 50% width; solid primary + subtle light texture (no cloudy blend).
 */
export function AuthBrandPanel() {
  return (
    <aside className="relative hidden h-full min-w-0 overflow-hidden rounded-[24px] bg-[var(--primary,#1F9120)] lg:flex lg:w-1/2 lg:flex-col">
      {/* Subtle mesh on solid primary — low opacity, no blend (avoids cloudy wash) */}
      <Image
        src="/b15958ed557fb69efc6fba639689beada9d678f8.png"
        alt=""
        fill
        priority
        className="pointer-events-none z-[1] object-cover opacity-[0.22]"
        sizes="50vw"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] bg-login-grid opacity-25"
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col items-center px-8 py-8 xl:px-10">
        <Image
          src="/logo.png"
          alt="نجاز"
          width={116}
          height={74}
          priority
          className="h-[60px] w-auto object-contain xl:h-[74px]"
        />

        <h2 className="mt-5 max-w-[28rem] shrink-0 text-center font-almarai text-[48px] font-bold leading-[150%] text-white">
          نظــام نجـــــاز لإدارة
          <br />
          المـــــــــــــوارد البـشـريـة
        </h2>

        <div className="relative my-3 flex min-h-0 w-full flex-1 items-center justify-center">
          <Image
            src="/Group 3.png"
            alt=""
            width={586}
            height={586}
            priority
            className="max-h-full w-auto max-w-[min(100%,380px)] -rotate-[10.69deg] object-contain drop-shadow-xl xl:max-w-[min(100%,480px)]"
          />
        </div>

        <p className="max-w-[22rem] shrink-0 text-center font-almarai text-lg font-bold leading-[150%] text-white">
          كل ما تحتاجه لإدارة الموظفين والرواتب في مكان واحد
        </p>

        <ul className="mt-5 flex w-full max-w-md shrink-0 items-center justify-between gap-4 px-2 xl:mt-6">
          {TRUST_BADGES.map(({ label, Icon }) => (
            <li
              key={label}
              className="flex flex-col items-center gap-2 text-white"
            >
              <Icon
                className="size-5 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="font-sans text-sm font-medium leading-[150%]">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
