import type {
  AllocationCategory,
  DebtItem,
  FinancialGoal,
  InvestmentScenario,
} from "@/types/finance";

export const EXPORT_SCHEMA_VERSION = 1;

export type ExportOptions = {
  includeActualExpenses: boolean;
  includeNotes: boolean;
  anonymize: boolean;
};

export type ImportMode = "replace" | "merge" | "scenario";

export type ImportedExpense = {
  id: string;
  date: string;
  name: string;
  amount: number;
  categoryId?: string;
  note?: string;
};

export type MonthlyReview = {
  id: string;
  month: string;
  summary: string;
  note?: string;
};

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
  expenses: ImportedExpense[];
  monthlyReviews: MonthlyReview[];
  settings: Record<string, unknown>;
};

export type ImportPreviewSummary = {
  schemaVersion: number;
  exportedAt: string;
  netIncome: number;
  allocationCount: number;
  investmentScenarioCount: number;
  goalCount: number;
  debtCount: number;
  expenseCount: number;
  monthlyReviewCount: number;
  noteCount: number;
};

export type ImportValidationResult =
  | {
      ok: true;
      data: ExportedFinanceData;
      summary: ImportPreviewSummary;
      warnings: string[];
    }
  | {
      ok: false;
      errors: string[];
    };
