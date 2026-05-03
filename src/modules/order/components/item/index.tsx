import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@medusajs/ui"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  const itemProduct = item.product as
    | { thumbnail?: string | null; images?: { url?: string | null }[] | null }
    | undefined
  const itemVariant = item.variant as
    | {
        thumbnail?: string | null
        images?: { url?: string | null }[] | null
        product?: {
          thumbnail?: string | null
          images?: { url?: string | null }[] | null
        } | null
      }
    | undefined
  const variantProduct = item.variant?.product as
    | { thumbnail?: string | null; images?: { url?: string | null }[] | null }
    | undefined
  const metadata = item.metadata as
    | {
        thumbnail?: string | null
        image?: string | null
        product_thumbnail?: string | null
      }
    | undefined
  const itemImageFields = item as {
    product_thumbnail?: string | null
    image?: string | null
  }
  const lineItemThumbnail =
    item.thumbnail ||
    itemImageFields.product_thumbnail ||
    itemImageFields.image ||
    itemVariant?.thumbnail ||
    variantProduct?.thumbnail ||
    itemProduct?.thumbnail ||
    metadata?.thumbnail ||
    metadata?.product_thumbnail ||
    metadata?.image
  const lineItemImages =
    variantProduct?.images || itemProduct?.images || itemVariant?.images

  return (
    <Table.Row
      className="mb-3 grid w-full grid-cols-[84px_minmax(0,1fr)] gap-x-3 overflow-hidden rounded-[18px] border border-[rgba(18,63,99,0.12)] bg-white/76 p-3 shadow-[0_12px_26px_rgba(15,49,70,0.06)] small:mb-0 small:table-row small:rounded-none small:border-0 small:bg-transparent small:p-0 small:shadow-none"
      data-testid="product-row"
    >
      <Table.Cell className="col-start-1 row-span-2 block !pl-0 p-0 small:table-cell small:p-4 small:w-24">
        <div className="flex w-full small:w-16">
          <Thumbnail
            thumbnail={lineItemThumbnail}
            images={lineItemImages}
            size="square"
          />
        </div>
      </Table.Cell>

      <Table.Cell className="col-start-2 block px-0 py-0 text-left small:table-cell small:px-4 small:py-4">
        <Text
          className="txt-medium-plus line-clamp-2 text-ui-fg-base"
          data-testid="product-name"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      <Table.Cell className="col-start-2 block !pr-0 px-0 pt-3 small:table-cell small:px-4 small:pt-4">
        <span className="!pr-0 flex items-end justify-between gap-4 small:flex small:h-full small:flex-col small:items-end small:justify-center">
          <span className="flex gap-x-1 ">
            <Text className="text-ui-fg-muted">
              <span data-testid="product-quantity">{item.quantity}</span>x{" "}
            </Text>
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </span>

          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
