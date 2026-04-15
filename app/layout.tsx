import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { ConvexClientProvider } from "./providers"
import "./globals.css"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ClaudeBoard",
  description: "AI-powered dev ops board",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ fontFamily: "'DM Sans', sans-serif", background: "#FAFAF8", margin: 0 }}>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
