import type {
  AllocationCategory,
  AllocationTotals,
  CashflowHealth,
  EmergencyFundPlan,
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

      if (isEssentialAllocation(category)) {
        totals.essentialAmount += category.amount;
      }

      return totals;
    },
    {
      amount: 0,
      percent: 0,
      savingsAmount: 0,
      investmentAmount: 0,
      fixedAmount: 0,
      essentialAmount: 0,
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

export function calculateFixedCostRatio(essentialAmount: number, netIncome: number) {
  return amountToPercent(essentialAmount, netIncome);
}

export function calculateEmergencyFundPlan({
  currentAmount,
  monthlyEssentialExpense,
  monthlySaving,
  targetMonths,
}: {
  currentAmount: number;
  monthlyEssentialExpense: number;
  monthlySaving: number;
  targetMonths: number;
}): EmergencyFundPlan {
  const safeCurrentAmount = Math.max(0, currentAmount);
  const safeMonthlyEssentialExpense = Math.max(0, monthlyEssentialExpense);
  const safeMonthlySaving = Math.max(0, monthlySaving);
  const safeTargetMonths = Math.max(1, targetMonths);
  const targetAmount = safeMonthlyEssentialExpense * safeTargetMonths;
  const remainingAmount = Math.max(0, targetAmount - safeCurrentAmount);
  const monthsToTarget =
    remainingAmount === 0
      ? 0
      : safeMonthlySaving > 0
        ? Math.ceil(remainingAmount / safeMonthlySaving)
        : null;

  return {
    monthlyEssentialExpense: safeMonthlyEssentialExpense,
    currentAmount: safeCurrentAmount,
    targetMonths: safeTargetMonths,
    targetAmount,
    remainingAmount,
    monthlySaving: safeMonthlySaving,
    monthsToTarget,
    progressPercent: targetAmount > 0 ? Math.min(100, (safeCurrentAmount / targetAmount) * 100) : 0,
  };
}

export function assessCashflowHealth({
  netIncome,
  totals,
  remaining,
}: {
  netIncome: number;
  totals: AllocationTotals;
  remaining: number;
}): CashflowHealth {
  const savingsRate = calculateSavingsRate(totals.savingsAmount, netIncome);
  const investmentRate = calculateInvestmentRate(totals.investmentAmount, netIncome);
  const fixedCostRatio = calculateFixedCostRatio(totals.essentialAmount, netIncome);
  const warnings: string[] = [];

  if (remaining < 0) {
    warnings.push("ยอดจัดสรรรวมเกินรายได้สุทธิ ควรลดบางหมวดก่อนเพิ่มแผนอื่น");
  }

  if (fixedCostRatio >= 70) {
    warnings.push("ค่าใช้จ่ายจำเป็นสูงกว่า 70% ของรายได้ ทำให้ cashflow ยืดหยุ่นน้อย");
  } else if (fixedCostRatio >= 60) {
    warnings.push("ค่าใช้จ่ายจำเป็นเริ่มสูง ควรเผื่อเงินเหลือสำหรับเหตุฉุกเฉิน");
  }

  if (savingsRate < 10) {
    warnings.push("อัตราออมต่ำกว่า 10% เงินฉุกเฉินอาจโตช้า");
  }

  if (totals.investmentAmount > totals.savingsAmount + Math.max(0, remaining)) {
    warnings.push("แผนลงทุนหนักกว่าเงินออมและเงินเหลือ ควรตรวจสภาพคล่องก่อน");
  }

  const status =
    remaining < 0 || fixedCostRatio >= 70 || savingsRate < 5
      ? "เสี่ยง"
      : fixedCostRatio >= 60 || savingsRate < 10 || warnings.length > 0
        ? "ตึง"
        : "ดี";

  return {
    status,
    savingsRate,
    investmentRate,
    fixedCostRatio,
    warnings,
  };
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

function isEssentialAllocation(category: AllocationCategory) {
  return (
    category.kind === "family" ||
    category.kind === "necessary" ||
    category.kind === "fixed" ||
    category.kind === "debt"
  );
}
