"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState(LOGIN_VIEW.SIGN_IN)
  const [signupNotice, setSignupNotice] = useState<string | null>(null)

  return (
    <div className="flex min-h-[52vh] w-full items-center justify-center px-0 py-2 small:px-8 small:py-8">
      {currentView === LOGIN_VIEW.SIGN_IN ? (
        <Login
          setCurrentView={setCurrentView}
          signupNotice={signupNotice}
          onSignupNoticeConsumed={() => setSignupNotice(null)}
        />
      ) : (
        <Register
          setCurrentView={setCurrentView}
          onSignupSuccess={(message) => {
            setSignupNotice(message)
            setCurrentView(LOGIN_VIEW.SIGN_IN)
          }}
        />
      )}
    </div>
  )
}

export default LoginTemplate
