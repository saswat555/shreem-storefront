import { Metadata } from "next"

import { policyPages } from "@lib/constants/policies"
import PolicyPage from "@modules/policies/templates/policy-page"

export const metadata: Metadata = {
  title: "Terms and Conditions | Shreem Farms",
  description:
    "Read the customer terms for using Shreem Farms, placing orders, making payments, and using digital services.",
}

export default function TermsAndConditionsPage() {
  return <PolicyPage policy={policyPages.terms} />
}
