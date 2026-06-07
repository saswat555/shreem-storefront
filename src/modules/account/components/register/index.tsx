"use client"

import { useActionState, useEffect, useRef } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
import { useParams } from "next/navigation"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
  onSignupSuccess: (message: string) => void
}

const Register = ({ setCurrentView, onSignupSuccess }: Props) => {
  const params = useParams<{ countryCode?: string }>()
  const countryCode = params?.countryCode || "in"
  const [message, formAction] = useActionState(signup, null)
  const handledSuccessRef = useRef<string | null>(null)
  const isNotice =
    typeof message === "string" && message.startsWith("VERIFY_EMAIL_SENT:")
  const displayMessage =
    typeof message === "string"
      ? message.replace("VERIFY_EMAIL_SENT:", "")
      : null

  useEffect(() => {
    if (!isNotice || !displayMessage) {
      return
    }

    if (handledSuccessRef.current === displayMessage) {
      return
    }

    handledSuccessRef.current = displayMessage
    onSignupSuccess(displayMessage)
  }, [displayMessage, isNotice, onSignupSuccess])

  return (
    <div
      className="flex w-full max-w-sm flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="mb-4 text-center text-[2rem] leading-none text-[var(--shreem-ink)] small:mb-6 small:text-large-semi small:uppercase">
        Become a Shreem Member
      </h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        Create your Shreem profile for faster checkout, order tracking, and a
        more personal shopping journey.
      </p>
      <form className="w-full flex flex-col" action={formAction}>
        <input type="hidden" name="country_code" value={countryCode} />
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="First name"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Password"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        {!isNotice ? (
          <ErrorMessage error={displayMessage} data-testid="register-error" />
        ) : (
          <p className="pt-3 text-center text-small-regular text-[var(--shreem-muted)]">
            Creating your account and opening sign in...
          </p>
        )}
        <span className="text-center text-ui-fg-base text-small-regular mt-6">
          By creating an account, you agree to Shreem&apos;s{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline"
          >
            Privacy Policy
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="underline"
          >
            Terms of Use
          </LocalizedClientLink>
          .
        </span>


        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Join
        </SubmitButton>
      </form>
      <div className="w-full mt-4 flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-4">
          <hr className="w-full border-ui-border-base" />
          <span className="px-2 text-ui-fg-muted text-small-regular">OR</span>
          <hr className="w-full border-ui-border-base" />
        </div>
        <a href={`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/auth/customer/google`} className="w-full flex items-center justify-center gap-x-2 rounded-full border border-[var(--shreem-teal)] px-4 py-2 text-small-regular font-semibold hover:bg-ui-bg-subtle transition-colors">
          Sign up with Google
        </a>
      </div>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Already a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="min-h-11 rounded-full px-2 font-semibold underline"
        >
          Sign in
        </button>
        .
      </span>
    </div>
  )
}

export default Register
