"use client"

import { XMark } from "@medusajs/icons"
import { useEffect, useId, useState } from "react"

type ManualUpiQrImageProps = {
  src: string
  alt?: string
  className?: string
  enlargedTitle?: string
}

const ManualUpiQrImage = ({
  src,
  alt = "UPI QR code",
  className = "h-[120px] w-[120px] rounded-[16px] border border-[var(--shreem-border)] bg-white object-contain p-2",
  enlargedTitle = "Scan UPI QR",
}: ManualUpiQrImageProps) => {
  const [open, setOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block rounded-[16px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--shreem-accent)] focus-visible:ring-offset-2"
        aria-label="Enlarge UPI QR code for scanning"
      >
        <img
          src={src}
          alt={alt}
          className={`${className} transition duration-200 group-hover:scale-[1.02]`}
        />
        <span className="pointer-events-none absolute inset-x-2 bottom-2 hidden rounded-full bg-[rgba(8,17,25,0.78)] px-2 py-1 text-center text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100 md:block">
          Click to enlarge
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(8,17,25,0.76)] p-4 backdrop-blur-sm md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-[620px] rounded-[28px] border border-white/24 bg-[rgba(255,252,248,0.98)] p-4 shadow-[0_34px_90px_rgba(0,0,0,0.34)] md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="brand-kicker">Manual UPI</p>
                <h2
                  id={titleId}
                  className="mt-1 text-[1.45rem] font-semibold leading-tight text-[var(--shreem-ink)]"
                >
                  {enlargedTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--shreem-border)] bg-white text-[var(--shreem-ink)]"
                aria-label="Close enlarged UPI QR code"
              >
                <XMark />
              </button>
            </div>

            <img
              src={src}
              alt={alt}
              className="mx-auto aspect-square w-full max-w-[520px] rounded-[22px] border border-[var(--shreem-border)] bg-white object-contain p-4"
            />
            <p className="mt-4 text-center text-sm leading-6 text-[var(--shreem-muted)]">
              Scan this enlarged QR with any UPI app, then keep the payment
              reference for manual verification.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default ManualUpiQrImage
