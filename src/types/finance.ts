export type AllocationInputMode = "amount" | "percent";

export type AllocationKind =
  | "family"
  | "necessary"
  | "fixed"
  | "saving"
  | "investing"
  | "lifestyle"
  | "debt"
  | "other";

export type AllocationCategory = {
  id: string;
  name: string;
  amount: number;
  percent: number;
  mode: AllocationInputMode;
  note?: string;
  color: string;
  kind: AllocationKind;
  locked?: boolean;
};

export type InvestmentScenario = {
  id: string;
  name: string;
  initialAmount: number;
  monthlyContribution: number;
  annualReturnPercent: number;
  years: number;
};

export type FinancialGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlySaving: number;
  targetDate?: string;
};

export type DebtItem = {
  id: string;
  name: string;
  balance: number;
  annualInterestPercent: number;
  minimumPayment: number;
};

export type FinancialPlan = {
  schemaVersion: number;
  profile: {
    netIncome: number;
  };
  allocations: AllocationCategory[];
  investmentScenarios: InvestmentScenario[];
  goals: FinancialGoal[];
  debts: DebtItem[];
  settings: {
    currency: "THB";
    locale: "th-TH";
  };
};

export type AllocationTotals = {
  amount: number;
  percent: number;
  savingsAmount: number;
  investmentAmount: number;
  fixedAmount: number;
};

export type InvestmentProjectionPoint = {
  year: number;
  totalContribution: number;
  futureValue: number;
  estimatedGain: number;
};
