export const dynamic = "force-dynamic"
import FeatureClient from "./feature-client"

export default function FeaturePage({ params }: { params: { boardId: string; featureId: string } }) {
  return <FeatureClient params={params} />
}
