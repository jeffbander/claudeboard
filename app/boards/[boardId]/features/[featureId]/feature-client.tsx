"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { marked } from "marked"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { STAGES, STAGE_LABELS, formatRelativeTime } from "../../../../../lib/utils"

const btn = (bg: string, color = "#fff", disabled = false) => ({
  background: disabled ? "#CCC" : bg, color, border: "none", borderRadius: 10, padding: "13px 20px",
  fontSize: 14, fontFamily: "inherit", fontWeight: 500, cursor: disabled ? "not-allowed" as const : "pointer" as const,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
})

const card = { background:"#fff", border:"0.5px solid #E5E3DC", borderRadius:14, padding:20 }

function PipelineTrack({ currentStage }: { currentStage: string }) {
  const current = STAGES.indexOf(currentStage as (typeof STAGES)[number])
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"16px 0 0" }}>
      {STAGES.map((s, i) => (
        <div key={s} style={{ display:"flex", alignItems:"center", flex: i < STAGES.length - 1 ? 1 : 0 }}>
          <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", gap:4 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", border: i <= current ? "none" : "2px solid #E5E3DC", background: i < current ? "#1A1A1A" : i === current ? "#6C63FF" : "#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:500, color: i <= current ? "#fff" : "#999", boxShadow: i === current ? "0 0 0 4px rgba(108,99,255,0.15)" : "none" }}>
              {i < current ? "✓" : i + 1}
            </div>
            <div style={{ fontSize:9, color: i === current ? "#6C63FF" : "#999", textTransform:"uppercase" as const, letterSpacing:"0.05em", fontWeight:500, whiteSpace:"nowrap" as const }}>
              {STAGE_LABELS[s]}
            </div>
          </div>
          {i < STAGES.length - 1 && (
            <div style={{ height:2, flex:1, background: i < current ? "#1A1A1A" : "#E5E3DC", margin:"0 2px", marginBottom:18 }} />
          )}
        </div>
      ))}
    </div>
  )
}

function GitSidebar({ feature }: { feature: NonNullable<ReturnType<typeof useFeature>> }) {
  const commits = feature.commits ?? []
  return (
    <aside style={{ ...card, padding:16, position:"sticky" as const, top:20 }}>
      <div style={{ fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#888", fontWeight:600, marginBottom:10 }}>Git</div>
      <div style={{ fontSize:11, color:"#666", marginBottom:6 }}>Branch</div>
      <div style={{ fontFamily:"DM Mono,monospace", fontSize:12, color:"#1A1A1A", background:"#F7F6F3", padding:"6px 10px", borderRadius:6, marginBottom:12, wordBreak:"break-all" as const }}>
        {feature.branchName ?? <span style={{ color:"#999" }}>not yet</span>}
      </div>
      <div style={{ fontSize:11, color:"#666", marginBottom:6 }}>Pull request</div>
      {feature.prNumber && feature.prUrl ? (
        <a href={feature.prUrl} target="_blank" rel="noreferrer" style={{ display:"block", fontSize:12, color:"#6C63FF", marginBottom:12, textDecoration:"none" }}>
          #{feature.prNumber} · {feature.prStatus ?? "open"} {feature.mergeStatus === "merged" && "· merged"}
        </a>
      ) : <div style={{ fontSize:12, color:"#999", marginBottom:12 }}>none yet</div>}
      <div style={{ fontSize:11, color:"#666", marginBottom:6 }}>Commits ({commits.length})</div>
      {commits.length === 0 ? (
        <div style={{ fontSize:12, color:"#999" }}>No commits yet</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column" as const, gap:6, maxHeight:320, overflowY:"auto" as const }}>
          {commits.slice().reverse().map(c => (
            <div key={c.hash} style={{ fontSize:11, lineHeight:1.5, borderLeft:"2px solid #E5E3DC", paddingLeft:8 }}>
              <a href={c.url ?? "#"} target="_blank" rel="noreferrer" style={{ fontFamily:"DM Mono,monospace", color:"#6C63FF", textDecoration:"none" }}>{c.hash.slice(0,7)}</a>
              <div style={{ color:"#1A1A1A" }}>{c.message.split("\n")[0]}</div>
              <div style={{ color:"#999", fontSize:10 }}>{formatRelativeTime(c.timestamp)}{c.author ? ` · ${c.author}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

function isLikelyConvexId(v: string): boolean {
  return /^[a-z0-9]{24,}$/.test(v)
}

function useFeature(rawId: string) {
  return useQuery(
    api.features.getById,
    isLikelyConvexId(rawId) ? { id: rawId as Id<"features"> } : "skip"
  )
}

function RejectDialog({ onSubmit, onCancel }: { onSubmit: (note: string)=>void; onCancel: ()=>void }) {
  const [note, setNote] = useState("")
  return (
    <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:24, maxWidth:420, width:"90%" }}>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>Ask Claude for changes</div>
        <div style={{ fontSize:13, color:"#666", marginBottom:16 }}>Tell Claude what to change about the plan. It will regenerate.</div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} placeholder="e.g. Break this into smaller steps; avoid changing the database schema" style={{ width:"100%", border:"0.5px solid #E5E3DC", borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" as const, resize:"vertical" as const, marginBottom:16 }} />
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onCancel} style={btn("#F3F2EF", "#666")}>Cancel</button>
          <button onClick={()=>onSubmit(note)} disabled={!note.trim()} style={btn("#6C63FF", "#fff", !note.trim())}>Send to Claude</button>
        </div>
      </div>
    </div>
  )
}

function ConfirmShipDialog({ onConfirm, onCancel }: { onConfirm: ()=>void; onCancel: ()=>void }) {
  return (
    <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:24, maxWidth:400, width:"90%" }}>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Ship to production?</div>
        <div style={{ fontSize:13, color:"#666", marginBottom:20 }}>This will merge the pull request into <code style={{ background:"#F7F6F3", padding:"1px 6px", borderRadius:4 }}>main</code> and trigger a production deploy.</div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onCancel} style={{ ...btn("#F3F2EF", "#666"), flex:1 }}>Cancel</button>
          <button onClick={onConfirm} style={{ ...btn("#1B9B6F"), flex:1 }}>Yes, ship it</button>
        </div>
      </div>
    </div>
  )
}

export default function FeatureClient({ params }: { params: { boardId: string; featureId: string } }) {
  const validId = isLikelyConvexId(params.featureId)
  const feature = useFeature(params.featureId)
  const approvePlan = useMutation(api.features.approvePlan)
  const rejectPlan = useMutation(api.features.rejectPlan)
  const regeneratePlan = useMutation(api.features.regeneratePlan)
  const [showReject, setShowReject] = useState(false)
  const [showShip, setShowShip] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [shipping, setShipping] = useState(false)

  const planHtml = useMemo(() => {
    if (!feature?.planningDoc) return ""
    return marked.parse(feature.planningDoc, { async: false }) as string
  }, [feature?.planningDoc])

  if (!validId) {
    return (
      <div style={{ padding:40, textAlign:"center", color:"#888", fontSize:13 }}>
        Ticket not found. <Link href={`/boards/${params.boardId}`} style={{ color:"#6C63FF" }}>Back to board</Link>
      </div>
    )
  }
  if (feature === undefined) {
    return <div style={{ padding:40, textAlign:"center", color:"#888", fontSize:13 }}>Loading...</div>
  }
  if (feature === null) {
    return (
      <div style={{ padding:40, textAlign:"center", color:"#888", fontSize:13 }}>
        Ticket not found. <Link href={`/boards/${params.boardId}`} style={{ color:"#6C63FF" }}>Back to board</Link>
      </div>
    )
  }

  async function handleRegenerate() {
    if (!feature) return
    setRegenerating(true)
    await regeneratePlan({ id: feature._id })
    fetch(`/api/features/${feature._id}/plan`, { method:"POST" }).catch(() => {})
    setRegenerating(false)
  }

  async function handleRejectSubmit(note: string) {
    if (!feature) return
    await rejectPlan({ id: feature._id, note })
    await regeneratePlan({ id: feature._id })
    fetch(`/api/features/${feature._id}/plan`, { method:"POST" }).catch(() => {})
    setShowReject(false)
  }

  async function handleShip() {
    if (!feature) return
    setShipping(true)
    try {
      await fetch(`/api/features/${feature._id}/ship`, { method:"POST" })
    } finally {
      setShowShip(false)
      setShipping(false)
    }
  }

  const stage = feature.stage
  const hasPlan = !!feature.planningDoc
  const planningAge = feature.planStartedAt ? Date.now() - feature.planStartedAt : 0
  const stuckPlanning = stage === "idea" && planningAge > 60_000

  return (
    <div style={{ minHeight:"100vh", background:"#FAFAF8" }}>
      <nav style={{ background:"#fff", borderBottom:"0.5px solid #E5E3DC", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link href={`/boards/${params.boardId}`} style={{ textDecoration:"none", fontSize:13, color:"#888", display:"flex", alignItems:"center", gap:4 }}>← Back to board</Link>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background:"#F0EDFF", color:"#4A3F9F", textTransform:"capitalize" as const }}>{feature.type}</span>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px 40px", display:"grid", gridTemplateColumns:"1fr 280px", gap:24, alignItems:"start" }}>
        <div>
          <PipelineTrack currentStage={stage} />
          <div style={{ marginTop:16 }}>
            <h1 style={{ fontSize:20, fontWeight:600, color:"#1A1A1A", letterSpacing:"-0.02em", margin:0 }}>{feature.title}</h1>
            {feature.description && <p style={{ fontSize:13, color:"#666", marginTop:6, lineHeight:1.6 }}>{feature.description}</p>}
          </div>

          {(stage === "idea" || (stage === "planning" && !hasPlan)) && (
            <div style={{ ...card, marginTop:20 }}>
              <div style={{ fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#6C63FF", fontWeight:600, marginBottom:6 }}>Step 1 of 6 — Planning</div>
              <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Claude is writing the plan…</div>
              <div style={{ fontSize:13, color:"#666", lineHeight:1.6, marginBottom:14 }}>Usually takes 5–15 seconds. Refresh if it&apos;s been more than a minute.</div>
              {stuckPlanning && (
                <button onClick={handleRegenerate} disabled={regenerating} style={btn("#6C63FF", "#fff", regenerating)}>
                  {regenerating ? "Retrying…" : "✦ Retry planning"}
                </button>
              )}
            </div>
          )}

          {stage === "planning" && hasPlan && (
            <div style={{ ...card, marginTop:20 }}>
              <div style={{ fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#6C63FF", fontWeight:600, marginBottom:6 }}>Step 2 of 6 — Review the plan</div>
              <div style={{ fontSize:18, fontWeight:600, marginBottom:12 }}>Review Claude&apos;s plan</div>
              <div className="plan-md" style={{ fontSize:13, color:"#333", lineHeight:1.7, marginBottom:18 }} dangerouslySetInnerHTML={{ __html: planHtml }} />
              {feature.planRejection && (
                <div style={{ background:"#FFF8EE", border:"0.5px solid #F5E0B3", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#8B6914", marginBottom:14 }}>
                  Previous feedback: {feature.planRejection}
                </div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setShowReject(true)} style={{ ...btn("#F3F2EF", "#666"), flex:1 }}>Ask for changes</button>
                <button onClick={()=>approvePlan({ id: feature._id })} style={{ ...btn("#1B9B6F"), flex:2 }}>✓ Approve plan &amp; start coding</button>
              </div>
            </div>
          )}

          {stage === "coding" && (
            <div style={{ ...card, marginTop:20 }}>
              <div style={{ fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#6C63FF", fontWeight:600, marginBottom:6 }}>Step 3 of 6 — Coding</div>
              <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Claude is writing code</div>
              <div style={{ fontSize:13, color:"#666", lineHeight:1.6, marginBottom:14 }}>
                Branch <code style={{ background:"#F7F6F3", padding:"1px 6px", borderRadius:4, fontFamily:"DM Mono,monospace" }}>{feature.branchName ?? "…"}</code> — commits will appear in the Git sidebar as they happen.
              </div>
              <div style={{ background:"#F7F6F3", borderRadius:10, padding:"12px 14px", fontSize:12, color:"#666", lineHeight:1.6, borderLeft:"3px solid #6C63FF" }}>
                The local daemon picked this up and is running Claude Code. Keep the daemon terminal open.
              </div>
            </div>
          )}

          {stage === "testing" && (
            <div style={{ ...card, marginTop:20 }}>
              <div style={{ fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#6C63FF", fontWeight:600, marginBottom:6 }}>Step 4 of 6 — Testing</div>
              <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Running Playwright</div>
              {feature.testResults ? (
                <div style={{ fontSize:13, color:"#666", marginBottom:14 }}>
                  {feature.testResults.passing} of {feature.testResults.total} tests passing
                  {feature.testResults.failing > 0 && <span style={{ color:"#9F3F3F" }}> · {feature.testResults.failing} failing</span>}
                </div>
              ) : (
                <div style={{ fontSize:13, color:"#888" }}>Waiting for results…</div>
              )}
            </div>
          )}

          {stage === "staging" && (
            <div style={{ ...card, marginTop:20 }}>
              <div style={{ fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#6C63FF", fontWeight:600, marginBottom:6 }}>Step 5 of 6 — Staging</div>
              <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Ready on staging</div>
              {feature.stagingUrl && (
                <div style={{ background:"linear-gradient(135deg,#EDFAF4,#D8F5EB)", border:"0.5px solid #9FE1CB", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
                  <div style={{ fontSize:12, color:"#1D9E75" }}>Preview: <a href={feature.stagingUrl} target="_blank" rel="noreferrer" style={{ color:"#1D9E75" }}>{feature.stagingUrl}</a></div>
                </div>
              )}
              <button onClick={()=>setShowShip(true)} disabled={shipping} style={btn("#1B9B6F", "#fff", shipping)}>✦ Ship to production →</button>
            </div>
          )}

          {stage === "production" && (
            <div style={{ ...card, marginTop:20 }}>
              <div style={{ fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#1B9B6F", fontWeight:600, marginBottom:6 }}>Step 6 of 6 — Production</div>
              <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Shipped 🎉</div>
              <div style={{ fontSize:13, color:"#666" }}>This is live for all users.</div>
            </div>
          )}
        </div>

        <GitSidebar feature={feature} />
      </div>

      {showReject && <RejectDialog onCancel={()=>setShowReject(false)} onSubmit={handleRejectSubmit} />}
      {showShip && <ConfirmShipDialog onCancel={()=>setShowShip(false)} onConfirm={handleShip} />}

      <style jsx global>{`
        .plan-md h1, .plan-md h2, .plan-md h3 { font-size: 14px; margin: 16px 0 6px; font-weight: 600; color: #1A1A1A; }
        .plan-md p { margin: 0 0 10px; }
        .plan-md ul, .plan-md ol { padding-left: 20px; margin: 8px 0; }
        .plan-md li { margin: 4px 0; }
        .plan-md code { background: #F7F6F3; padding: 1px 5px; border-radius: 4px; font-family: 'DM Mono', monospace; font-size: 12px; }
        .plan-md strong { color: #1A1A1A; }
      `}</style>
    </div>
  )
}
