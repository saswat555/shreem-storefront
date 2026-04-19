"use server"

import { sdk } from "@lib/config"
import { revalidatePath } from "next/cache"
import { getAuthHeaders } from "./cookies"

export type ProductReview = {
  id: string
  product_id: string
  order_id?: string | null
  line_item_id?: string | null
  customer_id?: string | null
  customer_name?: string | null
  rating: number
  title?: string | null
  content?: string | null
  status?: "pending" | "approved" | "rejected"
  created_at?: string
}

export type ReviewFormState = {
  success: boolean
  error: string | null
}

const getReviewErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes("404")) {
      return "Product reviews are not enabled on the backend yet."
    }

    return error.message
  }

  return "Unable to submit your review right now."
}

export const listProductReviews = async (
  productId: string
): Promise<ProductReview[]> => {
  if (!productId) {
    return []
  }

  return sdk.client
    .fetch<{ reviews: ProductReview[] }>(`/store/products/${productId}/reviews`, {
      method: "GET",
      query: {
        status: "approved",
        limit: 50,
        order: "-created_at",
      },
      cache: "no-store",
    })
    .then(({ reviews }) => reviews ?? [])
    .catch(() => [])
}

export const submitProductReview = async (
  _state: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> => {
  const productId = String(formData.get("product_id") || "")
  const orderId = String(formData.get("order_id") || "")
  const lineItemId = String(formData.get("line_item_id") || "")
  const productHandle = String(formData.get("product_handle") || "")
  const rating = Number(formData.get("rating") || 0)
  const title = String(formData.get("title") || "").trim()
  const content = String(formData.get("content") || "").trim()

  if (!productId || !orderId || !lineItemId) {
    return {
      success: false,
      error: "Missing product or order details for this review.",
    }
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      success: false,
      error: "Choose a rating between 1 and 5 stars.",
    }
  }

  if (!content) {
    return {
      success: false,
      error: "Write a short review before submitting.",
    }
  }

  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return {
      success: false,
      error: "Sign in before submitting product feedback.",
    }
  }

  return sdk.client
    .fetch<{ review: ProductReview }>(`/store/product-reviews`, {
      method: "POST",
      headers,
      body: {
        product_id: productId,
        order_id: orderId,
        line_item_id: lineItemId,
        rating,
        title,
        content,
      },
      cache: "no-store",
    })
    .then(() => {
      if (productHandle) {
        revalidatePath(`/products/${productHandle}`)
      }

      revalidatePath("/account/orders")

      return {
        success: true,
        error: null,
      }
    })
    .catch((error) => ({
      success: false,
      error: getReviewErrorMessage(error),
    }))
}
