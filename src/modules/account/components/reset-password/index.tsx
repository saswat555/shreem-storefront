"use client"

import { resetPassword } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

type ResetPasswordProps = {
  token?: string
  email?: string
}

const ResetPassword = ({ token, email }: ResetPasswordProps) => {
  const [message, formAction] = useActionState(resetPassword, null)
  const isSuccess =
    typeof message === "string" && message.startsWith("SUCCESS:")
  const displayMessage =
    typeof message === "string" ? message.replace("SUCCESS:", "") : null

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <h1 className="mb-4 text-center text-[2.4rem] leading-none text-[var(--shreem-ink)]">
        Reset password
      </h1>
      <p className="mb-7 text-center text-base-regular text-ui-fg-subtle">
        Choose a new password for {email || "your Shreem account"}.
      </p>

      {token ? (
        <form action={formAction} className="w-full">
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col gap-y-2">
            <Input
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Input
              label="Confirm password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {isSuccess ? (
            <div className="pt-3 text-center text-small-regular font-medium text-emerald-700">
              {displayMessage}
            </div>
          ) : (
            <ErrorMessage error={displayMessage} />
          )}
          <SubmitButton className="mt-6 w-full">Update password</SubmitButton>
        </form>
      ) : (
        <div className="brand-card w-full p-5 text-center text-rose-600">
          Reset token is missing. Please request a fresh password reset link.
        </div>
      )}

      <LocalizedClientLink
        href="/account"
        className="mt-6 min-h-11 rounded-full px-4 py-3 text-small-regular font-semibold underline"
      >
        Back to sign in
      </LocalizedClientLink>
    </div>
  )
}

export default ResetPassword
