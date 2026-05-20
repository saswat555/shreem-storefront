import { Metadata } from "next"

import { policyPages } from "@lib/constants/policies"
import PolicyPage from "@modules/policies/templates/policy-page"

export const metadata: Metadata = {
  title: "Privacy Policy | Shreem Cow Products",
  description:
    "Read how Shreem Cow Products collects, uses, stores, and protects customer, order, shipping, and AI usage data.",
}

export default function PrivacyPolicyPage() {
  return <PolicyPage policy={policyPages.privacy} />
}
