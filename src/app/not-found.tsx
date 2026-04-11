import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "404",
  description: "Something went wrong",
}

export default function NotFound() {
  return (
    <div className="content-container flex min-h-[calc(100vh-64px)] items-center justify-center py-12">
      <div className="brand-card flex max-w-[36rem] flex-col items-center gap-4 px-8 py-12 text-center">
        <p className="brand-kicker">404</p>
        <h1 className="text-[2.4rem] leading-none text-[var(--shreem-ink)]">
          Page not found
        </h1>
        <p className="text-small-regular text-[var(--shreem-muted)]">
          The page you tried to access does not exist or has moved.
        </p>
        <Link className="inline-flex items-center gap-x-1 group" href="/">
          <Text className="font-medium text-[var(--shreem-accent-dark)]">
            Go to frontpage
          </Text>
          <ArrowUpRightMini
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            color="var(--shreem-accent-dark)"
          />
        </Link>
      </div>
    </div>
  )
}
