export type TaxBracketBreakdown = {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
};

export type PersonalIncomeTaxInput = {
  monthlyIncome: number;
  annualBonus?: number;
  extraDeductions?: number;
  withholdingTax?: number;
};

export type PersonalIncomeTaxResult = {
  annualIncome: number;
  employmentExpenseDeduction: number;
  personalAllowance: number;
  totalDeductions: number;
  taxableIncome: number;
  grossTax: number;
  withholdingTax: number;
  taxPayable: number;
  refundAmount: number;
  bracketBreakdown: TaxBracketBreakdown[];
};

const EMPLOYMENT_EXPENSE_RATE = 0.5;
const MAX_EMPLOYMENT_EXPENSE_DEDUCTION = 100_000;
const PERSONAL_ALLOWANCE = 60_000;

const TAX_BRACKETS: { from: number; to: number | null; rate: number }[] = [
  { from: 0, to: 150_000, rate: 0 },
  { from: 150_000, to: 300_000, rate: 0.05 },
  { from: 300_000, to: 500_000, rate: 0.1 },
  { from: 500_000, to: 750_000, rate: 0.15 },
  { from: 750_000, to: 1_000_000, rate: 0.2 },
  { from: 1_000_000, to: 2_000_000, rate: 0.25 },
  { from: 2_000_000, to: 5_000_000, rate: 0.3 },
  { from: 5_000_000, to: null, rate: 0.35 },
];

export function calculateThaiPersonalIncomeTax({
  annualBonus = 0,
  extraDeductions = 0,
  monthlyIncome,
  withholdingTax = 0,
}: PersonalIncomeTaxInput): PersonalIncomeTaxResult {
  const annualIncome = sanitizeMoney(monthlyIncome) * 12 + sanitizeMoney(annualBonus);
  const employmentExpenseDeduction = Math.min(
    annualIncome * EMPLOYMENT_EXPENSE_RATE,
    MAX_EMPLOYMENT_EXPENSE_DEDUCTION,
  );
  const personalAllowance = PERSONAL_ALLOWANCE;
  const totalDeductions =
    employmentExpenseDeduction + personalAllowance + sanitizeMoney(extraDeductions);
  const taxableIncome = Math.max(0, annualIncome - totalDeductions);
  const bracketBreakdown = calculateBracketBreakdown(taxableIncome);
  const grossTax = roundMoney(
    bracketBreakdown.reduce((totalTax, bracket) => totalTax + bracket.tax, 0),
  );
  const normalizedWithholdingTax = sanitizeMoney(withholdingTax);
  const taxBalance = grossTax - normalizedWithholdingTax;

  return {
    annualIncome,
    bracketBreakdown,
    employmentExpenseDeduction,
    grossTax,
    personalAllowance,
    refundAmount: Math.max(0, roundMoney(-taxBalance)),
    taxPayable: Math.max(0, roundMoney(taxBalance)),
    taxableIncome,
    totalDeductions,
    withholdingTax: normalizedWithholdingTax,
  };
}

function calculateBracketBreakdown(taxableIncome: number): TaxBracketBreakdown[] {
  return TAX_BRACKETS.map((bracket) => {
    const bracketCeiling = bracket.to ?? taxableIncome;
    const taxableAmount = Math.max(
      0,
      Math.min(taxableIncome, bracketCeiling) - bracket.from,
    );

    return {
      ...bracket,
      taxableAmount,
      tax: roundMoney(taxableAmount * bracket.rate),
    };
  }).filter((bracket) => bracket.taxableAmount > 0 || bracket.from === 0);
}

function sanitizeMoney(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
