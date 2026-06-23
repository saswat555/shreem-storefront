import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import { isDigitalOnlyCart } from "@lib/util/digital-cart"

const filterUnsafeShippingMethods = (methods: any[]) => {
  if (!Array.isArray(methods)) {
    return []
  }

  const filtered = methods.filter((method) => {
    const searchable = [
      method?.id,
      method?.name,
      method?.title,
      method?.shipping_option_id,
      method?.shipping_option?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    const looksLikeFakeOption =
      searchable.includes("1500") ||
      searchable.includes("above") ||
      searchable.includes("free delivery above") ||
      searchable.includes("free shipping above")

    return !looksLikeFakeOption
  })

  return filtered.length ? filtered : methods
}

const normalizePaymentMethods = (methods: any[]) => {
  if (!Array.isArray(methods)) {
    return []
  }

  return methods.filter((method) => Boolean(method?.id))
}

const CheckoutWarning = ({ message }: { message: string }) => (
  <div className="rounded-[18px] border border-orange-200 bg-orange-50 px-4 py-4 text-sm leading-6 text-orange-700">
    {message}
  </div>
)

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return (
      <CheckoutWarning message="Cart is not available. Please go back to the store and add the product again." />
    )
  }

  const shippingMethods = await listCartShippingMethods(cart.id).catch(
    (error) => {
      console.error("[checkout] unable to list shipping methods", {
        cart_id: cart.id,
        message: error?.message || String(error),
      })
      return []
    }
  )

  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "").catch(
    (error) => {
      console.error("[checkout] unable to list payment methods", {
        region_id: cart.region?.id,
        message: error?.message || String(error),
      })
      return []
    }
  )

  const safeShippingMethods = filterUnsafeShippingMethods(shippingMethods || [])
  const safePaymentMethods = normalizePaymentMethods(paymentMethods || [])
  const digitalOnlyCart = isDigitalOnlyCart(cart)

  return (
    <div className="grid w-full grid-cols-1 gap-y-4 small:gap-y-6">
      <Addresses cart={cart} customer={customer} />

      {digitalOnlyCart ? (
        <Shipping
          cart={cart}
          availableShippingMethods={[]}
          digitalOnly
        />
      ) : safeShippingMethods.length === 0 ? (
        <CheckoutWarning message="No delivery option is available right now. Please check the India region shipping option in Admin." />
      ) : (
        <Shipping cart={cart} availableShippingMethods={safeShippingMethods} />
      )}

      {safePaymentMethods.length === 0 ? (
        <CheckoutWarning message="No payment method is available right now. Please enable Razorpay or Manual UPI in the India region from Admin." />
      ) : (
        <Payment cart={cart} availablePaymentMethods={safePaymentMethods} />
      )}

      <Review cart={cart} />
    </div>
  )
}
