export const dynamic = "force-dynamic"
import { auth } from "@clerk/nextjs/server"
import HomeClient from "./home-client"

export default async function Home() {
  return <HomeClient />
}
