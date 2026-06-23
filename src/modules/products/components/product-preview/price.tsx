import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <>
      {price.price_type === "sale" && (
        <span
          className="text-xs text-[var(--shreem-muted)] line-through"
          data-testid="original-price"
        >
          {price.original_price}
        </span>
      )}
      <span
        className={[
          "whitespace-nowrap text-sm font-semibold text-[var(--shreem-ink)]",
          price.price_type === "sale" ? "text-[var(--shreem-accent-dark)]" : "",
        ].filter(Boolean).join(" ")}
        data-testid="price"
      >
        {price.calculated_price}
      </span>
    </>
  )
}
