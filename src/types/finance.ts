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
  essentialAmount: number;
};

export type CashflowHealthStatus = "ดี" | "ตึง" | "เสี่ยง";

export type CashflowHealth = {
  status: CashflowHealthStatus;
  savingsRate: number;
  investmentRate: number;
  fixedCostRatio: number;
  warnings: string[];
};

export type EmergencyFundPlan = {
  monthlyEssentialExpense: number;
  currentAmount: number;
  targetMonths: number;
  targetAmount: number;
  remainingAmount: number;
  monthlySaving: number;
  monthsToTarget: number | null;
  progressPercent: number;
};

export type InvestmentProjectionPoint = {
  year: number;
  totalContribution: number;
  futureValue: number;
  estimatedGain: number;
};
