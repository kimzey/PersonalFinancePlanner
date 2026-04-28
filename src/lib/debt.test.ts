import { describe, expect, it } from "vitest";
import { createDebtPlanSummary, estimateSingleDebtPayoff } from "@/lib/debt";

describe("debt planner", () => {
  it("estimates payoff months for a payable debt", () => {
    const estimate = estimateSingleDebtPayoff({
      id: "card",
      name: "Credit card",
      balance: 10_000,
      annualInterestPercent: 12,
      minimumPayment: 1_000,
    });

    expect(estimate.monthsToPayoff).toBeGreaterThan(10);
    expect(estimate.monthsToPayoff).toBeLessThan(12);
    expect(estimate.totalInterest).toBeGreaterThan(0);
  });

  it("orders avalanche by highest interest first", () => {
    const summary = createDebtPlanSummary(
      [
        { id: "small", name: "Small", balance: 5_000, annualInterestPercent: 5, minimumPayment: 500 },
        { id: "high", name: "High", balance: 20_000, annualInterestPercent: 20, minimumPayment: 2_000 },
      ],
      "avalanche",
    );

    expect(summary.payoffOrder[0].debtId).toBe("high");
  });
});
