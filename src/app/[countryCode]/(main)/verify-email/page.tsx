import { Metadata } from "next"

import { confirmEmailVerificationToken } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your Shreem Farms account email.",
}

export default async function VerifyEmailPage(props: {
  searchParams: Promise<{ token?: string }>
}) {
  const searchParams = await props.searchParams
  const result = await confirmEmailVerificationToken(searchParams.token || "")

  return (
    <div className="content-container flex justify-center py-10 pb-20">
      <section className="brand-surface w-full max-w-2xl px-5 py-8 text-center small:px-10 small:py-12">
        <p className="brand-pill mx-auto mb-5 w-fit">Account security</p>
        <h1 className="text-[2.4rem] leading-none text-[var(--shreem-ink)]">
          {result.verified ? "Email verified" : "Verification failed"}
        </h1>
        <p
          className={
            result.verified
              ? "mx-auto mt-5 max-w-xl text-base leading-7 text-emerald-700"
              : "mx-auto mt-5 max-w-xl text-base leading-7 text-rose-600"
          }
        >
          {result.message}
        </p>
        <LocalizedClientLink
          href="/account"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--shreem-teal)] px-6 py-3 text-small-regular font-semibold text-white"
        >
          Continue to account
        </LocalizedClientLink>
      </section>
    </div>
  )
}
