import { describe, expect, it } from "vitest";
import { parseCalculatorInput } from "@/lib/calculators";

describe("parseCalculatorInput", () => {
  it("parses shorthand suffixes", () => {
    expect(parseCalculatorInput("8k")).toBe(8000);
    expect(parseCalculatorInput("1.5m")).toBe(1500000);
  });

  it("evaluates arithmetic without eval", () => {
    expect(parseCalculatorInput("50000*0.1")).toBe(5000);
    expect(parseCalculatorInput("12000+3500")).toBe(15500);
    expect(parseCalculatorInput("(10k+2k)/3")).toBe(4000);
  });

  it("rejects invalid expressions", () => {
    expect(() => parseCalculatorInput("12000+")).toThrow();
    expect(() => parseCalculatorInput("Math.max(1,2)")).toThrow();
    expect(() => parseCalculatorInput("10/0")).toThrow();
  });
});
