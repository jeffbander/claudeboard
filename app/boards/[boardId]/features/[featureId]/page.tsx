"use client"
import { useState } from "react"
import Link from "next/link"
import { STAGES, STAGE_LABELS } from "../../../../../lib/utils"

const btn = (bg: string, color = "#fff") => ({
  background: bg, color, border: "none", borderRadius: 10, padding: "13px 20px",
  fontSize: 14, fontFamily: "inherit", fontWeight: 500, cursor: "pointer" as const,
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
})

const MOCK_FEATURE = {
  id: "f1", title: "Hallucination detection v2", type: "feature", stage: "coding",
  description: "Improve the hallucination checker to return a confidence score alongside the rewritten resume. Show the score in the UI with a plain English explanation.",
  branchName: "feat/hallucination-v2",
  testResults: { total: 5, passing: 3, failing: 2, lastRun: Date.now() - 3600000 },
  stagingUrl: "https://wao-staging.vercel.app/pr-42",
  planningDoc: "## Plan\n1. Update hallucination.ts to return confidence score\n2. Add score display component\n3. Write Playwright test for score visibility",
}

const STEP_CONTENT: Record<string, { eyebrow: string; heading: string; desc: string; actionLabel: string; actionColor: string }> = {
  idea: { eyebrow: "Step 1 of 6 — Idea", heading: "What do you want to build?", desc: "You've captured the idea. Claude will turn it into a real plan before any code is written.", actionLabel: "✦ Ask Claude to plan this →", actionColor: "#6C63FF" },
  planning: { eyebrow: "Step 2 of 6 — Planning", heading: "Claude is writing the plan", desc: "Claude is figuring out exactly what needs to be built and in what order. Review the plan, then hit Start Coding.", actionLabel: "✦ Start coding →", actionColor: "#6C63FF" },
  coding: { eyebrow: "Step 3 of 6 — Coding", heading: "Claude is writing code", desc: "Claude Code is working through the plan. It will run the tests automatically when done.", actionLabel: "⏸ Pause and review code", actionColor: "#1A1A1A" },
  testing: { eyebrow: "Step 4 of 6 — Testing", heading: "Tests are running", desc: "Claude ran the automated tests. Review results below, then let Claude fix any failures.", actionLabel: "✦ Let Claude fix failures →", actionColor: "#6C63FF" },
  staging: { eyebrow: "Step 5 of 6 — Staging", heading: "Your feature is live on staging", desc: "All tests passed. Open the preview link and click through the feature before shipping to real users.", actionLabel: "✦ Ship to production →", actionColor: "#1B9B6F" },
  production: { eyebrow: "Step 6 of 6 — Production", heading: "Shipped! 🎉", desc: "This feature is live for all users.", actionLabel: "", actionColor: "" },
}

function PipelineTrack({ currentStage }: { currentStage: string }) {
  const current = STAGES.indexOf(currentStage as any)
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

function StepCard({ stage, feature }: { stage: string; feature: typeof MOCK_FEATURE }) {
  const content = STEP_CONTENT[stage]
  if (!content) return null
  return (
    <div style={{ background:"#fff", border:"0.5px solid #E5E3DC", borderRadius:14, padding:20, marginTop:20 }}>
      <div style={{ fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#6C63FF", fontWeight:600, marginBottom:6 }}>{content.eyebrow}</div>
      <div style={{ fontSize:18, fontWeight:600, color:"#1A1A1A", letterSpacing:"-0.02em", marginBottom:8 }}>{content.heading}</div>
      <div style={{ fontSize:13, color:"#666", lineHeight:1.6, marginBottom:18 }}>{content.desc}</div>

      {stage === "coding" && (
        <div style={{ background:"#1A1A1A", borderRadius:10, padding:"14px 16px", fontFamily:"DM Mono,monospace", fontSize:11, color:"#AAA", lineHeight:1.8, marginBottom:14 }}>
          <div style={{ color:"#555" }}>Branch created: {feature.branchName}</div>
          <div style={{ color:"#4ECB9A" }}>✓ Updated hallucination checker</div>
          <div style={{ color:"#4ECB9A" }}>✓ Added confidence score component</div>
          <div style={{ color:"#7EB8F7" }}>Writing Playwright test...</div>
          <div style={{ display:"inline-block", width:7, height:13, background:"#6C63FF", borderRadius:1, verticalAlign:"middle", animation:"blink 1s step-end infinite" }} />
        </div>
      )}

      {stage === "testing" && feature.testResults && (
        <div style={{ display:"flex", flexDirection:"column" as const, gap:6, marginBottom:14 }}>
          {["Resume uploads correctly","AI rewrite runs","Confidence score shows","Typography on mobile","Dark mode contrast"].map((name, i) => {
            const pass = i < feature.testResults!.passing
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"#fff", border:`0.5px solid ${pass ? "#E5E3DC" : "#FECACA"}`, borderRadius:8, padding:"9px 12px", fontSize:12 }}>
                <span style={{ width:18, height:18, borderRadius:"50%", background: pass ? "#EDFAF4" : "#FFF0F0", color: pass ? "#1B9B6F" : "#E24B4A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, flexShrink:0 }}>{pass ? "✓" : "✕"}</span>
                <span style={{ flex:1, color:"#1A1A1A" }}>{name}</span>
                <span style={{ color: pass ? "#999" : "#E24B4A", fontFamily:"DM Mono,monospace", fontSize:10 }}>{pass ? `${(Math.random()*2+0.5).toFixed(1)}s` : "failed"}</span>
              </div>
            )
          })}
        </div>
      )}

      {stage === "staging" && feature.stagingUrl && (
        <div style={{ background:"linear-gradient(135deg,#EDFAF4,#D8F5EB)", border:"0.5px solid #9FE1CB", borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <span style={{ fontSize:24 }}>🎉</span>
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:"#0F6E56" }}>All tests passing</div>
            <div style={{ fontSize:12, color:"#1D9E75", marginTop:2 }}>Preview: <a href={feature.stagingUrl} target="_blank" rel="noreferrer" style={{ color:"#1D9E75" }}>{feature.stagingUrl}</a></div>
          </div>
        </div>
      )}

      <div style={{ background:"#F7F6F3", borderRadius:10, padding:"12px 14px", fontSize:12, color:"#666", lineHeight:1.6, marginBottom:14, borderLeft:"3px solid #E5E3DC" }}>
        {stage === "coding" && <span><strong style={{ color:"#1A1A1A" }}>You don&apos;t need to do anything right now.</strong> Claude will move this card to Testing automatically when it&apos;s done.</span>}
        {stage === "testing" && <span><strong style={{ color:"#1A1A1A" }}>Claude&apos;s diagnosis:</strong> The mobile timeout is a font loading issue. The dark mode failure is a CSS variable. Both are quick fixes.</span>}
        {stage === "staging" && <span><strong style={{ color:"#1A1A1A" }}>Before you ship:</strong> Open the preview link and click through the feature. Does everything feel right?</span>}
        {stage === "planning" && <span><strong style={{ color:"#1A1A1A" }}>Review before coding:</strong> Make sure the plan makes sense. Ask Claude to adjust anything that looks wrong.</span>}
        {stage === "idea" && <span><strong style={{ color:"#1A1A1A" }}>What happens next:</strong> Claude will write a plain-English plan — what to build, how long it may take, and what the finished thing will look like.</span>}
      </div>

      {content.actionLabel && (
        <button style={btn(content.actionColor)}>{content.actionLabel}</button>
      )}
    </div>
  )
}

export default function FeaturePage({ params }: { params: { boardId: string; featureId: string } }) {
  const feature = MOCK_FEATURE
  return (
    <div style={{ minHeight:"100vh", background:"#FAFAF8" }}>
      <nav style={{ background:"#fff", borderBottom:"0.5px solid #E5E3DC", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link href={`/boards/${params.boardId}`} style={{ textDecoration:"none", fontSize:13, color:"#888", display:"flex", alignItems:"center", gap:4 }}>← Back to board</Link>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background:"#F0EDFF", color:"#4A3F9F" }}>{feature.type}</span>
        </div>
      </nav>

      <div style={{ maxWidth:700, margin:"0 auto", padding:"0 20px 40px" }}>
        <PipelineTrack currentStage={feature.stage} />
        <div style={{ marginTop:16 }}>
          <h1 style={{ fontSize:20, fontWeight:600, color:"#1A1A1A", letterSpacing:"-0.02em" }}>{feature.title}</h1>
          {feature.description && <p style={{ fontSize:13, color:"#666", marginTop:6, lineHeight:1.6 }}>{feature.description}</p>}
        </div>
        <StepCard stage={feature.stage} feature={feature} />
      </div>
    </div>
  )
}
