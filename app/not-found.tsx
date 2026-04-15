export const dynamic = "force-dynamic"

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 24 }}>
      <div style={{ fontSize: 48 }}>🤔</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: "#1A1A1A" }}>Page not found</div>
      <a href="/" style={{ color: "#6C63FF", fontSize: 14, textDecoration: "none" }}>← Back to boards</a>
    </div>
  )
}
