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
  return (
    <div className="py-8 small:py-12">
      <div className="content-container" data-testid="cart-container">
        <div className="brand-surface mb-6 px-5 py-6 small:px-8 small:py-8">
          <p className="brand-kicker">Your bag</p>
          <h1 className="mt-3 text-[2.4rem] leading-none text-[var(--shreem-ink)] small:text-[3.4rem]">
            Everything you’ve selected, laid out clearly.
          </h1>
        </div>
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 gap-6 small:grid-cols-[1fr_360px]">
            <div className="brand-card flex flex-col gap-y-6 px-5 py-6 small:px-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="sticky top-28 flex flex-col gap-y-8">
                {cart && cart.region && (
                  <>
                    <div className="brand-card px-5 py-6">
                      <Summary cart={cart as any} />
                    </div>
                  </>
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
