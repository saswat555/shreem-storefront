"use client"

import type { HttpTypes } from "@medusajs/types"
import {
  getCartShiprocketSignature,
  getCartWeightKg,
  getShiprocketSessionKey,
  isCompleteIndianPincode,
  isIndianAddress,
  normalizePincode,
  ShiprocketRate,
  ShiprocketStatus,
} from "@lib/util/shiprocket"
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

type ShiprocketSnapshot = {
  postalCode: string
  countryCode: string
  cartSignature: string
  rate: ShiprocketRate | null
  status: ShiprocketStatus
  error: string | null
}

type CalculateArgs = {
  postalCode?: string | null
  countryCode?: string | null
  cart?: HttpTypes.StoreCart
  cod?: boolean
}

type ShiprocketContextValue = ShiprocketSnapshot & {
  isRequired: boolean
  isReady: boolean
  isBlocking: boolean
  cartWeightKg: number
  calculate: (args: CalculateArgs) => Promise<ShiprocketRate | null>
  reset: () => void
}

const ShiprocketContext = createContext<ShiprocketContextValue | null>(null)

const initialSnapshot: ShiprocketSnapshot = {
  postalCode: "",
  countryCode: "",
  cartSignature: "",
  rate: null,
  status: "idle",
  error: null,
}

export function ShiprocketCheckoutProvider({
  cart,
  children,
}: {
  cart: HttpTypes.StoreCart
  children: ReactNode
}) {
  const cartSignature = useMemo(() => getCartShiprocketSignature(cart), [cart])
  const cartWeightKg = useMemo(() => getCartWeightKg(cart), [cart])
  const storageKey = useMemo(() => getShiprocketSessionKey(cart.id), [cart.id])
  const requestIdRef = useRef(0)
  const [snapshot, setSnapshot] = useState<ShiprocketSnapshot>(() => ({
    ...initialSnapshot,
    postalCode: normalizePincode(cart.shipping_address?.postal_code),
    countryCode: cart.shipping_address?.country_code || "",
    cartSignature,
  }))

  const isRequired = isIndianAddress(
    snapshot.countryCode || cart.shipping_address?.country_code
  )
  const isReady = snapshot.status === "available" && Boolean(snapshot.rate)
  const isBlocking =
    isRequired &&
    (!isReady ||
      snapshot.postalCode !== normalizePincode(cart.shipping_address?.postal_code) ||
      snapshot.cartSignature !== cartSignature)

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(storageKey)

      if (!stored) {
        return
      }

      const parsed = JSON.parse(stored) as ShiprocketSnapshot

      if (parsed.cartSignature === cartSignature) {
        setSnapshot({
          ...parsed,
          postalCode:
            parsed.postalCode || normalizePincode(cart.shipping_address?.postal_code),
          countryCode: parsed.countryCode || cart.shipping_address?.country_code || "",
          cartSignature,
        })
      }
    } catch {}
  }, [cart.shipping_address?.country_code, cart.shipping_address?.postal_code, cartSignature, storageKey])

  useEffect(() => {
    if (snapshot.status !== "available" || !snapshot.rate) {
      return
    }

    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot))
    } catch {}
  }, [snapshot, storageKey])

  useEffect(() => {
    if (snapshot.cartSignature === cartSignature) {
      return
    }

    setSnapshot((current) => ({
      ...current,
      cartSignature,
      status: current.status === "available" ? "waiting" : current.status,
      rate: null,
      error: null,
    }))
  }, [cartSignature, snapshot.cartSignature])

  const reset = useCallback(() => {
    setSnapshot({
      ...initialSnapshot,
      cartSignature,
    })

    try {
      window.sessionStorage.removeItem(storageKey)
    } catch {}
  }, [cartSignature, storageKey])

  const calculate = useCallback(
    async ({
      postalCode,
      countryCode,
      cart: nextCart,
      cod = false,
    }: CalculateArgs) => {
      const targetCart = nextCart || cart
      const normalizedPostalCode = normalizePincode(postalCode)
      const normalizedCountryCode = (countryCode || "").toLowerCase()
      const targetSignature = getCartShiprocketSignature(targetCart)

      if (!isIndianAddress(normalizedCountryCode)) {
        setSnapshot({
          ...initialSnapshot,
          postalCode: normalizedPostalCode,
          countryCode: normalizedCountryCode,
          cartSignature: targetSignature,
        })
        return null
      }

      if (!isCompleteIndianPincode(normalizedPostalCode)) {
        setSnapshot((current) => ({
          ...current,
          postalCode: normalizedPostalCode,
          countryCode: normalizedCountryCode,
          cartSignature: targetSignature,
          status: normalizedPostalCode ? "waiting" : "idle",
          rate: null,
          error: null,
        }))
        return null
      }

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      setSnapshot((current) => ({
        ...current,
        postalCode: normalizedPostalCode,
        countryCode: normalizedCountryCode,
        cartSignature: targetSignature,
        status: "loading",
        error: null,
      }))

      try {
        const response = await fetch("/api/shiprocket/rates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postal_code: normalizedPostalCode,
            weight: getCartWeightKg(targetCart),
            cod,
          }),
          cache: "no-store",
        })
        const data = (await response.json().catch(() => null)) as
          | ShiprocketRate
          | null

        if (requestId !== requestIdRef.current) {
          return null
        }

        if (!response.ok || !data?.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Unable to calculate shipping right now. Please try again."
          )
        }

        if (!data.available) {
          setSnapshot({
            postalCode: normalizedPostalCode,
            countryCode: normalizedCountryCode,
            cartSignature: targetSignature,
            rate: data,
            status: "unavailable",
            error:
              data.message ||
              "Delivery is not available for this pincode. Please try another address.",
          })
          return data
        }

        setSnapshot({
          postalCode: normalizedPostalCode,
          countryCode: normalizedCountryCode,
          cartSignature: targetSignature,
          rate: data,
          status: "available",
          error: null,
        })

        return data
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return null
        }

        setSnapshot({
          postalCode: normalizedPostalCode,
          countryCode: normalizedCountryCode,
          cartSignature: targetSignature,
          rate: null,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Unable to calculate shipping right now. Please try again.",
        })
        return null
      }
    },
    [cart]
  )

  useEffect(() => {
    const postalCode = normalizePincode(cart.shipping_address?.postal_code)
    const countryCode = (cart.shipping_address?.country_code || "").toLowerCase()

    if (!isIndianAddress(countryCode) || !postalCode) {
      return
    }

    const snapshotMatches =
      snapshot.postalCode === postalCode &&
      snapshot.countryCode === countryCode &&
      snapshot.cartSignature === cartSignature

    if (
      snapshotMatches &&
      ["available", "loading", "waiting", "unavailable", "error"].includes(
        snapshot.status
      )
    ) {
      return
    }

    const timer = window.setTimeout(() => {
      calculate({
        postalCode,
        countryCode,
        cart,
      })
    }, isCompleteIndianPincode(postalCode) ? 500 : 100)

    return () => window.clearTimeout(timer)
  }, [
    calculate,
    cart,
    cart.shipping_address?.country_code,
    cart.shipping_address?.postal_code,
    cartSignature,
    snapshot.cartSignature,
    snapshot.countryCode,
    snapshot.postalCode,
    snapshot.status,
  ])

  const value = useMemo(
    () => ({
      ...snapshot,
      isRequired,
      isReady,
      isBlocking,
      cartWeightKg,
      calculate,
      reset,
    }),
    [calculate, cartWeightKg, isBlocking, isReady, isRequired, reset, snapshot]
  )

  return (
    <ShiprocketContext.Provider value={value}>
      {children}
    </ShiprocketContext.Provider>
  )
}

export function useShiprocketCheckout() {
  const context = useContext(ShiprocketContext)

  if (!context) {
    throw new Error(
      "useShiprocketCheckout must be used inside ShiprocketCheckoutProvider"
    )
  }

  return context
}
