"use client"
import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { useUser, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import { api } from "../convex/_generated/api"
import Link from "next/link"

const inputStyle = { width:"100%", border:"0.5px solid #E5E3DC", borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" as const, background:"#fff", color:"#1A1A1A" }
const labelStyle = { fontSize:12, fontWeight:500, color:"#1A1A1A", display:"block", marginBottom:6 }

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "board"
}

function NewBoardModal({ userId, onClose }: { userId: string; onClose: ()=>void }) {
  const [name, setName] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const createBoard = useMutation(api.boards.create)

  async function handleSave() {
    if (!name.trim() || !githubRepo.trim() || saving) return
    setSaving(true); setError(null)
    try {
      await createBoard({
        name: name.trim(),
        slug: slugify(name),
        githubRepo: githubRepo.trim(),
        description: description.trim() || undefined,
        createdBy: userId,
      })
      onClose()
    } catch (e: any) {
      setError(e?.message ?? "Could not create board")
      setSaving(false)
    }
  }

  return (
    <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:24, maxWidth:440, width:"90%" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:600, color:"#1A1A1A" }}>New board</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#999" }}>×</button>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Board name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="My project" style={inputStyle} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>GitHub repo</label>
          <input value={githubRepo} onChange={e=>setGithubRepo(e.target.value)} placeholder="owner/repo" style={inputStyle} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>Description (optional)</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize:"vertical" as const }} />
        </div>
        {error && <div style={{ fontSize:12, color:"#9F3F3F", marginBottom:12 }}>{error}</div>}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ background:"#F3F2EF", color:"#666", border:"none", borderRadius:8, padding:"9px 16px", fontSize:13, fontFamily:"inherit", fontWeight:500, cursor:"pointer", flex:1 }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || !githubRepo.trim() || saving} style={{ background: name.trim() && githubRepo.trim() ? "#1A1A1A" : "#CCC", color:"#fff", border:"none", borderRadius:8, padding:"9px 16px", fontSize:13, fontFamily:"inherit", fontWeight:500, cursor:"pointer", flex:2 }}>
            {saving ? "Creating..." : "Create board"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HomeClient() {
  const { user } = useUser()
  const boards = useQuery(api.boards.list)
  const [showNewBoard, setShowNewBoard] = useState(false)

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8" }}>
      <nav style={{ background: "#fff", borderBottom: "0.5px solid #E5E3DC", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#1A1A1A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>CB</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.02em" }}>ClaudeBoard</span>
        </div>
        <SignedIn><UserButton /></SignedIn>
        <SignedOut>
          <SignInButton>
            <button style={{ background: "#1A1A1A", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}>Sign in</button>
          </SignInButton>
        </SignedOut>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        <SignedOut>
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <h1 style={{ fontSize: 32, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.03em", marginBottom: 12 }}>Your projects, guided by Claude</h1>
            <p style={{ fontSize: 15, color: "#888", marginBottom: 32 }}>Build features, fix bugs, and monitor your apps — all in plain English.</p>
            <SignInButton>
              <button style={{ background: "#1A1A1A", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, cursor: "pointer", fontWeight: 500 }}>Get started</button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.03em" }}>Your boards</h1>
              <p style={{ fontSize: 13, color: "#888", marginTop: 3 }}>One board per project.</p>
            </div>
            <button onClick={()=>user?.id && setShowNewBoard(true)} style={{ background: "#1A1A1A", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>+ New board</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {boards === undefined && (
              <div style={{ color: "#888", fontSize: 13, padding: "20px 0" }}>Loading boards...</div>
            )}
            {boards?.length === 0 && (
              <div style={{ color: "#888", fontSize: 13, padding: "20px 0" }}>No boards yet. Create one to get started.</div>
            )}
            {boards?.map(b => (
              <Link key={b._id} href={`/boards/${b.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", border: "0.5px solid #E5E3DC", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
                  <div style={{ width: 44, height: 44, background: "#F0EDFF", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚡</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 3 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: "#888", fontFamily: "DM Mono, monospace" }}>{b.githubRepo}</div>
                    {b.description && <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{b.description}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#888" }}>Last updated {new Date(b.updatedAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1B9B6F", flexShrink: 0 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </SignedIn>

        {showNewBoard && user?.id && (
          <NewBoardModal userId={user.id} onClose={()=>setShowNewBoard(false)} />
        )}
      </div>
    </div>
  )
}
