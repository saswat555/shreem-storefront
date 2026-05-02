import { Text, clx } from "@medusajs/ui"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import React from "react"

type AccordionItemProps = AccordionPrimitive.AccordionItemProps & {
  title: string
  subtitle?: string
  description?: string
  required?: boolean
  tooltip?: string
  forceMountContent?: true
  headingSize?: "small" | "medium" | "large"
  customTrigger?: React.ReactNode
  complete?: boolean
  active?: boolean
  triggerable?: boolean
  children: React.ReactNode
}

type AccordionProps =
  | (AccordionPrimitive.AccordionSingleProps &
      React.RefAttributes<HTMLDivElement>)
  | (AccordionPrimitive.AccordionMultipleProps &
      React.RefAttributes<HTMLDivElement>)

const Accordion: React.FC<AccordionProps> & {
  Item: React.FC<AccordionItemProps>
} = ({ children, ...props }) => {
  return <AccordionPrimitive.Root {...props}>{children}</AccordionPrimitive.Root>
}

const Item: React.FC<AccordionItemProps> = ({
  title,
  subtitle,
  description,
  children,
  className,
  headingSize: _headingSize,
  customTrigger = undefined,
  forceMountContent = undefined,
  ...props
}) => {
  return (
    <AccordionPrimitive.Item
      {...props}
      className={clx("brand-card overflow-hidden px-5 py-4", className)}
    >
      <AccordionPrimitive.Header>
        <div className="flex flex-col">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Text className="text-sm font-medium text-[var(--shreem-ink)]">
                {title}
              </Text>
            </div>
            <AccordionPrimitive.Trigger>
              {customTrigger || <MorphingTrigger />}
            </AccordionPrimitive.Trigger>
          </div>
          {subtitle && (
            <Text as="span" size="small" className="mt-1 text-[var(--shreem-muted)]">
              {subtitle}
            </Text>
          )}
        </div>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content
        forceMount={forceMountContent}
        className={clx(
          "radix-state-closed:animate-accordion-close radix-state-open:animate-accordion-open radix-state-closed:pointer-events-none"
        )}
      >
        <div className="group-radix-state-closed:animate-accordion-close">
          {description && <Text>{description}</Text>}
          <div className="w-full">{children}</div>
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}

Accordion.Item = Item

const MorphingTrigger = () => {
  return (
    <div className="relative rounded-full border border-[rgba(18,63,99,0.14)] bg-[rgba(240,248,246,0.72)] p-[12px]">
      <div className="h-4 w-4">
        <span className="absolute inset-y-[46%] left-[50%] h-[1.5px] w-3 -translate-x-1/2 rounded-full bg-[var(--shreem-accent-dark)] duration-300" />
        <span className="absolute left-[50%] top-[50%] h-3 w-[1.5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--shreem-accent-dark)] duration-300 group-radix-state-open:scale-y-0" />
      </div>
    </div>
  )
}

export default Accordion
