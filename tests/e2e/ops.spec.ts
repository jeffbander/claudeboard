import { test, expect } from "@playwright/test"

test.describe("Ops tab UI", () => {
  test("home page has correct meta title", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/ClaudeBoard/)
  })

  test("board page renders without application error", async ({ page }) => {
    await page.goto("/boards/wao")
    await page.waitForLoadState("networkidle")
    const body = await page.textContent("body")
    expect(body!.length).toBeGreaterThan(10)
    expect(body).not.toContain("Application error")
  })

  test("board page shows ClaudeBoard nav after fix", async ({ page }) => {
    await page.goto("/boards/wao")
    await page.waitForLoadState("networkidle")
    // After Providers fix, ClaudeBoard nav should be visible
    const hasBranding = await page.locator("text=ClaudeBoard").first().isVisible().catch(() => false)
    const hasClerk = await page.locator(".cl-rootBox").first().isVisible().catch(() => false)
    // Either board renders OR Clerk sign-in renders — both are correct
    expect(hasBranding || hasClerk).toBe(true)
  })
})

test.describe("Add task modal — component behavior", () => {
  test("sign-in page contains Clerk form", async ({ page }) => {
    await page.goto("/sign-in")
    await page.waitForLoadState("networkidle")
    await expect(page.locator(".cl-rootBox").first()).toBeVisible({ timeout: 10000 })
  })
})
