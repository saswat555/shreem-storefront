"use client"

import { createContext, useContext } from "react"

type DisabledDeliveryContext = {
  status: "disabled"
  rate: null
  error: ""
  postalCode: ""
  cartSignature: ""
  cartWeightKg: 0
  cartPackageDetails: {
    lengthCm?: number
    breadthCm?: number
    heightCm?: number
  }
  calculate: (..._args: any[]) => Promise<null>
  clear: () => void
}

const disabledValue: DisabledDeliveryContext = {
  status: "disabled",
  rate: null,
  error: "",
  postalCode: "",
  cartSignature: "",
  cartWeightKg: 0,
  cartPackageDetails: {},
  calculate: async () => null,
  clear: () => {},
}

const DeliveryContext = createContext<DisabledDeliveryContext>(disabledValue)

export const ShiprocketCheckoutProvider = ({
  children,
}: {
  cart?: any
  children: React.ReactNode
}) => {
  return (
    <DeliveryContext.Provider value={disabledValue}>
      {children}
    </DeliveryContext.Provider>
  )
}

export const useShiprocketCheckout = () => useContext(DeliveryContext)
