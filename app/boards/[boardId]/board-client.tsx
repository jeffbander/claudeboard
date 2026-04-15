"use client"
import { useState } from "react"
import Link from "next/link"
import { UserButton, useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { formatRelativeTime, STAGES, STAGE_EMOJI } from "../../../lib/utils"

const S = {
  card: { background:"#fff", border:"0.5px solid #E5E3DC", borderRadius:12, padding:"12px 16px", cursor:"pointer" as const, display:"flex", alignItems:"center", gap:12 },
  orb: (bg:string) => ({ width:36, height:36, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 as const }),
  tag: (bg:string, color:string) => ({ fontSize:10, padding:"2px 7px", borderRadius:999, background:bg, color }),
  pill: { fontSize:10, padding:"2px 8px", borderRadius:999 },
  btn: (bg:string, color:string="#fff") => ({ background:bg, color, border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontFamily:"inherit", fontWeight:500, cursor:"pointer" as const }),
}

const ORB_COLORS: Record<string, string> = {
  idea:"#F3F2EF", planning:"#EEF4FF", coding:"#F0EDFF", testing:"#FFF8EE", staging:"#EDFAF4", production:"#FFF0F0"
}
const TAG_COLORS = {
  feature: { bg:"#F0EDFF", color:"#4A3F9F" },
  bug: { bg:"#FFF0F0", color:"#9F3F3F" },
  chore: { bg:"#F3F2EF", color:"#666" },
}


type OpsTask = { id:string; name:string; description:string; schedule:string; lastStatus:string|null; nextRun:number }
const INITIAL_TASKS: OpsTask[] = [
  { id:"t1", name:"Nightly health check", description:"Checks app is responding, runs key flows", schedule:"nightly", lastStatus:"pass", nextRun: Date.now()+18000000 },
  { id:"t2", name:"Weekly dependency check", description:"Looks for outdated packages, flags security issues", schedule:"weekly", lastStatus:"warn", nextRun: Date.now()+259200000 },
  { id:"t3", name:"Daily smoke tests", description:"Runs core Playwright flows — upload, rewrite, export", schedule:"daily", lastStatus:"pass", nextRun: Date.now()+21600000 },
  { id:"t4", name:"Monthly cost report", description:"Summarizes Anthropic API usage and Vercel bandwidth", schedule:"monthly", lastStatus:null, nextRun: Date.now()+1468800000 },
]

const MOCK_OPS = {
  health:"up", lastDeploy: Date.now()-7200000, errorRate:1.4, apiSpend:12.40,
  deployments:[
    { id:"d1", hash:"a3f92c", title:"Fact-check confidence score", deployedAt: Date.now()-7200000, status:"live" },
    { id:"d2", hash:"7d14bb", title:"Aigents chain v2 integration", deployedAt: Date.now()-172800000, status:"previous" },
    { id:"d3", hash:"c92a10", title:"Hallucination checker initial", deployedAt: Date.now()-777600000, status:"previous" },
  ],
  incident:{ title:"Error rate spiked on /api/rewrite", description:"11 of 12 errors from users uploading PDFs over 4MB. Fix ready — add file size check before API call.", affectedUsers:12, detectedAt: Date.now()-2820000 }
}

const TASK_TYPES = [
  { value:"health_check", label:"Health check", desc:"Ping the app and verify it responds" },
  { value:"smoke_tests", label:"Smoke tests", desc:"Run Playwright core flows" },
  { value:"dependency_scan", label:"Dependency scan", desc:"Check for outdated or vulnerable packages" },
  { value:"cost_report", label:"Cost report", desc:"Summarize API and infrastructure spend" },
  { value:"security_scan", label:"Security scan", desc:"Check for exposed keys and open permissions" },
  { value:"custom", label:"Custom", desc:"Describe what you want Claude to check" },
]

const SCHEDULES = ["nightly","daily","weekly","monthly"]

const inputStyle = { width:"100%", border:"0.5px solid #E5E3DC", borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" as const, background:"#fff", color:"#1A1A1A" }
const labelStyle = { fontSize:12, fontWeight:500, color:"#1A1A1A", display:"block", marginBottom:6 }

function ProgressDots({ stage }: { stage: string }) {
  const idx = STAGES.indexOf(stage as any)
  return (
    <div style={{ display:"flex", gap:3, marginTop:5 }}>
      {STAGES.map((s,i) => (
        <div key={s} style={{ width:16, height:3, borderRadius:2, background: i < idx ? "#1A1A1A" : i === idx ? "#6C63FF" : "#E5E3DC" }} />
      ))}
    </div>
  )
}

function AddTaskModal({ onClose, onAdd }: { onClose: ()=>void; onAdd: (t:OpsTask)=>void }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [schedule, setSchedule] = useState("nightly")
  const [taskType, setTaskType] = useState("health_check")
  const [customPrompt, setCustomPrompt] = useState("")
  const [saving, setSaving] = useState(false)

  function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const task: OpsTask = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim() || TASK_TYPES.find(t=>t.value===taskType)?.desc || "",
      schedule,
      lastStatus: null,
      nextRun: Date.now() + 86400000,
    }
    setTimeout(() => { onAdd(task); onClose() }, 300)
  }

  return (
    <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:24, maxWidth:440, width:"90%", maxHeight:"90vh", overflowY:"auto" as const }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:600, color:"#1A1A1A" }}>Add scheduled task</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#999" }}>×</button>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Task name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Weekly security scan" style={inputStyle} />
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>What should it check?</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {TASK_TYPES.map(t => (
              <div key={t.value} onClick={()=>setTaskType(t.value)} style={{ border:`0.5px solid ${taskType===t.value ? "#6C63FF" : "#E5E3DC"}`, background: taskType===t.value ? "#F0EDFF" : "#fff", borderRadius:8, padding:"10px 12px", cursor:"pointer" }}>
                <div style={{ fontSize:12, fontWeight:500, color: taskType===t.value ? "#4A3F9F" : "#1A1A1A", marginBottom:2 }}>{t.label}</div>
                <div style={{ fontSize:10, color:"#999", lineHeight:1.4 }}>{t.desc}</div>
              </div>
            ))}
          </div>
          {taskType === "custom" && (
            <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} placeholder="Describe what Claude should check or monitor..." rows={3} style={{ ...inputStyle, resize:"vertical" as const }} />
          )}
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>How often?</label>
          <div style={{ display:"flex", gap:8 }}>
            {SCHEDULES.map(s => (
              <button key={s} onClick={()=>setSchedule(s)} style={{ flex:1, border:`0.5px solid ${schedule===s ? "#1A1A1A" : "#E5E3DC"}`, background: schedule===s ? "#1A1A1A" : "#fff", color: schedule===s ? "#fff" : "#666", borderRadius:8, padding:"8px 0", fontSize:12, fontFamily:"inherit", cursor:"pointer", fontWeight: schedule===s ? 500 : 400 }}>
                {s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ ...S.btn("#F3F2EF","#666"), flex:1 }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || saving} style={{ ...S.btn(name.trim() ? "#1A1A1A" : "#CCC"), flex:2 }}>
            {saving ? "Adding..." : "Add task"}
          </button>
        </div>
      </div>
    </div>
  )
}

function BuildTab({ boardSlug, boardConvexId }: { boardSlug: string; boardConvexId: Id<"boards"> | null }) {
  const features = useQuery(api.features.listByBoard, boardConvexId ? { boardId: boardConvexId } : "skip")

  if (!boardConvexId) return <div style={{ color:"#888", fontSize:13, padding:"20px 0" }}>Board not found.</div>
  if (features === undefined) return <div style={{ color:"#888", fontSize:13, padding:"20px 0" }}>Loading tickets...</div>
  if (features.length === 0) return <div style={{ color:"#888", fontSize:13, padding:"20px 0" }}>No tickets yet. Click + New ticket to create one.</div>

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {features.map(f => (
        <Link key={f._id} href={`/boards/${boardSlug}/features/${f._id}`} style={{ textDecoration:"none" }}>
          <div style={{ ...S.card }}>
            <div style={S.orb(ORB_COLORS[f.stage])}>{STAGE_EMOJI[f.stage as keyof typeof STAGE_EMOJI]}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color:"#1A1A1A", marginBottom:3, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" as const }}>
                {f.title}
                <span style={S.tag(TAG_COLORS[f.type as keyof typeof TAG_COLORS].bg, TAG_COLORS[f.type as keyof typeof TAG_COLORS].color)}>{f.type}</span>
              </div>
              <div style={{ fontSize:11, color:"#888" }}>
                {f.stage==="coding" && f.branchName && `Branch: ${f.branchName}`}
                {f.stage==="testing" && f.testResults && `${f.testResults.passing} of ${f.testResults.total} tests passing`}
                {f.stage==="staging" && "Ready to review on staging"}
                {f.stage==="planning" && "Planning in progress"}
                {f.stage==="idea" && "Not started"}
                {f.stage==="production" && `Shipped ${formatRelativeTime(f.updatedAt)}`}
              </div>
              <ProgressDots stage={f.stage} />
            </div>
            <div style={{ fontSize:13, color: f.stage==="idea" ? "#CCC" : "#1A1A1A", flexShrink:0 }}>→</div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function NewTicketModal({ boardConvexId, userId, onClose }: { boardConvexId: Id<"boards">; userId: string; onClose: ()=>void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"feature"|"bug"|"chore">("feature")
  const [saving, setSaving] = useState(false)
  const createFeature = useMutation(api.features.create)

  async function handleSave() {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      const featureId = await createFeature({ boardId: boardConvexId, title: title.trim(), description: description.trim() || undefined, type, createdBy: userId })
      if (featureId) {
        fetch(`/api/features/${featureId}/plan`, { method: "POST" }).catch(() => {})
      }
      onClose()
    } catch { setSaving(false) }
  }

  return (
    <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:24, maxWidth:440, width:"90%" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:600, color:"#1A1A1A" }}>New ticket</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#999" }}>×</button>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to be built?" style={inputStyle} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Description (optional)</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="A little more context..." style={{ ...inputStyle, resize:"vertical" as const }} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>Type</label>
          <div style={{ display:"flex", gap:8 }}>
            {(["feature","bug","chore"] as const).map(t => (
              <button key={t} onClick={()=>setType(t)} style={{ flex:1, border:`0.5px solid ${type===t ? "#1A1A1A" : "#E5E3DC"}`, background: type===t ? "#1A1A1A" : "#fff", color: type===t ? "#fff" : "#666", borderRadius:8, padding:"8px 0", fontSize:12, fontFamily:"inherit", cursor:"pointer", textTransform:"capitalize" as const }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ ...S.btn("#F3F2EF","#666"), flex:1 }}>Cancel</button>
          <button onClick={handleSave} disabled={!title.trim() || saving} style={{ ...S.btn(title.trim() ? "#1A1A1A" : "#CCC"), flex:2 }}>
            {saving ? "Creating..." : "Create ticket"}
          </button>
        </div>
      </div>
    </div>
  )
}

function OpsTab() {
  const [confirmAction, setConfirmAction] = useState<string|null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [tasks, setTasks] = useState<OpsTask[]>(INITIAL_TASKS)
  const ops = MOCK_OPS

  function handleAddTask(task: OpsTask) {
    setTasks(prev => [...prev, task])
  }

  return (
    <div>
      {showAddTask && <AddTaskModal onClose={()=>setShowAddTask(false)} onAdd={handleAddTask} />}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
        {[
          { label:"App status", value: ops.health==="up" ? "Live" : "Down", sub:"womenasone-resume.com", color: ops.health==="up" ? "#1B9B6F" : "#E24B4A" },
          { label:"Last deploy", value: formatRelativeTime(ops.lastDeploy), sub:"via ClaudeBoard" },
          { label:"Error rate", value:`${ops.errorRate}%`, sub:"↑ from 0.2% yesterday", color: ops.errorRate > 1 ? "#E6A817" : "#1B9B6F" },
          { label:"API spend", value:`$${ops.apiSpend.toFixed(2)}`, sub:"this month · on track" },
        ].map(h => (
          <div key={h.label} style={{ background:"#fff", border:"0.5px solid #E5E3DC", borderRadius:12, padding:"12px 14px" }}>
            <div style={{ fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#999", fontWeight:500, marginBottom:6 }}>{h.label}</div>
            <div style={{ fontSize:18, fontWeight:600, color:h.color??"#1A1A1A", letterSpacing:"-0.03em", marginBottom:2 }}>{h.value}</div>
            <div style={{ fontSize:11, color:"#999" }}>{h.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background:"#FFF8F0", border:"0.5px solid #F5C4B3", borderRadius:12, padding:"14px 16px", display:"flex", gap:12, marginBottom:20 }}>
        <div style={{ fontSize:20, flexShrink:0 }}>⚠️</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#993C1D", marginBottom:3 }}>{ops.incident.title}</div>
          <div style={{ fontSize:12, color:"#B05530", lineHeight:1.5, marginBottom:10 }}>{ops.incident.description}</div>
          <button style={S.btn("#993C1D")}>✦ Let Claude apply the fix →</button>
          <div style={{ fontSize:10, color:"#C07050", marginTop:6 }}>Detected {formatRelativeTime(ops.incident.detectedAt)} · {ops.incident.affectedUsers} users affected</div>
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#1A1A1A" }}>Scheduled tasks</div>
        <button onClick={()=>setShowAddTask(true)} style={{ fontSize:12, color:"#6C63FF", background:"none", border:"none", fontFamily:"inherit", fontWeight:500, cursor:"pointer", padding:0 }}>+ Add task</button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
        {tasks.map(t => (
          <div key={t.id} style={{ background:"#fff", border:"0.5px solid #E5E3DC", borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, color:"#1A1A1A", marginBottom:3 }}>{t.name}</div>
              <div style={{ fontSize:11, color:"#999" }}>{t.description} · <span style={{ textTransform:"capitalize" as const }}>{t.schedule}</span></div>
            </div>
            <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"flex-end", gap:4 }}>
              {t.lastStatus==="pass" && <span style={{ ...S.pill, background:"#EDFAF4", color:"#0F6E56" }}>Passed</span>}
              {t.lastStatus==="warn" && <span style={{ ...S.pill, background:"#FFF8EE", color:"#B07010" }}>Warning</span>}
              {t.lastStatus==="fail" && <span style={{ ...S.pill, background:"#FFF0F0", color:"#9F3F3F" }}>Failed</span>}
              {!t.lastStatus && <span style={{ ...S.pill, background:"#F3F2EF", color:"#666" }}>Scheduled</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:13, fontWeight:600, color:"#1A1A1A", marginBottom:12 }}>Quick actions</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
        {[
          { icon:"🔄", title:"Redeploy", desc:"Push current main branch live again", action:"redeploy" },
          { icon:"📋", title:"View build logs", desc:"See what happened during last deployment", action:"logs" },
          { icon:"🔒", title:"Security scan", desc:"Check for exposed keys and vulnerabilities", action:"security" },
          { icon:"⏪", title:"Rollback", desc:"Revert to previous deployment", action:"rollback", danger:true },
        ].map(a => (
          <div key={a.action} onClick={()=>setConfirmAction(a.action)}
            style={{ background:"#fff", border:`0.5px solid ${(a as any).danger?"#F5C4B3":"#E5E3DC"}`, borderRadius:10, padding:14, cursor:"pointer", display:"flex", flexDirection:"column" as const, gap:6 }}>
            <div style={{ fontSize:18 }}>{a.icon}</div>
            <div style={{ fontSize:13, fontWeight:500, color:"#1A1A1A" }}>{a.title}</div>
            <div style={{ fontSize:11, color:"#999", lineHeight:1.5 }}>{a.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:13, fontWeight:600, color:"#1A1A1A", marginBottom:12 }}>Deployment history</div>
      <div style={{ display:"flex", flexDirection:"column" }}>
        {ops.deployments.map((d,i) => (
          <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom: i < ops.deployments.length-1 ? "0.5px solid #F0EEE8" : "none" }}>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:11, color:"#6C63FF", background:"#F0EDFF", padding:"2px 8px", borderRadius:5, flexShrink:0 }}>{d.hash}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:500, color:"#1A1A1A", whiteSpace:"nowrap" as const, overflow:"hidden", textOverflow:"ellipsis" }}>{d.title}</div>
              <div style={{ fontSize:11, color:"#999" }}>{formatRelativeTime(d.deployedAt)}</div>
            </div>
            <span style={{ ...S.pill, background: d.status==="live"?"#EDFAF4":"#F3F2EF", color: d.status==="live"?"#0F6E56":"#666" }}>{d.status}</span>
            {d.status !== "live" && <button style={{ fontSize:11, color:"#888", background:"none", border:"0.5px solid #E5E3DC", borderRadius:6, padding:"3px 9px", cursor:"pointer", fontFamily:"inherit" }}>Rollback</button>}
          </div>
        ))}
      </div>

      {confirmAction && (
        <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:24, maxWidth:360, width:"90%" }}>
            <div style={{ fontSize:16, fontWeight:600, color:"#1A1A1A", marginBottom:8 }}>Are you sure?</div>
            <div style={{ fontSize:13, color:"#666", marginBottom:20 }}>This action will affect your live app. Claude will confirm what changes before anything happens.</div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setConfirmAction(null)} style={{ ...S.btn("#F3F2EF","#666"), flex:1 }}>Cancel</button>
              <button onClick={()=>setConfirmAction(null)} style={{ ...S.btn("#1A1A1A"), flex:1 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BoardClient({ params }: { params: { boardId: string } }) {
  const [tab, setTab] = useState<"build"|"ops">("build")
  const [showNewTicket, setShowNewTicket] = useState(false)
  const { user } = useUser()
  const board = useQuery(api.boards.getBySlug, { slug: params.boardId })
  const features = useQuery(
    api.features.listByBoard,
    board?._id ? { boardId: board._id } : "skip"
  )
  const activeCount = features?.filter(f => f.stage !== "production").length ?? 0

  return (
    <div style={{ minHeight:"100vh", background:"#FAFAF8" }}>
      <nav style={{ background:"#fff", borderBottom:"0.5px solid #E5E3DC", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Link href="/" style={{ textDecoration:"none", fontSize:13, color:"#888" }}>← All boards</Link>
          <span style={{ color:"#E5E3DC" }}>·</span>
          <div style={{ width:24, height:24, background:"#1A1A1A", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#fff", fontSize:10, fontWeight:600 }}>CB</span>
          </div>
          <span style={{ fontSize:14, fontWeight:600, color:"#1A1A1A" }}>ClaudeBoard</span>
          {board?.name && (<><span style={{ color:"#E5E3DC" }}>·</span><span style={{ fontSize:13, color:"#666" }}>{board.name}</span></>)}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>board?._id && user?.id && setShowNewTicket(true)} disabled={!board?._id || !user?.id} style={{ ...S.btn(board?._id && user?.id ? "#1A1A1A" : "#CCC") }}>+ New ticket</button>
          <UserButton />
        </div>
      </nav>

      {showNewTicket && board?._id && user?.id && (
        <NewTicketModal boardConvexId={board._id} userId={user.id} onClose={()=>setShowNewTicket(false)} />
      )}

      <div style={{ background:"#fff", borderBottom:"0.5px solid #E5E3DC", padding:"0 20px", display:"flex" }}>
        {[
          { id:"build", label:"Build", badge:activeCount, badgeColor:"#B07010", badgeBg:"#FFF8EE" },
          { id:"ops", label:"Ops", badge:1, badgeColor:"#9F3F3F", badgeBg:"#FFF0F0" },
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id as any)}
            style={{ padding:"12px 16px", fontSize:13, fontWeight:500, color:tab===t.id?"#1A1A1A":"#999", background:"none", border:"none", borderBottom:tab===t.id?"2px solid #1A1A1A":"2px solid transparent", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
            {t.label}
            <span style={{ fontSize:10, padding:"1px 6px", borderRadius:999, background:t.badgeBg, color:t.badgeColor, fontWeight:600 }}>{t.badge}</span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth:800, margin:"0 auto", padding:20 }}>
        {tab==="build" ? <BuildTab boardSlug={params.boardId} boardConvexId={board?._id ?? null} /> : <OpsTab />}
      </div>
    </div>
  )
}
