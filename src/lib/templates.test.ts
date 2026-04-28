import { describe, expect, it } from "vitest";
import { getPlanTemplates } from "@/lib/templates";
import { calculateAllocationTotals } from "@/lib/finance";

describe("getPlanTemplates", () => {
  it("creates all guided setup templates", () => {
    const templates = getPlanTemplates(40000);

    expect(templates.map((template) => template.name)).toEqual([
      "Current Plan",
      "50/30/20",
      "Aggressive Investor",
      "Family Support",
      "Debt Payoff",
    ]);
  });

  it("keeps template allocations balanced to income", () => {
    for (const template of getPlanTemplates(40000)) {
      const totals = calculateAllocationTotals(template.allocations);

      expect(Math.round(totals.amount)).toBe(40000);
      expect(Math.round(totals.percent)).toBe(100);
    }
  });
});
