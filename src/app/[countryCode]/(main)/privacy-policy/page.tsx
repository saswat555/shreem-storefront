import { Metadata } from "next"

import { policyPages } from "@lib/constants/policies"
import PolicyPage from "@modules/policies/templates/policy-page"

export const metadata: Metadata = {
  title: "Privacy Policy | Shreem Farms",
  description:
    "Read how Shreem Farms collects, uses, stores, and protects customer, order, shipping, and AI usage data.",
}

export default function PrivacyPolicyPage() {
  return <PolicyPage policy={policyPages.privacy} />
}
