import { Star, StarSolid } from "@medusajs/icons"
import { ProductReview, listProductReviews } from "@lib/data/reviews"

type ProductReviewsProps = {
  productId: string
}

const clampRating = (rating: number) => Math.min(Math.max(rating, 0), 5)

const RatingStars = ({
  rating,
  label,
}: {
  rating: number
  label?: string
}) => {
  const roundedRating = Math.round(clampRating(rating))

  return (
    <div
      className="flex items-center gap-1 text-[var(--shreem-gold-deep)]"
      aria-label={label ?? `${roundedRating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) =>
        index < roundedRating ? (
          <StarSolid key={index} className="h-4 w-4" />
        ) : (
          <Star key={index} className="h-4 w-4" />
        )
      )}
    </div>
  )
}

const getAverageRating = (reviews: ProductReview[]) => {
  if (!reviews.length) {
    return 0
  }

  return (
    reviews.reduce((total, review) => total + clampRating(review.rating), 0) /
    reviews.length
  )
}

export default async function ProductReviews({
  productId,
}: ProductReviewsProps) {
  const reviews = await listProductReviews(productId)
  const averageRating = getAverageRating(reviews)

  return (
    <section className="content-container my-16 small:my-24">
      <div className="brand-surface px-5 py-6 small:px-8 small:py-8">
        <div className="flex flex-col gap-5 small:flex-row small:items-end small:justify-between">
          <div>
            <p className="brand-kicker">Customer reviews</p>
            <h2 className="mt-3 text-[2.2rem] leading-none text-[var(--shreem-ink)] small:text-[3rem]">
              Feedback
            </h2>
          </div>

          <div className="brand-card w-full px-4 py-4 small:w-auto small:min-w-[220px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                  {reviews.length
                    ? `${averageRating.toFixed(1)} average`
                    : "No reviews yet"}
                </p>
                <p className="mt-1 text-xs text-[var(--shreem-muted)]">
                  {reviews.length} approved review
                  {reviews.length === 1 ? "" : "s"}
                </p>
              </div>
              <RatingStars
                rating={averageRating}
                label={`${averageRating.toFixed(1)} average rating out of 5`}
              />
            </div>
          </div>
        </div>

        {reviews.length ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.id} className="brand-card px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--shreem-ink)]">
                      {review.customer_name || "Verified customer"}
                    </p>
                    {review.created_at && (
                      <p className="mt-1 text-xs text-[var(--shreem-muted)]">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <RatingStars rating={review.rating} />
                </div>
                {review.title && (
                  <h3 className="mt-4 text-lg font-semibold text-[var(--shreem-ink)]">
                    {review.title}
                  </h3>
                )}
                {review.content && (
                  <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                    {review.content}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-[var(--shreem-border)] bg-white/72 px-5 py-5 text-sm leading-6 text-[var(--shreem-muted)]">
            Reviews will appear here after customer feedback is approved on the
            backend.
          </div>
        )}
      </div>
    </section>
  )
}

export { RatingStars }
