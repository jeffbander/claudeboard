import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import Link from "next/link"

const BOARDS = [
  { id: "wao", name: "Women As One", repo: "jeffbander/wao", activeFeatures: 4, lastDeploy: "2h ago", status: "live" },
]

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8" }}>
      <nav style={{ background: "#fff", borderBottom: "0.5px solid #E5E3DC", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#1A1A1A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>CB</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.02em" }}>ClaudeBoard</span>
        </div>
        <SignedIn><UserButton /></SignedIn>
        <SignedOut><SignInButton><button style={{ background: "#1A1A1A", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}>Sign in</button></SignInButton></SignedOut>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        <SignedOut>
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <h1 style={{ fontSize: 32, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.03em", marginBottom: 12 }}>Your projects, guided by Claude</h1>
            <p style={{ fontSize: 15, color: "#888", marginBottom: 32 }}>Build features, fix bugs, and monitor your apps — all in plain English.</p>
            <SignInButton><button style={{ background: "#1A1A1A", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, cursor: "pointer", fontWeight: 500 }}>Get started</button></SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.03em" }}>Your boards</h1>
              <p style={{ fontSize: 13, color: "#888", marginTop: 3 }}>One board per project.</p>
            </div>
            <button style={{ background: "#1A1A1A", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>+ New board</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BOARDS.map(b => (
              <Link key={b.id} href={`/boards/${b.id}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", border: "0.5px solid #E5E3DC", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "border-color 0.15s" }}>
                  <div style={{ width: 44, height: 44, background: "#F0EDFF", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚡</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 3 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: "#888", fontFamily: "DM Mono, monospace" }}>{b.repo}</div>
                  </div>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A" }}>{b.activeFeatures} active</div>
                      <div style={{ fontSize: 11, color: "#888" }}>Last deploy {b.lastDeploy}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1B9B6F", flexShrink: 0 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </SignedIn>
      </div>
    </div>
  )
}
