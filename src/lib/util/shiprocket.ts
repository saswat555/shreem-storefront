export type ShiprocketCourier = Record<string, any>
export type ShiprocketPackageQuote = Record<string, any>
export type ShiprocketRate = Record<string, any> | null

export const isShiprocketShippingOption = (_option: any) => false

export const formatShiprocketAmount = (
  amountPaise: number | null | undefined,
  currencyCode = "inr"
) => {
  const amount = Number(amountPaise || 0) / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: String(currencyCode || "inr").toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount)
}

export const getShiprocketAmountPaise = (_rate: any) => 0
export const getShiprocketAmountMajor = (_rate: any) => 0
export const getShiprocketCourierAmountPaise = (_courier: any) => 0
export const getShiprocketEtaLabel = (_rate: any) => ""
export const getCartShiprocketSignature = (_cart: any) => ""
export const buildShiprocketShippingData = (_input: any) => ({})
export const getShiprocketRate = async (..._args: any[]) => null
export const calculateShiprocketRate = async (..._args: any[]) => null
