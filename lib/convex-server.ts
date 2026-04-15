import { ConvexHttpClient } from "convex/browser"

const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://wandering-lark-774.convex.cloud"

export function convexServer(): ConvexHttpClient {
  return new ConvexHttpClient(url.trim())
}
