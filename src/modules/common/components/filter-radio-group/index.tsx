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
      <p className="brand-kicker">{title}</p>
      <div
        data-testid={dataTestId}
        className="flex flex-wrap gap-2"
      >
        {items?.map((i) => (
          <label
            key={i.value}
            className={[
              "flex items-center gap-x-2 rounded-full border px-4 py-2.5",
              i.value === value
                ? "border-[rgba(18,63,99,0.22)] bg-[rgba(255,252,247,0.96)] text-[var(--shreem-ink)] shadow-[0_12px_28px_rgba(12,47,73,0.08)]"
                : "border-transparent bg-[rgba(240,248,246,0.68)] text-[var(--shreem-muted)]",
            ].join(" ")}
            data-testid="radio-label"
            data-active={i.value === value}
          >
            {i.value === value && (
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            )}
            <input
              type="radio"
              checked={i.value === value}
              className="sr-only"
              id={i.value}
              name={title}
              value={i.value}
              onChange={() => handleChange(i.value)}
            />
            <span className="txt-compact-small hover:cursor-pointer">
              {i.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default FilterRadioGroup
