import Image from "next/image"
import Link from "next/link"
import type {
  GemstoneProduct,
  GemstoneVendor,
} from "@lib/data/gemstones"
import GemstoneAddToCart from "../components/gemstone-add-to-cart"

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const customerPrice = (vendorBase: unknown) =>
  Math.ceil(Number(vendorBase || 0) / 0.8)

const specRows = (product: GemstoneProduct) =>
  [
    ["Stone", product.stone_name],
    ["Planet", product.planet],
    ["Rashi", product.rashi],
    ["Type", product.item_type],
    ["Metal", product.metal],
    ["Quality", product.quality_grade],
    ["Color", product.color_grade],
    ["Clarity", product.clarity],
    ["Shape", product.shape],
    ["Weight", [
      product.weight_carats ? `${product.weight_carats} ct` : "",
      product.weight_ratti ? `${product.weight_ratti} ratti` : "",
    ].filter(Boolean).join(" · ")],
    ["Size", product.size],
    ["Cut", product.cut],
    ["Origin", product.origin],
    ["Treatment", product.treatment],
    ["Certificate", product.certification],
    ["SKU", product.sku],
    ["Lot", product.lot_number],
    ["Use", product.purpose],
  ].filter(([, value]) => Boolean(value))

const GemstoneCard = ({
  product,
  countryCode,
}: {
  product: GemstoneProduct
  countryCode: string
}) => {
  const image = product.image_urls?.[0] || "/shreem-scenes/postive-energy.jpg"
  const buyOptions = product.variant_options?.length
    ? product.variant_options
    : [
        {
          id: product.id,
          label: [product.item_type, product.metal, product.size].filter(Boolean).join(" · ") || product.title,
          medusa_variant_id: product.medusa_variant_id,
          form: product.item_type,
          metal: product.metal,
          size: product.size,
          quality_grade: product.quality_grade,
          weight_carats: product.weight_carats,
          weight_ratti: product.weight_ratti,
          total_price_inr: product.price_inr,
          inventory_quantity: product.inventory_quantity,
          active: product.active,
        },
      ]
  const liveOptions = buyOptions.filter((option) => option.active !== false)
  const prices = liveOptions
    .map((option) => customerPrice(option.total_price_inr))
    .filter(Boolean)
  const stock = liveOptions.reduce((total, option) => total + Number(option.inventory_quantity || 0), 0)
  const heroSpecs = specRows(product).slice(0, 4)

  return (
    <article className="group overflow-hidden rounded-[26px] border border-[rgba(18,63,99,0.10)] bg-white shadow-[0_24px_70px_rgba(18,63,99,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(18,63,99,0.16)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f3ecdc]">
        <Image
          src={image}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(7,22,34,0)_0%,rgba(7,22,34,0.78)_100%)] p-4">
          <div className="flex flex-wrap gap-2">
            {heroSpecs.map(([label, value]) => (
              <span
                key={`${product.id}-hero-${label}`}
                className="rounded-full border border-white/20 bg-white/14 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md"
              >
                {label}: {value}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-5 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full bg-[rgba(13,129,126,0.09)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--shreem-teal-deep)]">
              {product.vendor_name}
            </p>
            {product.certification && (
              <p className="rounded-full bg-[rgba(246,211,107,0.18)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--shreem-gold-deep)]">
                {product.certification}
              </p>
            )}
          </div>
          <h3 className="mt-3 text-xl font-semibold leading-snug text-[var(--shreem-ink)]">
            {product.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
            {product.description ||
              "Certified gemstone option linked to Shreem Jyotish recommendations."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {specRows(product).slice(0, 9).map(([label, value]) => (
            <div
              key={`${product.id}-${label}`}
              className="rounded-[16px] border border-[rgba(18,63,99,0.08)] bg-[rgba(255,252,248,0.86)] px-3 py-2"
            >
              <p className="font-semibold uppercase tracking-[0.12em] text-[var(--shreem-muted)]">
                {label}
              </p>
              <p className="mt-1 font-semibold text-[var(--shreem-ink)]">{value}</p>
            </div>
          ))}
        </div>

        {product.recommendation_notes && (
          <p className="rounded-[16px] bg-[rgba(13,129,126,0.08)] px-4 py-3 text-sm leading-6 text-[var(--shreem-ink)]">
            {product.recommendation_notes}
          </p>
        )}

        {product.lab_report_url && (
          <Link
            href={product.lab_report_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-[rgba(18,63,99,0.14)] px-4 py-2 text-xs font-semibold text-[var(--shreem-ink)]"
          >
            View lab report
          </Link>
        )}

        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[rgba(18,63,99,0.08)] bg-[rgba(18,63,99,0.035)] px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--shreem-muted)]">
              Price
            </p>
            <p className="text-xl font-semibold text-[var(--shreem-ink)]">
              {prices.length > 1 ? `From ${money(Math.min(...prices))}` : money(prices[0] || product.price_inr)}
            </p>
          </div>
          <span className="rounded-full bg-[rgba(246,211,107,0.22)] px-3 py-1 text-xs font-semibold text-[var(--shreem-gold-deep)]">
            {stock > 0
              ? `${stock} available`
              : "Confirm availability"}
          </span>
        </div>

        <GemstoneAddToCart
          options={buyOptions}
          countryCode={countryCode}
          disabled={stock <= 0}
        />
      </div>
    </article>
  )
}

const GemstoneMarketplace = ({
  countryCode,
  vendors,
  products,
  activeVendor,
  stone,
}: {
  countryCode: string
  vendors: GemstoneVendor[]
  products: GemstoneProduct[]
  activeVendor?: GemstoneVendor
  stone?: string
}) => {
  const heroImage = activeVendor?.banner_url || products[0]?.image_urls?.[0]
  const listingCount = products.length
  const vendorCount = vendors.length

  return (
    <main className="bg-[linear-gradient(180deg,#fffaf0_0%,#f7fbf9_44%,#fffaf7_100%)]">
      <section className="relative min-h-[520px] overflow-hidden bg-[#071622] text-white">
        {heroImage && (
          <Image
            src={heroImage}
            alt={activeVendor?.name || "Shreem gemstone vendors"}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-42"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,34,0.95)_0%,rgba(7,22,34,0.80)_42%,rgba(7,22,34,0.42)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_16%,rgba(246,211,107,0.22),transparent_28%),radial-gradient(circle_at_18%_90%,rgba(13,129,126,0.25),transparent_34%)]" />
        <div className="content-container relative grid min-h-[520px] items-center gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_420px] small:py-16">
          <div>
            <p className="inline-flex rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6d36b] backdrop-blur-md">
              Shreem Ratna Marketplace
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white small:text-5xl">
              {activeVendor
                ? `${activeVendor.name} gemstone substore`
                : "Premium Jyotish gemstones from verified Shreem vendors"}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/82">
              Certified gemstone listings with stone-only, ring and pendant options,
              clear weights, metals, treatment details, lab reports and Shreem-managed checkout.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {[
                [`${listingCount}`, "live listings"],
                [`${vendorCount}`, "verified vendors"],
                ["Secure", "Shreem checkout"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[18px] border border-white/14 bg-white/10 px-4 py-3 backdrop-blur-md"
                >
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/62">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/16 bg-white/12 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            {activeVendor?.logo_url && (
              <div className="relative mb-4 h-16 w-16 overflow-hidden rounded-2xl border border-white/18 bg-white/12">
                <Image src={activeVendor.logo_url} alt={activeVendor.name} fill sizes="64px" className="object-cover" />
              </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f6d36b]">
              {activeVendor ? "Vendor profile" : "Buyer confidence"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {activeVendor?.name || "Verified gemstone network"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {activeVendor
                ? [activeVendor.city, activeVendor.state].filter(Boolean).join(", ")
                : "Built for astrology-led gemstone discovery with Shreem checkout and vendor-managed inventory."}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/84">
              {activeVendor?.bio ||
                "Every listing is expected to show the details customers compare before buying: carat, ratti, metal, form, size, treatment, certification and availability."}
            </p>
            {activeVendor?.trust_notes && (
              <p className="mt-4 rounded-[18px] border border-white/14 bg-white/10 px-4 py-3 text-sm leading-6 text-white/76">
                {activeVendor.trust_notes}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="content-container py-8 small:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="brand-kicker">Vendors</p>
            <h2 className="brand-section-title mt-2">Choose a trusted substore</h2>
          </div>
          <Link
            href={`/${countryCode}/shreem-astrology`}
            className="brand-pill px-4 py-2 text-xs"
          >
            Get Jyotish recommendation first
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto rounded-[24px] border border-[rgba(18,63,99,0.08)] bg-white/72 p-3 shadow-[0_16px_45px_rgba(18,63,99,0.06)]">
          <Link
            href={`/${countryCode}/gemstones`}
            className="shrink-0 rounded-full border border-[rgba(18,63,99,0.12)] bg-white px-4 py-2 text-sm font-semibold text-[var(--shreem-ink)] shadow-sm"
          >
            All vendors
          </Link>
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/${countryCode}/gemstones/${vendor.handle}`}
              className="shrink-0 rounded-full border border-[rgba(18,63,99,0.12)] bg-white px-4 py-2 text-sm font-semibold text-[var(--shreem-ink)] shadow-sm"
            >
              {vendor.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="content-container pb-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="brand-kicker">Catalog</p>
            <h2 className="brand-section-title mt-2">
              {stone ? `Gemstones matching ${stone}` : "Ready gemstone listings"}
            </h2>
          </div>
          <form
            action={
              activeVendor
                ? `/${countryCode}/gemstones/${activeVendor.handle}`
                : `/${countryCode}/gemstones`
            }
            className="flex w-full max-w-xl flex-col gap-2 small:flex-row"
          >
            <input
              name="stone"
              defaultValue={stone || ""}
              placeholder="Search stone, planet, quality, SKU, certificate..."
              className="min-w-0 flex-1 rounded-full border border-[rgba(18,63,99,0.14)] bg-white px-4 py-3 text-sm text-[var(--shreem-ink)] outline-none"
            />
            <button className="rounded-full bg-[linear-gradient(135deg,#0d817e,#123f63)] px-5 py-3 text-sm font-semibold text-white">
              Search
            </button>
          </form>
        </div>

        {products.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <GemstoneCard
                key={product.id}
                product={product}
                countryCode={countryCode}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-[rgba(18,63,99,0.12)] bg-white/88 p-6">
            <h3 className="text-xl font-semibold text-[var(--shreem-ink)]">
              No live gemstone listings yet
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--shreem-muted)]">
              Add Ratna Sagar listings from Admin → Gemstones and map each listing to a real
              Medusa variant before sending customers here.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

export default GemstoneMarketplace
