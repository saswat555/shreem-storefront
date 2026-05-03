import {
  enrichOrderLineItemsWithProductImages,
  retrieveOrder,
} from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string; id: string }>
}
export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  const imageReadyOrder = await enrichOrderLineItemsWithProductImages(
    order,
    params.countryCode
  )

  return <OrderCompletedTemplate order={imageReadyOrder} />
}
