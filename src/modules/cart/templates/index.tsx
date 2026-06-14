import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const itemCount =
    cart?.items?.reduce((count, item) => count + item.quantity, 0) ?? 0

  return (
    <div className="py-4 pb-10 small:py-12">
      <div className="content-container" data-testid="cart-container">
        <div className="mb-4 rounded-[18px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.88)] px-4 py-5 shadow-[0_16px_36px_rgba(15,49,70,0.07)] small:mb-6 small:px-8 small:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="brand-kicker">Your bag</p>
              <h1 className="mt-2 text-[2rem] leading-none text-[var(--shreem-ink)] small:text-[3.4rem]">
                Cart
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--shreem-muted)]">
                {itemCount
                  ? `${itemCount} item${itemCount === 1 ? "" : "s"} ready for checkout.`
                  : "Your bag is waiting for Shreem products."}
              </p>
            </div>
            {itemCount > 0 && (
              <span className="brand-pill min-h-9 shrink-0 px-3 py-1.5 text-[11px]">
                {itemCount}
              </span>
            )}
          </div>
        </div>
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
            <div className="min-w-0 rounded-[18px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.86)] px-3 py-4 shadow-[0_14px_30px_rgba(15,49,70,0.06)] small:px-6 small:py-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 xl:sticky xl:top-28">
                {cart && cart.region && (
                  <div className="rounded-[18px] border border-[rgba(18,63,99,0.12)] bg-[rgba(255,252,248,0.9)] px-4 py-5 shadow-[0_14px_30px_rgba(15,49,70,0.06)] small:px-5 small:py-6">
                    <Summary cart={cart as any} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
