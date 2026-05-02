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
  const variantProduct = item.variant?.product as
    | { thumbnail?: string | null; images?: { url?: string | null }[] | null }
    | undefined
  const lineItemThumbnail =
    item.thumbnail || variantProduct?.thumbnail || itemProduct?.thumbnail
  const lineItemImages =
    variantProduct?.images || itemProduct?.images || item.variant?.images

  return (
    <Table.Row
      className="mb-4 grid w-full grid-cols-[76px_minmax(0,1fr)] gap-x-3 rounded-[18px] border border-[rgba(18,63,99,0.12)] bg-white/72 p-3 small:mb-0 small:table-row small:rounded-none small:border-0 small:bg-transparent small:p-0"
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

      <Table.Cell className="col-span-2 block !pr-0 px-0 pt-3 small:table-cell small:px-4 small:pt-4">
        <span className="!pr-0 flex items-start justify-between gap-4 small:flex small:flex-col small:items-end small:h-full small:justify-center">
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
