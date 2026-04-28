import { describe, expect, it } from "vitest";
import {
  amountToPercent,
  calculateAllocationTotals,
  calculateDcaFutureValue,
  calculateRemainingIncome,
  calculateYearlyInvestmentProjection,
  percentToAmount,
  validateAllocationPlan,
} from "@/lib/finance";
import { createDefaultAllocations, DEFAULT_NET_INCOME } from "@/lib/default-plan";

describe("finance calculations", () => {
  it("converts amount to percent from net income", () => {
    expect(amountToPercent(8_000, DEFAULT_NET_INCOME)).toBeCloseTo(20.82, 2);
  });

  it("converts percent to amount from net income", () => {
    expect(percentToAmount(10, DEFAULT_NET_INCOME)).toBeCloseTo(3_842.5, 1);
  });

  it("calculates default allocation totals and remaining income", () => {
    const allocations = createDefaultAllocations();
    const totals = calculateAllocationTotals(allocations);

    expect(totals.amount).toBe(38_425);
    expect(totals.percent).toBeCloseTo(100, 4);
    expect(calculateRemainingIncome(DEFAULT_NET_INCOME, totals.amount)).toBe(0);
  });

  it("calculates DCA future value with monthly end-of-period contribution", () => {
    const futureValue = calculateDcaFutureValue(0, 8_000, 8, 20);

    expect(futureValue).toBeCloseTo(4_706_153, -5);
  });

  it("handles zero return DCA without division by zero", () => {
    expect(calculateDcaFutureValue(10_000, 1_000, 0, 2)).toBe(34_000);
  });

  it("returns yearly projection points", () => {
    const projection = calculateYearlyInvestmentProjection(0, 8_000, 8, 5);

    expect(projection).toHaveLength(5);
    expect(projection[4].totalContribution).toBe(480_000);
    expect(projection[4].futureValue).toBeCloseTo(586_962, -4);
  });

  it("validates allocation plan status", () => {
    const result = validateAllocationPlan(DEFAULT_NET_INCOME, createDefaultAllocations());

    expect(result.isBalanced).toBe(true);
    expect(result.isOverIncome).toBe(false);
    expect(result.isOverPercent).toBe(false);
  });
});
