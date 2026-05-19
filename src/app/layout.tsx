import { buildRootMetadata } from "@lib/seo/metadata"
import "styles/globals.css"

export const metadata = buildRootMetadata()

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" suppressHydrationWarning>
      <body
        className="min-h-screen overflow-x-hidden antialiased"
        suppressHydrationWarning
      >
        <main className="relative isolate min-h-screen">
          <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_top,rgba(13,129,126,0.22),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(212,161,38,0.24),transparent_26%),radial-gradient(circle_at_20%_20%,rgba(18,63,99,0.14),transparent_30%)]" />
          {props.children}
        </main>
      </body>
    </html>
  )
}
