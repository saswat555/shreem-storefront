import Image from "next/image"
import { clx } from "@medusajs/ui"

type MascotSpritesProps = {
  className?: string
}

export default function MascotSprites({ className }: MascotSpritesProps) {
  return (
    <div
      className={clx(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      <div className="animate-shreem-float absolute -left-8 bottom-4 opacity-55 small:-left-6 small:opacity-70">
        <div className="relative h-20 w-20 rounded-full bg-white/28 p-2 shadow-[0_24px_60px_rgba(15,49,70,0.12)] backdrop-blur-md small:h-28 small:w-28">
          <Image
            src="/gauri.jpg"
            alt=""
            fill
            sizes="112px"
            className="object-contain p-2"
          />
        </div>
      </div>
      <div className="animate-shreem-float-delayed absolute -right-3 top-6 opacity-75">
        <div className="relative h-20 w-20 rounded-full bg-white/24 p-2 shadow-[0_22px_48px_rgba(15,49,70,0.14)] backdrop-blur-md small:h-28 small:w-28">
          <Image
            src="/mayur.jpg"
            alt=""
            fill
            sizes="112px"
            className="object-contain p-2"
          />
        </div>
      </div>
      <div className="animate-shreem-glow absolute right-1/4 top-1/3 h-12 w-12 rounded-full bg-[rgba(245,199,96,0.16)] blur-2xl" />
    </div>
  )
}
