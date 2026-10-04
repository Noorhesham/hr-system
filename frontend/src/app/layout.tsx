import type { Metadata } from "next"
import localFont from "next/font/local"
import { Geist_Mono } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import QueryProvider from "@/lib/query/QueryProvider"
import { AuthProvider } from "@/providers/auth-provider"

import "./globals.css"

const thmanyahSans = localFont({
  src: [
    {
      path: "../fonts/thmanyah-sans/thmanyah-sans-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/thmanyah-sans/thmanyah-sans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/thmanyah-sans/thmanyah-sans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/thmanyah-sans/thmanyah-sans-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/thmanyah-sans/thmanyah-sans-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-thmanyah",
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "جاهـــــز — نظام الموارد البشرية",
  description: "منصة إدارة الرواتب والحضور والموظفين",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${thmanyahSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <TooltipProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster richColors position="top-center" theme="light" />
            </AuthProvider>
          </QueryProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
