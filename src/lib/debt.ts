import type { DebtItem } from "@/types/finance";

export type DebtStrategy = "avalanche" | "snowball";

export type DebtPayoffEstimate = {
  debtId: string;
  name: string;
  monthsToPayoff: number | null;
  totalInterest: number;
  payoffAmount: number;
};

export type DebtPlanSummary = {
  strategy: DebtStrategy;
  totalBalance: number;
  minimumPaymentTotal: number;
  totalInterest: number;
  monthsToDebtFree: number | null;
  payoffOrder: DebtPayoffEstimate[];
};

export function estimateSingleDebtPayoff(debt: DebtItem): DebtPayoffEstimate {
  const balance = Math.max(0, debt.balance);
  const payment = Math.max(0, debt.minimumPayment);
  const monthlyRate = Math.max(0, debt.annualInterestPercent) / 100 / 12;

  if (balance === 0) {
    return {
      debtId: debt.id,
      name: debt.name,
      monthsToPayoff: 0,
      totalInterest: 0,
      payoffAmount: 0,
    };
  }

  if (payment <= 0 || payment <= balance * monthlyRate) {
    return {
      debtId: debt.id,
      name: debt.name,
      monthsToPayoff: null,
      totalInterest: 0,
      payoffAmount: balance,
    };
  }

  let remaining = balance;
  let months = 0;
  let totalInterest = 0;

  while (remaining > 0.005 && months < 1200) {
    const interest = remaining * monthlyRate;
    const principalPayment = Math.min(remaining, payment - interest);
    totalInterest += interest;
    remaining -= principalPayment;
    months += 1;
  }

  return {
    debtId: debt.id,
    name: debt.name,
    monthsToPayoff: months >= 1200 ? null : months,
    totalInterest,
    payoffAmount: balance + totalInterest,
  };
}

export function createDebtPlanSummary(
  debts: DebtItem[],
  strategy: DebtStrategy,
): DebtPlanSummary {
  const sortedDebts = [...debts].sort((left, right) => {
    if (strategy === "avalanche") {
      return right.annualInterestPercent - left.annualInterestPercent;
    }

    return left.balance - right.balance;
  });
  const payoffOrder = sortedDebts.map(estimateSingleDebtPayoff);
  const payableMonths = payoffOrder
    .map((estimate) => estimate.monthsToPayoff)
    .filter((months): months is number => months !== null);

  return {
    strategy,
    totalBalance: debts.reduce((sum, debt) => sum + Math.max(0, debt.balance), 0),
    minimumPaymentTotal: debts.reduce(
      (sum, debt) => sum + Math.max(0, debt.minimumPayment),
      0,
    ),
    totalInterest: payoffOrder.reduce((sum, estimate) => sum + estimate.totalInterest, 0),
    monthsToDebtFree:
      payableMonths.length === payoffOrder.length
        ? Math.max(0, ...payableMonths)
        : null,
    payoffOrder,
  };
}
