"use client"

import { Button, Heading, RadioGroup, Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { setShippingMethod } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"

type ShippingProps = {
  cart: any
  availableShippingMethods: any[]
}

const Shipping = ({ cart, availableShippingMethods }: ShippingProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethodId, setSelectedMethodId] = useState(
    cart?.shipping_methods?.[0]?.shipping_option_id ||
      cart?.shipping_methods?.[0]?.shipping_option?.id ||
      ""
  )

  const isOpen = searchParams.get("step") === "delivery"

  const handleEdit = () => {
    router.push(pathname + "?step=delivery")
  }

  const handleSubmit = async () => {
    if (!selectedMethodId) {
      setError("Please select a delivery option.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await setShippingMethod({
        cartId: cart.id,
        shippingMethodId: selectedMethodId,
      })
      router.push(pathname + "?step=payment")
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Could not set delivery option.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedOption = availableShippingMethods?.find(
    (m) => m.id === selectedMethodId
  )

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading level="h2" className="text-2xl">
          Delivery
        </Heading>

        {!isOpen && cart?.shipping_methods?.length > 0 && (
          <button
            onClick={handleEdit}
            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
            data-testid="edit-delivery-button"
          >
            Edit
          </button>
        )}
      </div>

      {isOpen ? (
        <div>
          {!availableShippingMethods?.length ? (
            <div className="rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
              No delivery option is available for this region. Add a normal Medusa shipping option in Admin → Settings → Regions.
            </div>
          ) : (
            <RadioGroup
              value={selectedMethodId}
              onValueChange={setSelectedMethodId}
              className="flex flex-col gap-y-3"
            >
              {availableShippingMethods.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div className="flex items-center gap-x-3">
                    <RadioGroup.Item value={option.id} id={option.id} />
                    <label htmlFor={option.id} className="cursor-pointer">
                      <Text className="font-medium">
                        {option.name || "Standard Delivery"}
                      </Text>
                    </label>
                  </div>

                  <Text>
                    {option.amount != null
                      ? convertToLocale({
                          amount: option.amount,
                          currency_code: cart.currency_code,
                        })
                      : "Calculated"}
                  </Text>
                </div>
              ))}
            </RadioGroup>
          )}

          <ErrorMessage error={error} data-testid="delivery-error-message" />

          <Button
            size="large"
            className="mt-6"
            isLoading={isLoading}
            disabled={isLoading || !selectedMethodId}
            onClick={handleSubmit}
            data-testid="submit-delivery-option-button"
          >
            Continue to payment
          </Button>
        </div>
      ) : (
        <div>
          {cart?.shipping_methods?.length > 0 ? (
            <div className="text-small-regular">
              <Text>
                {selectedOption?.name ||
                  cart.shipping_methods[0]?.name ||
                  "Standard Delivery"}
              </Text>
              <Text className="text-ui-fg-subtle">
                {cart.shipping_methods[0]?.amount != null
                  ? convertToLocale({
                      amount: cart.shipping_methods[0].amount,
                      currency_code: cart.currency_code,
                    })
                  : ""}
              </Text>
            </div>
          ) : (
            <Text className="text-ui-fg-subtle">
              No delivery option selected.
            </Text>
          )}
        </div>
      )}
    </div>
  )
}

export default Shipping
