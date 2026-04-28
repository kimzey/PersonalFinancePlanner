import { describe, expect, it } from "vitest";
import {
  amountToPercent,
  assessCashflowHealth,
  calculateAllocationTotals,
  calculateDcaFutureValue,
  calculateEmergencyFundPlan,
  calculateRemainingIncome,
  calculateDividendIncomePlan,
  calculateScheduledDcaFutureValue,
  calculateScheduledTotalContribution,
  calculateScheduledYearlyInvestmentProjection,
  calculateYearlyInvestmentProjection,
  normalizeContributionSteps,
  percentToAmount,
  validateAllocationPlan,
} from "@/lib/finance";
import { createDefaultAllocations, DEFAULT_NET_INCOME } from "@/lib/default-plan";

describe("finance calculations", () => {
  it("converts amount to percent from net income", () => {
    expect(amountToPercent(10_000, DEFAULT_NET_INCOME)).toBeCloseTo(20, 2);
  });

  it("converts percent to amount from net income", () => {
    expect(percentToAmount(10, DEFAULT_NET_INCOME)).toBeCloseTo(5_000, 1);
  });

  it("calculates default allocation totals and remaining income", () => {
    const allocations = createDefaultAllocations();
    const totals = calculateAllocationTotals(allocations);

    expect(totals.amount).toBe(50_000);
    expect(totals.percent).toBeCloseTo(100, 4);
    expect(totals.essentialAmount).toBe(25_000);
    expect(calculateRemainingIncome(DEFAULT_NET_INCOME, totals.amount)).toBe(0);
  });

  it("calculates emergency fund target and months to target", () => {
    const plan = calculateEmergencyFundPlan({
      currentAmount: 10_000,
      monthlyEssentialExpense: 20_000,
      monthlySaving: 5_000,
      targetMonths: 6,
    });

    expect(plan.targetAmount).toBe(120_000);
    expect(plan.remainingAmount).toBe(110_000);
    expect(plan.monthsToTarget).toBe(22);
    expect(plan.progressPercent).toBeCloseTo(8.33, 2);
  });

  it("returns no target month estimate when monthly saving is zero", () => {
    const plan = calculateEmergencyFundPlan({
      currentAmount: 0,
      monthlyEssentialExpense: 10_000,
      monthlySaving: 0,
      targetMonths: 3,
    });

    expect(plan.monthsToTarget).toBeNull();
  });

  it("assesses cashflow health with rule-based warnings", () => {
    const allocations = createDefaultAllocations();
    const totals = calculateAllocationTotals(allocations);
    const health = assessCashflowHealth({
      netIncome: DEFAULT_NET_INCOME,
      totals,
      remaining: calculateRemainingIncome(DEFAULT_NET_INCOME, totals.amount),
    });

    expect(health.status).toBe("ดี");
    expect(health.savingsRate).toBeCloseTo(20, 2);
    expect(health.investmentRate).toBeCloseTo(15, 2);
    expect(health.fixedCostRatio).toBeCloseTo(50, 2);
    expect(health.warnings).toHaveLength(0);
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

  it("calculates scheduled DCA increases over time", () => {
    const contributionSteps = [
      { id: "start", startMonth: 1, monthlyContribution: 8_000 },
      { id: "year-6", startMonth: 61, monthlyContribution: 15_000 },
    ];

    const totalContribution = calculateScheduledTotalContribution(
      0,
      contributionSteps,
      10,
    );
    const futureValue = calculateScheduledDcaFutureValue(0, contributionSteps, 0, 10);
    const projection = calculateScheduledYearlyInvestmentProjection(
      0,
      contributionSteps,
      0,
      10,
    );

    expect(totalContribution).toBe(1_380_000);
    expect(futureValue).toBe(1_380_000);
    expect(projection[4].totalContribution).toBe(480_000);
    expect(projection[9].totalContribution).toBe(1_380_000);
  });

  it("normalizes contribution steps with legacy monthly contribution fallback", () => {
    const steps = normalizeContributionSteps(undefined, 7_500);

    expect(steps).toEqual([
      {
        id: "contribution-step-1",
        startMonth: 1,
        monthlyContribution: 7_500,
      },
    ]);
  });

  it("collapses scheduled DCA steps that do not change the monthly contribution", () => {
    const steps = normalizeContributionSteps(
      [
        { id: "start", startMonth: 1, monthlyContribution: 8_000 },
        { id: "month-24", startMonth: 24, monthlyContribution: 15_000 },
        { id: "month-36", startMonth: 36, monthlyContribution: 15_000 },
      ],
      8_000,
    );

    expect(steps).toEqual([
      { id: "start", startMonth: 1, monthlyContribution: 8_000 },
      { id: "month-24", startMonth: 24, monthlyContribution: 15_000 },
    ]);
  });

  it("calculates dividend income from a final portfolio value", () => {
    const dividendPlan = calculateDividendIncomePlan({
      portfolioValue: 10_000_000,
      annualDividendYieldPercent: 4,
      withholdingTaxPercent: 10,
    });

    expect(dividendPlan.grossAnnualDividend).toBe(400_000);
    expect(dividendPlan.grossMonthlyDividend).toBeCloseTo(33_333.33, 2);
    expect(dividendPlan.taxAmount).toBe(40_000);
    expect(dividendPlan.netMonthlyDividend).toBe(30_000);
  });

  it("validates allocation plan status", () => {
    const result = validateAllocationPlan(DEFAULT_NET_INCOME, createDefaultAllocations());

    expect(result.isBalanced).toBe(true);
    expect(result.isOverIncome).toBe(false);
    expect(result.isOverPercent).toBe(false);
  });
});
