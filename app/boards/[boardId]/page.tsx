export const dynamic = "force-dynamic"
import BoardClient from "./board-client"

export default function BoardPage({ params }: { params: { boardId: string } }) {
  return <BoardClient params={params} />
}
