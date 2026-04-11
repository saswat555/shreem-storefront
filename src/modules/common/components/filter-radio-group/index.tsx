import { EllipseMiniSolid } from "@medusajs/icons"
import { Label, RadioGroup, Text, clx } from "@medusajs/ui"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: any
  handleChange: (...args: any[]) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <div className="flex flex-col gap-y-3">
      <Text className="brand-kicker">{title}</Text>
      <RadioGroup
        data-testid={dataTestId}
        onValueChange={handleChange}
        value={value}
        className="flex flex-wrap gap-2"
      >
        {items?.map((i) => (
          <div
            key={i.value}
            className={clx(
              "flex items-center gap-x-2 rounded-full border px-4 py-2.5",
              {
                "border-[rgba(18,63,99,0.22)] bg-[rgba(255,252,247,0.96)] shadow-[0_12px_28px_rgba(12,47,73,0.08)]":
                  i.value === value,
                "border-transparent bg-[rgba(240,248,246,0.68)]":
                  i.value !== value,
              }
            )}
          >
            {i.value === value && <EllipseMiniSolid />}
            <RadioGroup.Item
              checked={i.value === value}
              className="hidden peer"
              id={i.value}
              value={i.value}
            />
            <Label
              htmlFor={i.value}
              className={clx(
                "!txt-compact-small !transform-none hover:cursor-pointer",
                {
                  "text-[var(--shreem-ink)]": i.value === value,
                  "text-[var(--shreem-muted)]": i.value !== value,
                }
              )}
              data-testid="radio-label"
              data-active={i.value === value}
            >
              {i.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

export default FilterRadioGroup
