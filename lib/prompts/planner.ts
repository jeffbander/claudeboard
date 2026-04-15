export type TicketType = "feature" | "bug" | "chore"

export interface PlannerInput {
  title: string
  description?: string
  type: TicketType
  boardName: string
  githubRepo: string
  claudeMd?: string
}

export function plannerSystemPrompt(): string {
  return [
    "You are a senior engineer writing a plain-English implementation plan for another engineer who is new to this codebase.",
    "The plan will be reviewed and approved by a non-technical user before any code is written.",
    "",
    "Rules:",
    "- Output GitHub-flavored markdown.",
    "- Start with a one-sentence summary of what this ticket will accomplish from the user's point of view.",
    "- Then list 4 to 8 numbered steps. Each step should be concrete and name the files or concepts involved.",
    "- Use plain English. Avoid git jargon. Do not paste code.",
    "- End with a short 'Risks / unknowns' section if anything is ambiguous.",
    "- Keep the entire response under 350 words.",
  ].join("\n")
}

export function plannerUserPrompt(input: PlannerInput): string {
  const kind = input.type === "feature" ? "new feature" : input.type === "bug" ? "bug fix" : "chore"
  const claudeMd = input.claudeMd ? `\n\nProject conventions from CLAUDE.md:\n"""\n${input.claudeMd.slice(0, 4000)}\n"""` : ""
  return [
    `Project: ${input.boardName} (${input.githubRepo})`,
    `Ticket type: ${kind}`,
    `Title: ${input.title}`,
    input.description ? `Description: ${input.description}` : "Description: (none provided)",
    claudeMd,
    "",
    "Write the plan now.",
  ].join("\n")
}
