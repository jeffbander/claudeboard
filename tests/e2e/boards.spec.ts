import { test, expect } from "@playwright/test"

test.describe("Board page structure", () => {
  test("home page renders correctly", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/ClaudeBoard/)
    await expect(page.locator("text=ClaudeBoard").first()).toBeVisible()
  })

  test("sign in page loads and shows Clerk component", async ({ page }) => {
    await page.goto("/sign-in")
    await page.waitForLoadState("networkidle")
    await expect(page.locator(".cl-rootBox").first()).toBeVisible({ timeout: 10000 })
  })

  test("sign up page loads correctly", async ({ page }) => {
    await page.goto("/sign-up")
    await page.waitForLoadState("networkidle")
    await expect(page.locator(".cl-rootBox").first()).toBeVisible({ timeout: 10000 })
  })

  test("board page renders without crashing", async ({ page }) => {
    await page.goto("/boards/wao")
    await page.waitForLoadState("networkidle")
    // After fix, page should render content not an error page
    const body = await page.textContent("body")
    expect(body!.length).toBeGreaterThan(10)
    // Should NOT show a Next.js error page
    expect(body).not.toContain("Application error")
  })
})
