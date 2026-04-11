import { Text } from "@medusajs/ui"

async function ProductOnboardingCta() {
  return (
    <div className="brand-card p-6">
      <p className="brand-kicker">Why Shreem</p>
      <Text className="mt-3 text-xl text-[var(--shreem-ink)]">
        Built for families choosing a more rooted, desi-cow way of living.
      </Text>
      <ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--shreem-muted)]">
        <li className="rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-3">
          The focus stays on use, sourcing, and process rather than exaggerated claims.
        </li>
        <li className="rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-3">
          Clear options and pricing help buyers move quickly from trust to purchase.
        </li>
        <li className="rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-3">
          The site experience stays calm, mobile-friendly, and easy to browse on a first visit.
        </li>
      </ul>
    </div>
  )
}

export default ProductOnboardingCta
