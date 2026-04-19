# Backend Expectations

This storefront is ready to consume three backend-managed systems:

1. Product reviews and customer feedback
2. Blog posts for the Journal
3. Standard Medusa cart, checkout, shipping, and payment flows

The sections below describe the exact backend behavior the frontend expects.

## 1. Reviews And Feedback

The storefront uses two concepts:

- `feedback`: authenticated customer input submitted after delivery
- `review`: approved feedback shown publicly on product pages

In practice, the backend can store both in one `product_review` model with a
moderation status.

### Required data model

Create a review entity with at least:

- `id`
- `product_id`
- `customer_id`
- `customer_name`
- `order_id`
- `line_item_id`
- `rating` integer from `1` to `5`
- `title`
- `content`
- `status` enum: `pending`, `approved`, `rejected`
- `created_at`
- `updated_at`

### Required business rules

The backend must enforce all of these:

1. Only authenticated customers can submit feedback.
2. The order must belong to the authenticated customer.
3. The `line_item_id` must belong to the given `order_id`.
4. The `product_id` must match the product on that line item.
5. Feedback is allowed only when the order fulfillment status is:
   - `delivered`, or
   - `partially_delivered`
6. One customer should not be able to submit duplicate feedback for the same
   `customer_id + order_id + line_item_id`.
7. Product pages must expose only `approved` reviews publicly.

### Required store endpoints

#### `GET /store/products/:product_id/reviews`

Used on the product page.

Expected query params:

- `status=approved`
- `limit=50`
- `order=-created_at`

Expected response:

```json
{
  "reviews": [
    {
      "id": "preview_123",
      "product_id": "prod_123",
      "customer_name": "Verified customer",
      "rating": 5,
      "title": "Excellent aroma",
      "content": "Arrived well packed and tasted fresh.",
      "status": "approved",
      "created_at": "2026-04-19T00:00:00.000Z"
    }
  ]
}
```

#### `POST /store/product-reviews`

Used from the account order-details page.

Auth required: customer JWT.

Expected request body:

```json
{
  "product_id": "prod_123",
  "order_id": "order_123",
  "line_item_id": "ordli_123",
  "rating": 5,
  "title": "Excellent aroma",
  "content": "Arrived well packed and tasted fresh."
}
```

Expected response:

```json
{
  "review": {
    "id": "preview_123",
    "status": "pending"
  }
}
```

### Frontend expectations

The frontend currently expects:

- feedback forms to appear in account order details after delivery
- approved reviews to show on product pages
- a visible star rating summary on product pages
- graceful failure if reviews are not enabled yet

## 2. Blog / Journal

Right now the Journal is storefront-driven. If you want it managed by Medusa,
the backend should expose a blog module and these endpoints.

### Required blog model

- `id`
- `slug` unique
- `title`
- `excerpt`
- `description`
- `category`
- `published_at`
- `read_time`
- `hero_image_url`
- `hero_image_alt`
- `status` enum: `draft`, `published`
- `sections`
- `seo_title`
- `seo_description`

### Required section shape

Each section should look like:

```json
{
  "heading": "Why bilona matters",
  "body": ["Paragraph one", "Paragraph two"]
}
```

### Required store endpoints

#### `GET /store/blog-posts`

Expected query params:

- `status=published`
- `limit`
- `offset`
- `order=-published_at`

Expected response:

```json
{
  "posts": [
    {
      "id": "blog_123",
      "slug": "bilona-a2-ghee-made-slowly",
      "title": "Bilona A2 ghee made slowly",
      "excerpt": "Short list-page summary",
      "description": "SEO and hero description",
      "category": "Kitchen",
      "published_at": "2026-04-19T00:00:00.000Z",
      "read_time": "5 min read",
      "hero_image_url": "https://example.com/image.jpg",
      "hero_image_alt": "Hero image alt",
      "status": "published"
    }
  ],
  "count": 1
}
```

#### `GET /store/blog-posts/:slug`

Expected response:

```json
{
  "post": {
    "id": "blog_123",
    "slug": "bilona-a2-ghee-made-slowly",
    "title": "Bilona A2 ghee made slowly",
    "excerpt": "Short list-page summary",
    "description": "SEO and hero description",
    "category": "Kitchen",
    "published_at": "2026-04-19T00:00:00.000Z",
    "read_time": "5 min read",
    "hero_image_url": "https://example.com/image.jpg",
    "hero_image_alt": "Hero image alt",
    "sections": [
      {
        "heading": "Why bilona matters",
        "body": ["Paragraph one", "Paragraph two"]
      }
    ],
    "status": "published",
    "seo_title": "Optional SEO title",
    "seo_description": "Optional SEO description"
  }
}
```

## 3. Checkout And Payment Expectations

The frontend expects the standard Medusa store APIs to work for:

- cart retrieval and line-item updates
- shipping option listing
- shipping method assignment
- payment provider listing
- payment session initiation
- order placement

### Payment provider expectations

The frontend now displays friendly labels/icons for:

- Stripe card
- PayPal
- PhonePe
- default/manual providers

For any custom provider, the backend should return a stable `provider_id`.

Known provider IDs already handled:

- `pp_stripe_stripe`
- `pp_medusa-payments_default`
- `pp_paypal_paypal`
- `pp_phonepe_phonepe`
- `pp_system_default`

### Payment session expectations

The frontend expects `cart.payment_collection.payment_sessions` to include a
session whose `status` is either:

- `pending`, or
- `authorized`

For non-card providers like PhonePe, the frontend treats the selected payment
session as ready for order confirmation once the backend has created that
session successfully.

If your PhonePe flow requires a redirect instead of immediate order placement,
the backend contract should be extended to expose:

- a redirect URL on the session payload, or
- a confirmation step route that the frontend can detect explicitly

## Minimum VM-readiness checklist

Before pushing the VM, the backend should satisfy all of these:

1. `GET /store/payment-providers` returns the intended providers for the region.
2. `initiatePaymentSession` creates a valid pending session for the chosen provider.
3. `placeOrder` succeeds for the selected provider flow.
4. `GET /store/products/:product_id/reviews` exists.
5. `POST /store/product-reviews` exists and enforces delivery/auth rules.
6. If the Journal is backend-managed, `GET /store/blog-posts` and
   `GET /store/blog-posts/:slug` exist and return published content.
