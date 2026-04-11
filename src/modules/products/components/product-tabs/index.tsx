"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Details",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "Delivery & Care",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple" className="flex flex-col gap-3">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const detailPairs = [
    ["Material", product.material || "-"],
    ["Country of origin", product.origin_country || "-"],
    ["Type", product.type?.value || "-"],
    ["Weight", product.weight ? `${product.weight} g` : "-"],
    [
      "Dimensions",
      product.length && product.width && product.height
        ? `${product.length}L x ${product.width}W x ${product.height}H`
        : "-",
    ],
  ]

  return (
    <div className="grid gap-3 py-4">
      {detailPairs.map(([label, value]) => (
        <div
          key={label}
          className="flex items-start justify-between gap-4 rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-3 text-sm"
        >
          <span className="font-medium text-[var(--shreem-ink)]">{label}</span>
          <span className="text-right text-[var(--shreem-muted)]">{value}</span>
        </div>
      ))}
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="grid grid-cols-1 gap-y-4 py-4">
      <div className="flex items-start gap-x-3 rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
        <FastDelivery />
        <div>
          <span className="font-semibold text-[var(--shreem-ink)]">
            Packed with care
          </span>
          <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--shreem-muted)]">
            Orders are packed thoughtfully so natural products arrive cleanly
            and with the right presentation.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-x-3 rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
        <Refresh />
        <div>
          <span className="font-semibold text-[var(--shreem-ink)]">
            Storage guidance
          </span>
          <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--shreem-muted)]">
            Keep natural products away from excess heat and moisture to preserve
            their best everyday use.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-x-3 rounded-[20px] bg-[linear-gradient(135deg,rgba(240,248,246,0.78),rgba(255,249,240,0.72))] px-4 py-4">
        <Back />
        <div>
          <span className="font-semibold text-[var(--shreem-ink)]">
            Need help choosing?
          </span>
          <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--shreem-muted)]">
            If you are comparing products for ritual, kitchen, or farm use, the
            Shreem team can guide the selection.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
