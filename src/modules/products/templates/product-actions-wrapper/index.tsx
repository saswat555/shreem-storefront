import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
  })
    .then(({ response }) => response.products[0])
    .catch(() => null)

  if (!product) {
    return (
      <div className="brand-card px-4 py-4 text-sm leading-6 text-[var(--shreem-muted)]">
        Purchase options are temporarily unavailable. Product details are still
        visible, and the actions will return when the store connection responds.
      </div>
    )
  }

  return <ProductActions product={product} region={region} />
}
