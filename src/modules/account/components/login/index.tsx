import { login, requestPasswordReset } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useParams } from "next/navigation"
import { useActionState, useState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const params = useParams<{ countryCode?: string }>()
  const countryCode = params?.countryCode || "in"
  const [message, formAction] = useActionState(login, null)
  const [resetMessage, resetAction] = useActionState(requestPasswordReset, null)
  const [isResetView, setIsResetView] = useState(false)
  const loginNotice =
    typeof message === "string" &&
    (message.startsWith("VERIFY_EMAIL_SENT:") || message.startsWith("SUCCESS:"))
  const resetNotice =
    typeof resetMessage === "string" && resetMessage.startsWith("SUCCESS:")
  const displayLoginMessage =
    typeof message === "string"
      ? message.replace("VERIFY_EMAIL_SENT:", "").replace("SUCCESS:", "")
      : null
  const displayResetMessage =
    typeof resetMessage === "string"
      ? resetMessage.replace("SUCCESS:", "")
      : null

  return (
    <div
      className="flex w-full max-w-sm flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="mb-4 text-[2rem] leading-none text-[var(--shreem-ink)] small:mb-6 small:text-large-semi small:uppercase">
        {isResetView ? "Reset password" : "Welcome back"}
      </h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        {isResetView
          ? "Enter your account email and we will send a secure reset link."
          : "Sign in to revisit your orders, saved details, and Shreem favourites."}
      </p>
      {isResetView ? (
        <form className="w-full" action={resetAction}>
          <input type="hidden" name="country_code" value={countryCode} />
          <div className="flex flex-col w-full gap-y-2">
            <Input
              label="Email"
              name="email"
              type="email"
              title="Enter a valid email address."
              autoComplete="email"
              required
              data-testid="reset-email-input"
            />
          </div>
          {resetNotice ? (
            <div className="pt-3 text-center text-small-regular font-medium text-emerald-700">
              {displayResetMessage}
            </div>
          ) : (
            <ErrorMessage
              error={displayResetMessage}
              data-testid="reset-error-message"
            />
          )}
          <SubmitButton data-testid="reset-password-button" className="w-full mt-6">
            Send reset link
          </SubmitButton>
        </form>
      ) : (
        <form className="w-full" action={formAction}>
          <input type="hidden" name="country_code" value={countryCode} />
          <div className="flex flex-col w-full gap-y-2">
            <Input
              label="Email"
              name="email"
              type="email"
              title="Enter a valid email address."
              autoComplete="email"
              required
              data-testid="email-input"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              data-testid="password-input"
            />
          </div>
          {loginNotice ? (
            <div className="pt-3 text-center text-small-regular font-medium text-emerald-700">
              {displayLoginMessage}
            </div>
          ) : (
            <ErrorMessage
              error={displayLoginMessage}
              data-testid="login-error-message"
            />
          )}
          <button
            type="button"
            onClick={() => setIsResetView(true)}
            className="mt-4 min-h-11 rounded-full text-small-regular font-semibold text-[var(--shreem-teal)] underline"
          >
            Forgot password?
          </button>
          <SubmitButton data-testid="sign-in-button" className="w-full mt-2">
            Sign in
          </SubmitButton>
        </form>
      )}
      {isResetView && (
        <button
          type="button"
          onClick={() => setIsResetView(false)}
          className="mt-5 min-h-11 rounded-full px-3 text-small-regular font-semibold underline"
        >
          Back to sign in
        </button>
      )}
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Not a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="min-h-11 rounded-full px-2 font-semibold underline"
          data-testid="register-button"
        >
          Join us
        </button>
        .
      </span>
    </div>
  )
}

export default Login
