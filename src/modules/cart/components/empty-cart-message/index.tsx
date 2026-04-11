import { Heading, Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div
      className="brand-card flex flex-col items-start justify-center px-5 py-16 small:px-8 small:py-20"
      data-testid="empty-cart-message"
    >
      <p className="brand-kicker">Nothing here yet</p>
      <Heading
        level="h1"
        className="mt-3 flex flex-row items-baseline gap-x-2 text-[2.4rem] leading-none text-[var(--shreem-ink)]"
      >
        Your bag is still empty
      </Heading>
      <Text className="mb-6 mt-4 max-w-[32rem] text-base-regular leading-7 text-[var(--shreem-muted)]">
        Start exploring the Shreem collection and fill your bag with pieces
        chosen for color, presence, and lasting appeal.
      </Text>
      <div>
        <InteractiveLink href="/store">Explore products</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
