"use client"

import { HttpTypes } from "@medusajs/types"
import { useMemo, useState } from "react"

type ShippingAddressProps = {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}

const inputClass =
  "w-full rounded-[14px] border border-[var(--shreem-border)] bg-white px-4 py-3 text-sm text-[var(--shreem-ink)] outline-none transition focus:border-[var(--shreem-accent)] focus:ring-2 focus:ring-[rgba(212,161,38,0.18)]"

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--shreem-muted)]"

const Field = ({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
  autoComplete,
  testId,
}: {
  label: string
  name: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  type?: string
  autoComplete?: string
  testId?: string
}) => {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        className={inputClass}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        type={type}
        autoComplete={autoComplete}
        data-testid={testId}
      />
    </label>
  )
}

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: ShippingAddressProps) => {
  const defaultCountry =
    cart?.shipping_address?.country_code ||
    cart?.region?.countries?.[0]?.iso_2 ||
    "in"

  const [formData, setFormData] = useState<Record<string, string>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": defaultCountry,
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || customer?.email || "",

    "billing_address.first_name":
      cart?.billing_address?.first_name ||
      cart?.shipping_address?.first_name ||
      "",
    "billing_address.last_name":
      cart?.billing_address?.last_name ||
      cart?.shipping_address?.last_name ||
      "",
    "billing_address.address_1":
      cart?.billing_address?.address_1 ||
      cart?.shipping_address?.address_1 ||
      "",
    "billing_address.company":
      cart?.billing_address?.company ||
      cart?.shipping_address?.company ||
      "",
    "billing_address.postal_code":
      cart?.billing_address?.postal_code ||
      cart?.shipping_address?.postal_code ||
      "",
    "billing_address.city":
      cart?.billing_address?.city ||
      cart?.shipping_address?.city ||
      "",
    "billing_address.country_code":
      cart?.billing_address?.country_code ||
      defaultCountry,
    "billing_address.province":
      cart?.billing_address?.province ||
      cart?.shipping_address?.province ||
      "",
    "billing_address.phone":
      cart?.billing_address?.phone ||
      cart?.shipping_address?.phone ||
      "",
  })

  const countries = useMemo(
    () => cart?.region?.countries || [],
    [cart?.region?.countries]
  )

  const customerAddresses = useMemo(
    () =>
      customer?.addresses?.filter((address) =>
        countries.some((country) => country.iso_2 === address.country_code)
      ) || [],
    [customer?.addresses, countries]
  )

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      }

      if (checked && name.startsWith("shipping_address.")) {
        const billingName = name.replace("shipping_address.", "billing_address.")
        next[billingName] = value
      }

      return next
    })
  }

  const fillFromSavedAddress = (address: any) => {
    setFormData((prev) => ({
      ...prev,
      "shipping_address.first_name": address.first_name || "",
      "shipping_address.last_name": address.last_name || "",
      "shipping_address.address_1": address.address_1 || "",
      "shipping_address.company": address.company || "",
      "shipping_address.postal_code": address.postal_code || "",
      "shipping_address.city": address.city || "",
      "shipping_address.country_code": address.country_code || defaultCountry,
      "shipping_address.province": address.province || "",
      "shipping_address.phone": address.phone || "",
      ...(checked
        ? {
            "billing_address.first_name": address.first_name || "",
            "billing_address.last_name": address.last_name || "",
            "billing_address.address_1": address.address_1 || "",
            "billing_address.company": address.company || "",
            "billing_address.postal_code": address.postal_code || "",
            "billing_address.city": address.city || "",
            "billing_address.country_code": address.country_code || defaultCountry,
            "billing_address.province": address.province || "",
            "billing_address.phone": address.phone || "",
          }
        : {}),
    }))
  }

  const countrySelect = (name: string, label: string, value: string) => (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select
        className={inputClass}
        name={name}
        value={value}
        onChange={handleChange}
        required
        data-testid={`${name}-select`}
      >
        {countries.length === 0 && <option value="in">India</option>}
        {countries.map((country) => (
          <option key={country.iso_2} value={country.iso_2}>
            {country.display_name || country.iso_2?.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <>
      {customerAddresses.length > 0 && (
        <div className="mb-6 rounded-[18px] border border-[var(--shreem-border)] bg-white/70 p-4">
          <p className="mb-3 text-sm font-semibold text-[var(--shreem-ink)]">
            Use a saved address
          </p>
          <div className="grid gap-2">
            {customerAddresses.map((address) => (
              <button
                key={address.id}
                type="button"
                onClick={() => fillFromSavedAddress(address)}
                className="rounded-[14px] border border-[var(--shreem-border)] bg-white px-4 py-3 text-left text-sm text-[var(--shreem-muted)] hover:border-[var(--shreem-accent)]"
              >
                <span className="font-semibold text-[var(--shreem-ink)]">
                  {address.first_name} {address.last_name}
                </span>
                <br />
                {address.address_1}, {address.city}, {address.postal_code}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 small:grid-cols-2">
        <Field
          label="First name"
          name="shipping_address.first_name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          autoComplete="given-name"
          testId="shipping-first-name-input"
        />
        <Field
          label="Last name"
          name="shipping_address.last_name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          autoComplete="family-name"
          testId="shipping-last-name-input"
        />
        <Field
          label="Address"
          name="shipping_address.address_1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          autoComplete="address-line1"
          testId="shipping-address-input"
        />
        <Field
          label="Company"
          name="shipping_address.company"
          value={formData["shipping_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          testId="shipping-company-input"
        />
        <Field
          label="Postal code"
          name="shipping_address.postal_code"
          value={formData["shipping_address.postal_code"]}
          onChange={handleChange}
          required
          autoComplete="postal-code"
          testId="shipping-postal-code-input"
        />
        <Field
          label="City"
          name="shipping_address.city"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          autoComplete="address-level2"
          testId="shipping-city-input"
        />
        {countrySelect(
          "shipping_address.country_code",
          "Country",
          formData["shipping_address.country_code"]
        )}
        <Field
          label="State / Province"
          name="shipping_address.province"
          value={formData["shipping_address.province"]}
          onChange={handleChange}
          autoComplete="address-level1"
          testId="shipping-province-input"
        />
        <Field
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          type="email"
          autoComplete="email"
          testId="shipping-email-input"
        />
        <Field
          label="Phone"
          name="shipping_address.phone"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          autoComplete="tel"
          testId="shipping-phone-input"
        />
      </div>

      <label className="mt-5 flex items-center gap-3 text-sm text-[var(--shreem-muted)]">
        <input
          type="checkbox"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 rounded border-[var(--shreem-border)]"
          data-testid="billing-address-checkbox"
        />
        Billing address same as shipping address
      </label>

      {!checked && (
        <div className="mt-6">
          <p className="mb-4 text-sm font-semibold text-[var(--shreem-ink)]">
            Billing address
          </p>
          <div className="grid gap-4 small:grid-cols-2">
            <Field
              label="First name"
              name="billing_address.first_name"
              value={formData["billing_address.first_name"]}
              onChange={handleChange}
              required
            />
            <Field
              label="Last name"
              name="billing_address.last_name"
              value={formData["billing_address.last_name"]}
              onChange={handleChange}
              required
            />
            <Field
              label="Address"
              name="billing_address.address_1"
              value={formData["billing_address.address_1"]}
              onChange={handleChange}
              required
            />
            <Field
              label="Company"
              name="billing_address.company"
              value={formData["billing_address.company"]}
              onChange={handleChange}
            />
            <Field
              label="Postal code"
              name="billing_address.postal_code"
              value={formData["billing_address.postal_code"]}
              onChange={handleChange}
              required
            />
            <Field
              label="City"
              name="billing_address.city"
              value={formData["billing_address.city"]}
              onChange={handleChange}
              required
            />
            {countrySelect(
              "billing_address.country_code",
              "Country",
              formData["billing_address.country_code"]
            )}
            <Field
              label="State / Province"
              name="billing_address.province"
              value={formData["billing_address.province"]}
              onChange={handleChange}
            />
            <Field
              label="Phone"
              name="billing_address.phone"
              value={formData["billing_address.phone"]}
              onChange={handleChange}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default ShippingAddress
