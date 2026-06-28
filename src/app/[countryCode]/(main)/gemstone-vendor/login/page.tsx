import { Metadata } from "next"
import VendorPortal from "@modules/gemstones/templates/vendor-portal"

export const metadata: Metadata = {
  title: "Gemstone Vendor Login | Shreem Farms",
  robots: {
    index: false,
    follow: false,
  },
}

export default function GemstoneVendorLoginPage() {
  return <VendorPortal />
}
