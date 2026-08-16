import { Metadata } from "next"

import { policyPages } from "@lib/constants/policies"
import PolicyPage from "@modules/policies/templates/policy-page"

export const metadata: Metadata = {
  title: "Shipping Policy | Shreem Farms",
  description:
    "Read how Shreem Farms uses courier partner for delivery serviceability, shipping rates, dispatch, tracking, and failed delivery handling.",
}

export default function ShippingPolicyPage() {
  return <PolicyPage policy={policyPages.shipping} />
}
