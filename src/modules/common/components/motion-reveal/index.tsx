"use client"

import { clx } from "@medusajs/ui"
import { useIntersection } from "@lib/hooks/use-in-view"
import { ReactNode, useRef } from "react"

type MotionRevealProps = {
  children: ReactNode
  className?: string
  delayMs?: number
}

export default function MotionReveal({
  children,
  className,
  delayMs = 0,
}: MotionRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersection(ref, "-80px")

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={clx("shreem-reveal", isVisible && "is-visible", className)}
    >
      {children}
    </div>
  )
}
