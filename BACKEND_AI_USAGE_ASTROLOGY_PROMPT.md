# Backend AI Prompt: Shreem AI Usage, Astrology History, and Admin Visibility

You are working on the Shreem Farms Medusa v2 backend and admin panel.

Goal: persist all customer AI usage from the storefront at user level and expose it in Medusa Admin. The frontend already attempts to call these routes gracefully, so the site will keep working before the backend is deployed.

## Storefront Contract

Implement these authenticated Store API routes:

1. `POST /store/ai-usage`
2. `GET /store/ai-usage?tool_prefix=astrology&limit=12`

Both routes must identify the logged-in customer from the Store auth token/session. Do not accept a customer id from the browser body.

The current frontend helper is `src/lib/data/ai-usage.ts` and sends this payload:

```json
{
  "tool": "astrology_prashna",
  "input": {
    "question": "Is this a good time to start the planned work?",
    "city_id": "rewa",
    "city": "Rewa, Madhya Pradesh"
  },
  "response": {
    "chart": {},
    "answer": "...",
    "expert_call_recommended": true
  },
  "metadata": {
    "customer_email": "customer@example.com",
    "chart": {}
  },
  "model": "gemini-flash-latest",
  "expert_recommended": true
}
```

Other tool values already planned:

- `astrology_prashna`
- `astrology_kundli`
- `grow_ai`
- `support_ai`

## Database Model

Create an `ai_usage_logs` table/module entity with at least:

- `id`
- `customer_id`
- `customer_email`
- `tool`
- `input_json`
- `response_json`
- `metadata_json`
- `model`
- `expert_recommended`
- `admin_status` default `new`
- `tags` JSON/text array if easy
- `created_at`
- `updated_at`

Recommended indexes:

- `(customer_id, created_at)`
- `(tool, created_at)`
- `(expert_recommended, created_at)`

Do not store raw image base64 in this table. Store only image metadata, uploaded file ids, URLs, hashes, or count.

## Store Route Behavior

`POST /store/ai-usage`

- Require logged-in customer.
- Validate `tool` as a non-empty string.
- Validate `input` and `response` as JSON objects.
- Limit payload size defensively.
- Attach `customer_id` and `customer_email` from the authenticated customer.
- Persist the row.
- Return:

```json
{
  "usage": {
    "id": "aiuse_...",
    "tool": "astrology_prashna",
    "input": {},
    "response": {},
    "metadata": {},
    "model": "gemini-flash-latest",
    "expert_recommended": true,
    "created_at": "2026-05-17T..."
  }
}
```

`GET /store/ai-usage`

- Require logged-in customer.
- Return only the authenticated customer’s logs.
- Support `limit`, default 12, max 50.
- Support `tool_prefix`, for example `astrology` should return `astrology_prashna` and `astrology_kundli`.
- Sort newest first.
- Return:

```json
{
  "usage": []
}
```

## Admin API

Add Admin routes:

1. `GET /admin/ai-usage`
2. `GET /admin/ai-usage/:id`
3. Optional: `PATCH /admin/ai-usage/:id` for `admin_status` and notes.

Filters:

- customer id/email
- tool
- expert recommended
- created date range
- admin status

Admin list row should show:

- customer name/email
- tool
- short input preview
- short AI response preview
- model
- expert recommended badge
- created date
- admin status

Admin detail should show:

- full input JSON
- full response JSON
- chart/kundli metadata in readable sections
- expert recommendation reason
- suggested service if present
- link to customer profile/order history

## Admin Panel UI

Add an Admin sidebar entry: `AI Usage`.

Views:

- `All AI Sessions`
- `Expert Review Suggested`
- `Astrology`
- `Grow AI`
- `Support AI`

The admin should be able to open a session and see the customer-level context without searching server logs.

## Production Notes

- Use Medusa v2 module/service patterns.
- Enforce admin permissions.
- Avoid logging sensitive full payloads to stdout.
- Keep response JSON query-light; use detail view for full payload.
- If the customer is deleted, keep the log with customer email for support/audit unless compliance deletion is requested.
- Add migrations and seed nothing.

Acceptance criteria:

- Storefront `recordAiUsage()` returns `synced: true`.
- Storefront `/api/astrology/history` returns the authenticated customer’s last sessions.
- Medusa Admin shows AI logs with filters.
- Expert-recommended Prashna/Kundli sessions are easy to find.
- No unauthenticated user can read or create AI usage logs.
