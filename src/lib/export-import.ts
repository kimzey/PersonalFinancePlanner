import { createDefaultPlan } from "@/lib/default-plan";
import { amountToPercent, normalizeAllocations } from "@/lib/finance";
import type { FinancialPlan } from "@/types/finance";
import {
  EXPORT_SCHEMA_VERSION,
  type ExportedFinanceData,
  type ExportOptions,
  type ImportedExpense,
  type ImportMode,
  type MonthlyReview,
} from "@/types/import-export";

const appVersion = "1.0.0";

export function createExportData(
  plan: FinancialPlan,
  options: ExportOptions,
): ExportedFinanceData {
  const allocations = plan.allocations.map((allocation, index) => {
    const nextAllocation = {
      ...allocation,
      id: options.anonymize ? `allocation-${index + 1}` : allocation.id,
      name: options.anonymize ? `หมวด ${index + 1}` : allocation.name,
      percent: amountToPercent(allocation.amount, plan.profile.netIncome),
    };

    if (!options.includeNotes || options.anonymize) {
      delete nextAllocation.note;
    }

    return nextAllocation;
  });

  return {
    metadata: {
      appName: "Personal Finance Planner",
      appVersion,
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      currency: "THB",
      locale: "th-TH",
    },
    profile: {
      netIncome: plan.profile.netIncome,
    },
    allocations,
    investmentScenarios: plan.investmentScenarios.map((scenario, index) => ({
      ...scenario,
      id: options.anonymize ? `investment-${index + 1}` : scenario.id,
      name: options.anonymize ? `แผนลงทุน ${index + 1}` : scenario.name,
    })),
    goals: plan.goals.map((goal, index) => ({
      ...goal,
      id: options.anonymize ? `goal-${index + 1}` : goal.id,
      name: options.anonymize ? `เป้าหมาย ${index + 1}` : goal.name,
    })),
    debts: plan.debts.map((debt, index) => ({
      ...debt,
      id: options.anonymize ? `debt-${index + 1}` : debt.id,
      name: options.anonymize ? `หนี้ ${index + 1}` : debt.name,
    })),
    expenses: options.includeActualExpenses
      ? sanitizeExpenses([], options)
      : [],
    monthlyReviews: sanitizeMonthlyReviews([], options),
    settings: {
      ...plan.settings,
      anonymized: options.anonymize,
      exportedWithNotes: options.includeNotes && !options.anonymize,
      exportedWithActualExpenses: options.includeActualExpenses,
    },
  };
}

export function serializeExportData(data: ExportedFinanceData) {
  return JSON.stringify(data, null, 2);
}

export function getExportFileName(date = new Date()) {
  return `finance-plan-${date.toISOString().slice(0, 10)}.json`;
}

export function mergeImportedPlan(
  currentPlan: FinancialPlan,
  importedData: ExportedFinanceData,
  mode: Exclude<ImportMode, "scenario">,
): FinancialPlan {
  const importedPlan = toFinancialPlan(importedData);

  if (mode === "replace") {
    return importedPlan;
  }

  return {
    ...currentPlan,
    allocations: normalizeAllocations(
      mergeById(currentPlan.allocations, importedPlan.allocations),
      currentPlan.profile.netIncome,
    ),
    investmentScenarios: mergeById(
      currentPlan.investmentScenarios,
      importedPlan.investmentScenarios,
    ),
    goals: mergeById(currentPlan.goals, importedPlan.goals),
    debts: mergeById(currentPlan.debts, importedPlan.debts),
    settings: {
      ...currentPlan.settings,
      ...importedPlan.settings,
    },
  };
}

export function toFinancialPlan(data: ExportedFinanceData): FinancialPlan {
  return {
    schemaVersion: data.metadata.schemaVersion,
    profile: {
      netIncome: Math.max(0, data.profile.netIncome),
    },
    allocations: normalizeAllocations(data.allocations, data.profile.netIncome),
    investmentScenarios: data.investmentScenarios.length
      ? data.investmentScenarios
      : createDefaultPlan(data.profile.netIncome).investmentScenarios,
    goals: data.goals,
    debts: data.debts,
    settings: toPlanSettings(data.settings),
  };
}

function toPlanSettings(settings: Record<string, unknown>): FinancialPlan["settings"] {
  return {
    currency: settings.currency === "THB" ? settings.currency : "THB",
    locale: settings.locale === "th-TH" ? settings.locale : "th-TH",
  };
}

function mergeById<T extends { id: string }>(currentItems: T[], importedItems: T[]) {
  const seen = new Set(currentItems.map((item) => item.id));
  const merged = [...currentItems];

  for (const item of importedItems) {
    if (seen.has(item.id)) {
      merged.push({ ...item, id: `${item.id}-imported-${Date.now()}` });
    } else {
      merged.push(item);
      seen.add(item.id);
    }
  }

  return merged;
}

function sanitizeExpenses(expenses: ImportedExpense[], options: ExportOptions) {
  return expenses.map((expense, index) => {
    const nextExpense = {
      ...expense,
      id: options.anonymize ? `expense-${index + 1}` : expense.id,
      name: options.anonymize ? `รายการ ${index + 1}` : expense.name,
    };

    if (!options.includeNotes || options.anonymize) {
      delete nextExpense.note;
    }

    return nextExpense;
  });
}

function sanitizeMonthlyReviews(reviews: MonthlyReview[], options: ExportOptions) {
  return reviews.map((review, index) => {
    const nextReview = {
      ...review,
      id: options.anonymize ? `review-${index + 1}` : review.id,
      summary: options.anonymize ? `รีวิวเดือน ${index + 1}` : review.summary,
    };

    if (!options.includeNotes || options.anonymize) {
      delete nextReview.note;
    }

    return nextReview;
  });
}
