import type {
  AllocationCategory,
  DebtItem,
  FinancialGoal,
  InvestmentScenario,
} from "@/types/finance";

export type ExportedFinanceData = {
  metadata: {
    appName: "Personal Finance Planner";
    appVersion: string;
    schemaVersion: number;
    exportedAt: string;
    currency: "THB";
    locale: "th-TH";
  };
  profile: {
    netIncome: number;
  };
  allocations: AllocationCategory[];
  investmentScenarios: InvestmentScenario[];
  goals: FinancialGoal[];
  debts: DebtItem[];
  expenses: unknown[];
  monthlyReviews: unknown[];
  settings: Record<string, unknown>;
};
