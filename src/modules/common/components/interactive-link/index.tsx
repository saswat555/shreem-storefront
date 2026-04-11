import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "../localized-client-link"

type InteractiveLinkProps = {
  href: string
  children?: React.ReactNode
  onClick?: () => void
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  ...props
}: InteractiveLinkProps) => {
  return (
    <LocalizedClientLink
      className="inline-flex items-center gap-2 group"
      href={href}
      onClick={onClick}
      {...props}
    >
      <Text className="text-[var(--shreem-accent-dark)] font-medium">
        {children}
      </Text>
      <ArrowUpRightMini
        className="translate-y-[1px] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:rotate-12"
        color="var(--shreem-accent-dark)"
      />
    </LocalizedClientLink>
  )
}

export default InteractiveLink
