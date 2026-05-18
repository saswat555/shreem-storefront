"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"

const VERIFY_EMAIL_PREFIX = "VERIFY_EMAIL_SENT:"
const SUCCESS_PREFIX = "SUCCESS:"

const getCountryCodeFromForm = (formData: FormData) => {
  const countryCode = (formData.get("country_code") as string) || "in"

  return countryCode.toLowerCase().replace(/[^a-z]/g, "").slice(0, 4) || "in"
}

const requiresEmailVerification = (
  customer: HttpTypes.StoreCustomer | null | undefined
) => {
  const metadata = (customer?.metadata || {}) as Record<string, unknown>

  return (
    metadata.email_verification_required === true &&
    metadata.email_verified !== true
  )
}

const requestEmailVerificationForCurrentCustomer = async (
  countryCode: string
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client.fetch<{ sent: boolean; verified: boolean }>(
    "/store/auth/email-verification/request",
    {
      method: "POST",
      body: {
        country_code: countryCode,
      },
      headers,
      cache: "no-store",
    }
  )
}

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!("authorization" in authHeaders)) return null

    const headers = {
      ...authHeaders,
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders,+metadata",
        },
        headers,
        cache: "no-store",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const countryCode = getCountryCodeFromForm(formData)
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
    metadata: {
      email_verification_required: true,
      email_verified: false,
      email_verification_started_at: new Date().toISOString(),
    },
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    await setAuthToken(token as string)

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    await requestEmailVerificationForCurrentCustomer(countryCode)
    await removeAuthToken()

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    return `${VERIFY_EMAIL_PREFIX}Account created. We sent a verification link to ${createdCustomer.email}. Please verify your email before signing in.`
  } catch (error: any) {
    await removeAuthToken().catch(() => undefined)
    return error.toString()
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const countryCode = getCountryCodeFromForm(formData)

  try {
    const token = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    })

    await setAuthToken(token as string)

    const customer = await retrieveCustomer()

    if (requiresEmailVerification(customer)) {
      await requestEmailVerificationForCurrentCustomer(countryCode).catch(
        () => undefined
      )
      await removeAuthToken()
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)

      return `${VERIFY_EMAIL_PREFIX}Please verify your email before signing in. We sent a fresh verification link to ${email}.`
    }

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
  } catch (error: any) {
    await removeAuthToken().catch(() => undefined)
    return error.toString()
  }

  try {
    await transferCart()
  } catch (error: any) {
    return error.toString()
  }
}

export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
) {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase()
  const countryCode = getCountryCodeFromForm(formData)

  if (!email) {
    return "Email is required."
  }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
      metadata: {
        country_code: countryCode,
      },
    })

    return `${SUCCESS_PREFIX}If a Shreem account exists for ${email}, a reset link has been sent.`
  } catch (error: any) {
    return error.toString()
  }
}

export async function requestAuthenticatedPasswordReset(
  _currentState: unknown,
  formData: FormData
) {
  const countryCode = getCountryCodeFromForm(formData)
  const customer = await retrieveCustomer()

  if (!customer?.email) {
    return "Please sign in again to reset your password."
  }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: customer.email,
      metadata: {
        country_code: countryCode,
      },
    })

    return `${SUCCESS_PREFIX}Password reset link sent to ${customer.email}.`
  } catch (error: any) {
    return error.toString()
  }
}

export async function resetPassword(_currentState: unknown, formData: FormData) {
  const token = formData.get("token") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirm_password") as string

  if (!token) {
    return "Reset token is missing."
  }

  if (!password || password.length < 8) {
    return "Password must be at least 8 characters."
  }

  if (password !== confirmPassword) {
    return "Passwords do not match."
  }

  try {
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      {
        password,
      },
      token
    )

    return `${SUCCESS_PREFIX}Password updated. You can sign in with the new password.`
  } catch (error: any) {
    return error.toString()
  }
}

export async function confirmEmailVerificationToken(token: string) {
  if (!token) {
    return {
      verified: false,
      message: "Verification token is missing.",
    }
  }

  return sdk.client
    .fetch<{ verified: boolean; message?: string }>(
      "/store/auth/email-verification/confirm",
      {
        method: "POST",
        body: {
          token,
        },
        cache: "no-store",
      }
    )
    .then((result) => ({
      verified: result.verified,
      message: result.verified
        ? "Your email is verified. You can sign in now."
        : result.message || "Unable to verify email.",
    }))
    .catch((error) => ({
      verified: false,
      message: error.toString(),
    }))
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
