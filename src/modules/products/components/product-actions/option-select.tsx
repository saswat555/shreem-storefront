import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm font-medium text-[var(--shreem-ink)]">
        Select {title}
      </span>
      <div
        className="flex flex-wrap gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "min-w-[calc(50%-0.25rem)] flex-1 rounded-full border px-4 py-3 text-sm",
                {
                  "border-[rgba(18,63,99,0.18)] bg-[rgba(255,252,247,0.96)] text-[var(--shreem-ink)] shadow-[0_14px_32px_rgba(12,47,73,0.08)]":
                    v === current,
                  "border-[rgba(18,63,99,0.12)] bg-[rgba(240,248,246,0.66)] text-[var(--shreem-muted)] hover:border-[rgba(18,63,99,0.18)] hover:text-[var(--shreem-ink)]":
                    v !== current,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
