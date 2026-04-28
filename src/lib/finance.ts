import type {
  AllocationCategory,
  AllocationTotals,
  InvestmentProjectionPoint,
} from "@/types/finance";

export function amountToPercent(amount: number, netIncome: number) {
  if (netIncome <= 0) return 0;
  return (amount / netIncome) * 100;
}

export function percentToAmount(percent: number, netIncome: number) {
  if (netIncome <= 0) return 0;
  return (netIncome * percent) / 100;
}

export function normalizeAllocation(
  category: AllocationCategory,
  netIncome: number,
): AllocationCategory {
  if (category.mode === "percent") {
    const amount = percentToAmount(category.percent, netIncome);
    return {
      ...category,
      amount,
      percent: amountToPercent(amount, netIncome),
    };
  }

  return {
    ...category,
    percent: amountToPercent(category.amount, netIncome),
  };
}

export function normalizeAllocations(
  allocations: AllocationCategory[],
  netIncome: number,
) {
  return allocations.map((category) => normalizeAllocation(category, netIncome));
}

export function calculateAllocationTotals(
  allocations: AllocationCategory[],
): AllocationTotals {
  return allocations.reduce<AllocationTotals>(
    (totals, category) => {
      totals.amount += category.amount;
      totals.percent += category.percent;

      if (category.kind === "saving") {
        totals.savingsAmount += category.amount;
      }

      if (category.kind === "investing") {
        totals.investmentAmount += category.amount;
      }

      if (category.kind === "fixed" || category.kind === "family") {
        totals.fixedAmount += category.amount;
      }

      return totals;
    },
    {
      amount: 0,
      percent: 0,
      savingsAmount: 0,
      investmentAmount: 0,
      fixedAmount: 0,
    },
  );
}

export function calculateRemainingIncome(netIncome: number, totalAllocation: number) {
  return netIncome - totalAllocation;
}

export function calculateSavingsRate(savingsAmount: number, netIncome: number) {
  return amountToPercent(savingsAmount, netIncome);
}

export function calculateInvestmentRate(investmentAmount: number, netIncome: number) {
  return amountToPercent(investmentAmount, netIncome);
}

export function calculateLumpSumFutureValue(
  principal: number,
  annualReturnPercent: number,
  years: number,
) {
  const annualReturn = annualReturnPercent / 100;
  return principal * (1 + annualReturn) ** years;
}

export function calculateDcaFutureValue(
  principal: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  years: number,
) {
  const months = Math.round(years * 12);
  const monthlyReturn = annualReturnPercent / 100 / 12;

  if (monthlyReturn === 0) {
    return principal + monthlyContribution * months;
  }

  return (
    principal * (1 + monthlyReturn) ** months +
    monthlyContribution * (((1 + monthlyReturn) ** months - 1) / monthlyReturn)
  );
}

export function calculateTotalContribution(
  principal: number,
  monthlyContribution: number,
  years: number,
) {
  return principal + monthlyContribution * Math.round(years * 12);
}

export function calculateYearlyInvestmentProjection(
  principal: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  years: number,
): InvestmentProjectionPoint[] {
  return Array.from({ length: years }, (_, index) => {
    const year = index + 1;
    const totalContribution = calculateTotalContribution(
      principal,
      monthlyContribution,
      year,
    );
    const futureValue = calculateDcaFutureValue(
      principal,
      monthlyContribution,
      annualReturnPercent,
      year,
    );

    return {
      year,
      totalContribution,
      futureValue,
      estimatedGain: futureValue - totalContribution,
    };
  });
}

export function validateAllocationPlan(
  netIncome: number,
  allocations: AllocationCategory[],
) {
  const normalizedAllocations = normalizeAllocations(allocations, netIncome);
  const totals = calculateAllocationTotals(normalizedAllocations);
  const remaining = calculateRemainingIncome(netIncome, totals.amount);

  return {
    normalizedAllocations,
    totals,
    remaining,
    isOverIncome: totals.amount > netIncome,
    isOverPercent: totals.percent > 100,
    isBalanced: Math.abs(remaining) < 0.01,
  };
}
