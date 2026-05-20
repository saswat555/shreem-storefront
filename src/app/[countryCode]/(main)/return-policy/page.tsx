import { Metadata } from "next"

import { policyPages } from "@lib/constants/policies"
import PolicyPage from "@modules/policies/templates/policy-page"

export const metadata: Metadata = {
  title: "Return Policy | Shreem Cow Products",
  description:
    "Read Shreem Cow Products return and replacement rules for wrong, damaged, missing, or quality-issue products.",
}

export default function ReturnPolicyPage() {
  return <PolicyPage policy={policyPages.return} />
}
