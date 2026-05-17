import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { useShiprocketCheckout } from "@modules/checkout/context/shiprocket-context"
import {
  formatShiprocketAmount,
  getShiprocketAmountPaise,
  getShiprocketEtaLabel,
  isIndianAddress,
  normalizePincode,
} from "@lib/util/shiprocket"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const { calculate } = useShiprocketCheckout()
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    address &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart, customer?.email])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const postalCode = normalizePincode(formData["shipping_address.postal_code"])
  const countryCode = formData["shipping_address.country_code"]
  const shouldRate = isIndianAddress(countryCode)

  useEffect(() => {
    if (!shouldRate) {
      calculate({
        postalCode,
        countryCode,
        cart: cart || undefined,
      })
      return
    }

    const timer = window.setTimeout(() => {
      calculate({
        postalCode,
        countryCode,
        cart: cart || undefined,
      })
    }, postalCode.length === 6 ? 500 : 120)

    return () => window.clearTimeout(timer)
  }, [calculate, cart, countryCode, postalCode, shouldRate])

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      <div className="grid grid-cols-1 gap-4 small:grid-cols-2">
        <Input
          label="First name"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Last name"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <Input
          label="Address"
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />
        <Input
          label="Company"
          name="shipping_address.company"
          value={formData["shipping_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="shipping-company-input"
        />
        <Input
          label="Postal code"
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          value={formData["shipping_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-postal-code-input"
        />
        {shouldRate && (
          <div className="small:col-span-2">
            <ShiprocketInlineRate currencyCode={cart?.currency_code || "inr"} />
          </div>
        )}
        <Input
          label="City"
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          data-testid="shipping-city-input"
        />
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
        />
        <Input
          label="State / Province"
          name="shipping_address.province"
          autoComplete="address-level1"
          value={formData["shipping_address.province"]}
          onChange={handleChange}
          data-testid="shipping-province-input"
        />
      </div>
      <div className="my-8">
        <Checkbox
          label="Billing address same as shipping address"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 small:grid-cols-2">
        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label="Phone"
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
      </div>
    </>
  )
}

export default ShippingAddress

const ShiprocketInlineRate = ({ currencyCode }: { currencyCode: string }) => {
  const shiprocket = useShiprocketCheckout()
  const amount = getShiprocketAmountPaise(shiprocket.rate)
  const eta = getShiprocketEtaLabel(shiprocket.rate)

  if (shiprocket.status === "idle") {
    return null
  }

  if (shiprocket.status === "waiting") {
    return (
      <div className="rounded-[16px] border border-[rgba(18,63,99,0.1)] bg-white/62 px-4 py-3 text-sm leading-6 text-[var(--shreem-muted)]">
        Enter a 6 digit Indian pincode to check Shiprocket delivery.
      </div>
    )
  }

  if (shiprocket.status === "loading") {
    return (
      <div className="rounded-[16px] border border-[rgba(212,161,38,0.22)] bg-[rgba(255,248,233,0.76)] px-4 py-3 text-sm font-medium leading-6 text-[var(--shreem-ink)]">
        Checking delivery price...
      </div>
    )
  }

  if (shiprocket.status === "available" && shiprocket.rate) {
    return (
      <div className="rounded-[16px] border border-[rgba(13,129,126,0.22)] bg-[rgba(240,248,246,0.82)] px-4 py-3">
        <div className="flex flex-col gap-2 xsmall:flex-row xsmall:items-start xsmall:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--shreem-ink)]">
              Shiprocket Delivery
            </p>
            {shiprocket.rate.courier?.courier_name && (
              <p className="mt-1 text-sm leading-6 text-[var(--shreem-muted)]">
                {shiprocket.rate.courier.courier_name}
              </p>
            )}
            {eta && (
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--shreem-muted)]">
                {eta}
              </p>
            )}
          </div>
          <span className="shrink-0 rounded-full border border-[rgba(13,129,126,0.2)] bg-white/80 px-3 py-1.5 text-sm font-semibold text-[var(--shreem-ink)]">
            {formatShiprocketAmount(amount, currencyCode)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
      {shiprocket.error ||
        "Delivery is not available for this pincode. Please try another address."}
    </div>
  )
}
