"use client"

import { Star, StarSolid } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { ReviewFormState, submitProductReview } from "@lib/data/reviews"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

type FeedbackItem = {
  id: string
  productId: string
  productHandle?: string | null
  title: string
  thumbnail?: string | null
}

type ProductFeedbackProps = {
  orderId: string
  isDelivered: boolean
  items: FeedbackItem[]
}

const initialState: ReviewFormState = {
  success: false,
  error: null,
}

const RatingInput = ({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) => {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((rating) => {
        const isActive = rating <= value

        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
            onClick={() => onChange(rating)}
            className={clx(
              "flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200",
              isActive
                ? "border-[rgba(212,161,38,0.7)] bg-[rgba(255,248,233,0.96)] text-[var(--shreem-gold-deep)]"
                : "border-[var(--shreem-border)] bg-white/78 text-[var(--shreem-muted)] hover:text-[var(--shreem-gold-deep)]"
            )}
          >
            {isActive ? <StarSolid /> : <Star />}
          </button>
        )
      })}
    </div>
  )
}

const SubmitButton = () => {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="brand-primary-button disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Submitting feedback" : "Submit feedback"}
    </button>
  )
}

const FeedbackForm = ({
  orderId,
  item,
}: {
  orderId: string
  item: FeedbackItem
}) => {
  const [rating, setRating] = useState(5)
  const [state, formAction] = useActionState(submitProductReview, initialState)

  return (
    <form action={formAction} className="brand-card px-5 py-5">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="line_item_id" value={item.id} />
      <input type="hidden" name="product_id" value={item.productId} />
      <input type="hidden" name="product_handle" value={item.productHandle ?? ""} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="brand-kicker">Feedback</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--shreem-ink)]">
            {item.title}
          </h3>
        </div>
        <RatingInput value={rating} onChange={setRating} />
      </div>

      <label className="mt-5 block text-sm font-medium text-[var(--shreem-ink)]">
        Review title
        <input
          name="title"
          maxLength={90}
          placeholder="Example: Rich aroma and careful packing"
          className="mt-2 h-12 w-full rounded-[18px] border border-[rgba(113,86,57,0.12)] bg-[rgba(255,252,248,0.88)] px-4 text-sm text-[var(--shreem-ink)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(139,108,78,0.12)]"
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-[var(--shreem-ink)]">
        Your feedback
        <textarea
          name="content"
          required
          minLength={8}
          maxLength={900}
          placeholder="Tell future customers what arrived, how it felt to use, and whether you would buy it again."
          className="mt-2 min-h-[120px] w-full rounded-[20px] border border-[rgba(113,86,57,0.12)] bg-[rgba(255,252,248,0.88)] px-4 py-4 text-sm leading-6 text-[var(--shreem-ink)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(139,108,78,0.12)]"
        />
      </label>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton />
        {state.success && (
          <p className="text-sm leading-6 text-[var(--shreem-accent-dark)]">
            Thanks. Your review was submitted for approval.
          </p>
        )}
        {state.error && (
          <p className="text-sm leading-6 text-rose-700">{state.error}</p>
        )}
      </div>
    </form>
  )
}

export default function ProductFeedback({
  orderId,
  isDelivered,
  items,
}: ProductFeedbackProps) {
  const reviewableItems = items.filter((item) => item.productId)

  if (!reviewableItems.length) {
    return null
  }

  if (!isDelivered) {
    return (
      <section className="brand-card px-5 py-5">
        <p className="brand-kicker">Product feedback</p>
        <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
          Review unlocks after delivery
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
          Once this order is marked delivered, you can leave product feedback
          from this page. Approved reviews are shown on the product page with
          star ratings.
        </p>
      </section>
    )
  }

  return (
    <section className="grid gap-4">
      <div className="brand-surface px-5 py-5">
        <p className="brand-kicker">Product feedback</p>
        <h2 className="mt-3 text-[2rem] leading-[1.04] text-[var(--shreem-ink)]">
          Tell future customers how it arrived
        </h2>
        <p className="mt-3 max-w-[44rem] text-sm leading-6 text-[var(--shreem-muted)]">
          Feedback is available only after delivery and should be approved by
          the backend before appearing publicly on product pages.
        </p>
      </div>
      {reviewableItems.map((item) => (
        <FeedbackForm key={item.id} orderId={orderId} item={item} />
      ))}
    </section>
  )
}
