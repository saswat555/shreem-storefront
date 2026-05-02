import { Text } from "@medusajs/ui"

async function ProductOnboardingCta() {
  return (
    <div className="brand-card p-6">
      <p className="brand-kicker">Customer help</p>
      <Text className="mt-3 text-xl text-[var(--shreem-ink)]">
        Everything you need before you place the order.
      </Text>
      <ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--shreem-muted)]">
        <li className="rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-3">
          Reviews appear on the product page after approval, with visible star ratings and written feedback.
        </li>
        <li className="rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-3">
          Checkout shows the selected variant, real totals, payment method, and final review before confirmation.
        </li>
        <li className="rounded-[22px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-3">
          If you have a question before buying, the support page lets you send a real customer request to the Shreem team.
        </li>
      </ul>
    </div>
  )
}

export default ProductOnboardingCta
