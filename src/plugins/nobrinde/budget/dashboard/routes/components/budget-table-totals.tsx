import { ResultOf, TableCell, TableRow } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { MoneyGrossNet } from './money-gross-net';
import {} from '@/gql';
import { budgetDetailDocument } from '../budgets.graphql';

type BudgetFragment = NonNullable<ResultOf<typeof budgetDetailDocument>['budget']>;
export interface BudgetTableTotalsProps {
  budget: BudgetFragment;
  columnCount: number;
}

export function BudgetTableTotals({ budget, columnCount }: Readonly<BudgetTableTotalsProps>) {
  const currencyCode = budget.currencyCode;
  return (
    <>
      {/* {budget.surcharges?.length > 0
        ? budget.surcharges.map((surcharge, index) => (
            <TableRow key={`${surcharge.description}-${index}`}>
              <TableCell colSpan={columnCount - 1} className="h-12">
                <Trans>Surcharge</Trans>: {surcharge.description}
              </TableCell>
              <TableCell colSpan={1} className="h-12">
                <MoneyGrossNet
                  priceWithTax={surcharge.priceWithTax}
                  price={surcharge.price}
                  currencyCode={currencyCode}
                />
              </TableCell>
            </TableRow>
          ))
        : null} */}
      {budget.discounts?.length > 0
        ? budget.discounts.map((discount, index) => (
            <TableRow key={`${discount.description}-${index}`}>
              <TableCell colSpan={columnCount - 1} className="h-12">
                <Trans>Discount</Trans>: {discount.description}
              </TableCell>
              <TableCell colSpan={1} className="h-12">
                <MoneyGrossNet
                  priceWithTax={discount.amountWithTax}
                  price={discount.amount}
                  currencyCode={currencyCode}
                />
              </TableCell>
            </TableRow>
          ))
        : null}
      <TableRow>
        <TableCell colSpan={columnCount - 1} className="h-12">
          <Trans>Sub total</Trans>
        </TableCell>
        <TableCell colSpan={1} className="h-12">
          <MoneyGrossNet
            priceWithTax={budget.subTotalWithTax}
            price={budget.subTotal}
            currencyCode={currencyCode}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={columnCount - 1} className="h-12">
          <Trans>Shipping</Trans>
        </TableCell>
        <TableCell colSpan={1} className="h-12">
          <MoneyGrossNet
            priceWithTax={budget.shippingWithTax}
            price={budget.shipping}
            currencyCode={currencyCode}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={columnCount - 1} className="h-12 font-bold">
          <Trans>Total</Trans>
        </TableCell>
        <TableCell colSpan={1} className="h-12 font-bold">
          <MoneyGrossNet
            priceWithTax={budget.totalWithTax}
            price={budget.total}
            currencyCode={currencyCode}
          />
        </TableCell>
      </TableRow>
    </>
  );
}
