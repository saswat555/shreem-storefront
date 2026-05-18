"use client"

import { requestAuthenticatedPasswordReset } from "@lib/data/customer"
import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useParams } from "next/navigation"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ResetButton = () => {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      isLoading={pending}
      variant="secondary"
      className="min-h-11 w-full small:w-auto"
    >
      Send reset link
    </Button>
  )
}

const ProfilePassword = ({ customer }: MyInformationProps) => {
  const params = useParams<{ countryCode?: string }>()
  const countryCode = params?.countryCode || "in"
  const [message, formAction] = useActionState(
    requestAuthenticatedPasswordReset,
    null
  )
  const isSuccess =
    typeof message === "string" && message.startsWith("SUCCESS:")
  const displayMessage =
    typeof message === "string" ? message.replace("SUCCESS:", "") : null

  return (
    <section className="text-small-regular" data-testid="account-password-editor">
      <div className="flex flex-col gap-4 small:flex-row small:items-center small:justify-between">
        <div className="min-w-0">
          <span className="uppercase text-ui-fg-base">Password</span>
          <p className="mt-1 max-w-2xl text-ui-fg-subtle">
            For security, Shreem sends a short-lived reset link to{" "}
            <span className="font-semibold text-ui-fg-base">
              {customer.email}
            </span>
            .
          </p>
          {displayMessage && (
            <p
              className={
                isSuccess
                  ? "mt-2 text-emerald-700"
                  : "mt-2 text-rose-600"
              }
            >
              {displayMessage}
            </p>
          )}
        </div>
        <form action={formAction} className="shrink-0">
          <input type="hidden" name="country_code" value={countryCode} />
          <ResetButton />
        </form>
      </div>
    </section>
  )
}

export default ProfilePassword
