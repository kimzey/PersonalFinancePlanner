import { describe, expect, it } from "vitest";
import { calculateThaiPersonalIncomeTax } from "@/lib/tax";

describe("calculateThaiPersonalIncomeTax", () => {
  it("returns zero tax when taxable income is within the exempt bracket", () => {
    const result = calculateThaiPersonalIncomeTax({ monthlyIncome: 20_000 });

    expect(result.annualIncome).toBe(240_000);
    expect(result.employmentExpenseDeduction).toBe(100_000);
    expect(result.personalAllowance).toBe(60_000);
    expect(result.taxableIncome).toBe(80_000);
    expect(result.grossTax).toBe(0);
    expect(result.taxPayable).toBe(0);
  });

  it("calculates progressive tax for employment income", () => {
    const result = calculateThaiPersonalIncomeTax({ monthlyIncome: 100_000 });

    expect(result.annualIncome).toBe(1_200_000);
    expect(result.totalDeductions).toBe(160_000);
    expect(result.taxableIncome).toBe(1_040_000);
    expect(result.grossTax).toBe(125_000);
    expect(result.taxPayable).toBe(125_000);
  });

  it("subtracts withholding tax and reports refunds", () => {
    const result = calculateThaiPersonalIncomeTax({
      monthlyIncome: 50_000,
      withholdingTax: 40_000,
    });

    expect(result.grossTax).toBe(21_500);
    expect(result.taxPayable).toBe(0);
    expect(result.refundAmount).toBe(18_500);
  });

  it("applies extra deductions before tax", () => {
    const result = calculateThaiPersonalIncomeTax({
      extraDeductions: 100_000,
      monthlyIncome: 50_000,
    });

    expect(result.taxableIncome).toBe(340_000);
    expect(result.grossTax).toBe(11_500);
  });
});
