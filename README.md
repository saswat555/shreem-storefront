# Shreem Storefront (Flutter + Medusa v2)

Launch-ready Flutter storefront for Shreem dairy products with Medusa v2 backend (AWS deployment compatible).

## Branding
1. Save the attached logo as: `assets/branding/shreem_logo.png`
2. (Optional) override logo path using `APP_LOGO_ASSET`.

## Key capabilities
- Medusa v2 Store API integration:
  - regions, products, carts, line items
  - shipping options + shipping method assignment
  - payment sessions and payment provider selection
  - cart completion and order status polling
- Geo-lock behavior:
  - Milk / paneer / curd => Rewa, Madhya Pradesh only
  - A2 ghee => Pan India
- Auth:
  - email/password customer login
  - customer registration + login
  - Google sign-in (token exchange with Medusa auth endpoint)
  - authenticated customer profile fetch (`/store/customers/me`)
- Premium UX:
  - branded top bars + elegant hero
  - smooth tab transitions
  - checkout sheet and order tracking timeline

## AWS + Medusa launch checklist
- Medusa backend public endpoint (HTTPS) configured in `MEDUSA_BASE_URL`.
- CORS on Medusa allows your Flutter web/app origin.
- Publishable API key set in `MEDUSA_PUBLISHABLE_KEY`.
- Products are published to target sales channel (if used).
- Shipping options exist for target regions.
- Payment providers installed/configured:
  - `UPI_PENDING_PROVIDER_ID`
  - `PHONEPE_PROVIDER_ID`
- Workflow/admin action transitions approved UPI orders to `awaiting_packing`.
- `ORDER_STATUS_PATH` returns order status for tracking.

### Backend expectations for geo-lock correctness
Because geolock is enforced app-side by product text/tag classification:
- Rewa-only items should include one of: `milk`, `paneer`, `curd`, `dahi` in title/handle/subtitle/description/tags.
- Pan-India items should include one of: `ghee`, `a2-ghee`, `bilona` in title/handle/subtitle/description/tags.
- If a product has both groups, pan-India wins (so ghee is not accidentally blocked).

### Backend expectations for auth + Google auth
- **Email/password login endpoint** (`CUSTOMER_LOGIN_PATH`, default `/auth/customer/emailpass`) should return `token` or `access_token`.
- **Register endpoint** (`CUSTOMER_REGISTER_PATH`, default `/store/customers`) should create a customer compatible with email/password auth.
- **Me endpoint** (`CUSTOMER_ME_PATH`, default `/store/customers/me`) should accept bearer token and return customer profile.
- **Google auth endpoint** (`CUSTOMER_GOOGLE_AUTH_PATH`, default `/auth/customer/google`) should accept `{ "id_token": "..." }`, verify with Google, and return Medusa customer token (`token` or `access_token`).

## Environment
```env
MEDUSA_BASE_URL=https://your-medusa-domain.amazonaws.com
MEDUSA_PUBLISHABLE_KEY=pk_xxx
MEDUSA_SALES_CHANNEL_ID=
STOREFRONT_CURRENCY_CODE=inr
GEOLOCK_CITY=Rewa
GEOLOCK_STATE=Madhya Pradesh
PAYMENT_UPI_ID=payments@shreemdairy
UPI_PENDING_PROVIDER_ID=pp_upi_pending
PHONEPE_PROVIDER_ID=pp_phonepe
ORDER_STATUS_PATH=/store/orders
APP_LOGO_ASSET=assets/branding/shreem_logo.png
CUSTOMER_LOGIN_PATH=/auth/customer/emailpass
CUSTOMER_REGISTER_PATH=/store/customers
CUSTOMER_ME_PATH=/store/customers/me
CUSTOMER_GOOGLE_AUTH_PATH=/auth/customer/google
```

## Run
```bash
cp .env.example .env
flutter pub get
flutter run
```
