import { test, expect } from "@playwright/test"

test.describe("Pipeline navigation", () => {
  test("feature page renders without crashing", async ({ page }) => {
    await page.goto("/boards/wao/features/f1")
    await page.waitForLoadState("networkidle")
    const body = await page.textContent("body")
    expect(body!.length).toBeGreaterThan(10)
    expect(body).not.toContain("Application error")
  })

  test("home page renders content", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("text=ClaudeBoard").first()).toBeVisible()
  })

  test("API PATCH updates a feature stage", async ({ request }) => {
    const res = await request.patch("/api/features/test-feature-id", {
      data: { stage: "coding", branchName: "feat/test-branch" },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.stage).toBe("coding")
    expect(data.branchName).toBe("feat/test-branch")
  })

  test("sign-in page renders Clerk component", async ({ page }) => {
    await page.goto("/sign-in")
    await page.waitForLoadState("networkidle")
    await expect(page.locator(".cl-rootBox").first()).toBeVisible({ timeout: 10000 })
  })
})
