import type { Metadata } from "next"
import { Almarai, Changa, Geist_Mono } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import QueryProvider from "@/lib/query/QueryProvider"
import { AuthProvider } from "@/providers/auth-provider"

import "./globals.css"

const changa = Changa({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-changa",
})

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  variable: "--font-almarai-face",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "نجاز — نظام الموارد البشرية",
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
      className={`${changa.variable} ${almarai.variable} ${geistMono.variable} h-full antialiased`}
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
