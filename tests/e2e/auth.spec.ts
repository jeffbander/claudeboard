import { test, expect } from "@playwright/test"

test.describe("Home page", () => {
  test("loads and shows ClaudeBoard branding", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=ClaudeBoard").first()).toBeVisible()
  })

  test("shows sign in button when logged out", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=Sign in").first()).toBeVisible()
  })

  test("shows get started button on landing", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=Get started").first()).toBeVisible()
  })

  test("page renders content (not blank)", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    const body = await page.textContent("body")
    expect(body!.length).toBeGreaterThan(50)
  })
})

test.describe("Auth behavior", () => {
  test("/boards route renders content", async ({ page }) => {
    await page.goto("/boards/wao")
    await page.waitForLoadState("networkidle")
    const body = await page.textContent("body")
    expect(body!.length).toBeGreaterThan(10)
  })

  test("feature route renders content", async ({ page }) => {
    await page.goto("/boards/wao/features/f1")
    await page.waitForLoadState("networkidle")
    const body = await page.textContent("body")
    expect(body!.length).toBeGreaterThan(10)
  })
})
