import { describe, expect, it } from "vitest";
import { evaluateGoal } from "@/lib/goals";

describe("goals", () => {
  it("calculates required monthly saving from target date", () => {
    const progress = evaluateGoal(
      {
        id: "goal",
        name: "Emergency reserve",
        targetAmount: 120_000,
        currentAmount: 60_000,
        monthlySaving: 10_000,
        targetDate: "2026-10-28",
      },
      new Date("2026-04-28T00:00:00"),
    );

    expect(progress.remainingAmount).toBe(60_000);
    expect(progress.monthsToTarget).toBe(6);
    expect(progress.requiredMonthlySaving).toBe(10_000);
    expect(progress.status).toBe("on-track");
  });
});
