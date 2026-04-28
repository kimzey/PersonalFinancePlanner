import { describe, expect, it } from "vitest";
import { createDefaultPlan } from "@/lib/default-plan";
import {
  applyScenarioPreset,
  createScenarioFromPlan,
  duplicateScenario,
  evaluateScenario,
  updateScenarioInvestment,
  updateScenarioKindAmount,
  updateScenarioNetIncome,
} from "@/lib/scenarios";

describe("scenario planning", () => {
  it("creates a scenario from a financial plan and evaluates cashflow and DCA", () => {
    const scenario = createScenarioFromPlan(createDefaultPlan());
    const result = evaluateScenario(scenario);

    expect(scenario.netIncome).toBe(50_000);
    expect(scenario.allocations).toHaveLength(5);
    expect(result.remaining).toBe(0);
    expect(result.futureValue).toBeGreaterThan(result.totalContribution);
  });

  it("duplicates scenarios without sharing ids", () => {
    const scenario = createScenarioFromPlan(createDefaultPlan());
    const duplicate = duplicateScenario(scenario);

    expect(duplicate.id).not.toBe(scenario.id);
    expect(duplicate.investmentScenario.id).not.toBe(scenario.investmentScenario.id);
    expect(duplicate.netIncome).toBe(scenario.netIncome);
  });

  it("applies emergency preset by reducing DCA and increasing savings", () => {
    const scenario = createScenarioFromPlan(createDefaultPlan());
    const emergencyScenario = applyScenarioPreset(scenario, "emergency-focus");
    const investingAmount = getKindAmount(emergencyScenario.allocations, "investing");
    const savingsAmount = getKindAmount(emergencyScenario.allocations, "saving");

    expect(investingAmount).toBe(5_250);
    expect(savingsAmount).toBe(12_250);
    expect(emergencyScenario.investmentScenario.monthlyContribution).toBe(5_250);
  });

  it("updates editable scenario assumptions", () => {
    const scenario = createScenarioFromPlan(createDefaultPlan());
    const updatedIncome = updateScenarioNetIncome(scenario, 45_000);
    const updatedExpense = updateScenarioKindAmount(updatedIncome, "necessary", 7_000);
    const updatedInvestment = updateScenarioInvestment(updatedExpense, {
      annualReturnPercent: 10,
      monthlyContribution: 12_000,
    });

    expect(updatedInvestment.netIncome).toBe(45_000);
    expect(getKindAmount(updatedInvestment.allocations, "necessary")).toBe(7_000);
    expect(updatedInvestment.investmentScenario.annualReturnPercent).toBe(10);
    expect(updatedInvestment.investmentScenario.monthlyContribution).toBe(12_000);
  });
});

function getKindAmount(
  allocations: ReturnType<typeof createDefaultPlan>["allocations"],
  kind: ReturnType<typeof createDefaultPlan>["allocations"][number]["kind"],
) {
  return allocations
    .filter((allocation) => allocation.kind === kind)
    .reduce((sum, allocation) => sum + allocation.amount, 0);
}
