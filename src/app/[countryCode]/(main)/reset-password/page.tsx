import { Metadata } from "next"

import { privatePageMetadata } from "@lib/seo/metadata"
import ResetPassword from "@modules/account/components/reset-password"

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Reset Password",
  description: "Reset your Shreem Farms account password securely.",
}

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="content-container flex justify-center py-10 pb-20">
      <section className="brand-surface flex w-full justify-center px-5 py-8 small:px-10 small:py-12">
        <ResetPassword token={searchParams.token} email={searchParams.email} />
      </section>
    </div>
  )
}
