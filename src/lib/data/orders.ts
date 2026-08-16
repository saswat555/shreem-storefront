"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders } from "./cookies"
import { HttpTypes } from "@medusajs/types"
import { listProducts } from "./products"

const ORDER_FIELDS = [
  "*payment_collections",
  "*payment_collections.payments",
  "+payment_collections.payments.data",
  "*items",
  "+items.thumbnail",
  "+items.product_handle",
  "+items.product_title",
  "*items.metadata",
  "*items.variant",
  "+items.variant.thumbnail",
  "*items.variant.images",
  "*items.variant.product",
  "+items.variant.product.thumbnail",
  "*items.variant.product.images",
  "*items.product",
  "+items.product.thumbnail",
  "*items.product.images",
].join(",")

export const retrieveOrder = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: "GET",
      query: {
        fields: ORDER_FIELDS,
      },
      headers,
      cache: "no-store",
    })
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
}

type ImageBackedProduct = Pick<
  HttpTypes.StoreProduct,
  "id" | "handle" | "title" | "thumbnail" | "images"
>

type ImageBackedLineItem = HttpTypes.StoreOrderLineItem & {
  product_handle?: string | null
  product_title?: string | null
  product_id?: string | null
  thumbnail?: string | null
  product?: ImageBackedProduct | null
  variant?: (HttpTypes.StoreProductVariant & {
    thumbnail?: string | null
    product?: ImageBackedProduct | null
  }) | null
}

const lineItemHasImage = (item: ImageBackedLineItem) => {
  const product = item.product
  const variantProduct = item.variant?.product

  return Boolean(
    item.thumbnail ||
      item.variant?.thumbnail ||
      product?.thumbnail ||
      product?.images?.[0]?.url ||
      variantProduct?.thumbnail ||
      variantProduct?.images?.[0]?.url
  )
}

export const enrichOrderLineItemsWithProductImages = async (
  order: HttpTypes.StoreOrder,
  countryCode: string
) => {
  const items = (order.items || []) as ImageBackedLineItem[]
  const missingImageItems = items.filter((item) => !lineItemHasImage(item))

  if (!missingImageItems.length) {
    return order
  }

  const lookupKeys = Array.from(
    new Set(
      missingImageItems
        .map((item) => item.product_handle || item.product?.handle || item.product_id)
        .filter((key): key is string => Boolean(key))
    )
  )

  if (!lookupKeys.length) {
    return order
  }

  const products = await Promise.all(
    lookupKeys.map((key) =>
      listProducts({
        countryCode,
        queryParams: {
          limit: 1,
          fields: "id,handle,title,thumbnail,*images",
          ...(key.startsWith("prod_") ? { id: [key] } : { handle: key }),
        },
      })
        .then(({ response }) => response.products[0] as ImageBackedProduct | undefined)
        .catch(() => undefined)
    )
  )

  const productsByHandle = new Map(
    products
      .filter((product): product is ImageBackedProduct => Boolean(product))
      .flatMap((product) => [
        [product.handle, product] as const,
        [product.id, product] as const,
      ])
  )

  if (!productsByHandle.size) {
    return order
  }

  return {
    ...order,
    items: items.map((item) => {
      if (lineItemHasImage(item)) {
        return item
      }

      const product =
        productsByHandle.get(item.product_handle || "") ||
        productsByHandle.get(item.product?.handle || "") ||
        productsByHandle.get(item.product_id || "")

      if (!product) {
        return item
      }

      return {
        ...item,
        thumbnail: item.thumbnail || product.thumbnail || product.images?.[0]?.url,
        product: {
          ...(item.product || {}),
          ...product,
          thumbnail:
            item.product?.thumbnail ||
            product.thumbnail ||
            product.images?.[0]?.url ||
            null,
          images: item.product?.images?.length ? item.product.images : product.images,
        },
        variant: item.variant
          ? {
              ...item.variant,
              product: {
                ...(item.variant.product || {}),
                ...product,
                thumbnail:
                  item.variant.product?.thumbnail ||
                  product.thumbnail ||
                  product.images?.[0]?.url ||
                  null,
                images: item.variant.product?.images?.length
                  ? item.variant.product.images
                  : product.images,
              },
            }
          : item.variant,
      }
    }),
  } as HttpTypes.StoreOrder
}

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, any>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderListResponse>(`/store/orders`, {
      method: "GET",
      query: {
        limit,
        offset,
        order: "-created_at",
        fields: ORDER_FIELDS,
        ...filters,
      },
      headers,
      cache: "no-store",
    })
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))
}

export const createTransferRequest = async (
  state: {
    success: boolean
    error: string | null
    order: HttpTypes.StoreOrder | null
  },
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}> => {
  const id = formData.get("order_id") as string

  if (!id) {
    return { success: false, error: "Order ID is required", order: null }
  }

  const headers = await getAuthHeaders()

  return await sdk.store.order
    .requestTransfer(
      id,
      {},
      {
        fields: "id, email",
      },
      headers
    )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .acceptTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .declineTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}
