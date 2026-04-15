import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { DM_Sans, DM_Mono } from "next/font/google"
import "./globals.css"

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300","400","500","600"], variable: "--font-dm-sans" })
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400","500"], variable: "--font-dm-mono" })

export const metadata: Metadata = {
  title: "ClaudeBoard",
  description: "AI-powered dev ops board",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
        <body style={{ fontFamily: "var(--font-dm-sans, DM Sans, sans-serif)" }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
