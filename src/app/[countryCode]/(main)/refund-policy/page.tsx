import { Metadata } from "next"

import { policyPages } from "@lib/constants/policies"
import PolicyPage from "@modules/policies/templates/policy-page"

export const metadata: Metadata = {
  title: "Refund Policy | Shreem Cow Products",
  description:
    "Read Shreem Cow Products refund policy for cancelled orders, failed payments, returns, and approved refund timelines.",
}

export default function RefundPolicyPage() {
  return <PolicyPage policy={policyPages.refund} />
}
