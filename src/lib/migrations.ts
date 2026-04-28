import { createDefaultPlan } from "@/lib/default-plan";
import { normalizeAllocations } from "@/lib/finance";
import type { FinancialPlan } from "@/types/finance";

export const CURRENT_FINANCE_SCHEMA_VERSION = 1;

export type MigrationResult = {
  plan: FinancialPlan;
  migrated: boolean;
};

export function migrateFinancialPlan(input: unknown): MigrationResult {
  if (!isRecord(input)) {
    return { plan: createDefaultPlan(), migrated: true };
  }

  const schemaVersion = typeof input.schemaVersion === "number" ? input.schemaVersion : 0;

  if (schemaVersion > CURRENT_FINANCE_SCHEMA_VERSION) {
    throw new Error(
      `รองรับ schema version ${CURRENT_FINANCE_SCHEMA_VERSION} แต่ข้อมูลเป็น version ${schemaVersion}`,
    );
  }

  const fallbackPlan = createDefaultPlan();
  const profile = isRecord(input.profile) ? input.profile : {};
  const netIncome =
    typeof profile.netIncome === "number" && Number.isFinite(profile.netIncome)
      ? Math.max(0, profile.netIncome)
      : fallbackPlan.profile.netIncome;

  const plan: FinancialPlan = {
    schemaVersion: CURRENT_FINANCE_SCHEMA_VERSION,
    profile: {
      netIncome,
    },
    allocations: Array.isArray(input.allocations)
      ? normalizeAllocations(
          input.allocations.filter(isAllocationLike),
          netIncome,
        )
      : createDefaultPlan(netIncome).allocations,
    investmentScenarios: Array.isArray(input.investmentScenarios)
      ? input.investmentScenarios.filter(isInvestmentScenarioLike)
      : createDefaultPlan(netIncome).investmentScenarios,
    goals: Array.isArray(input.goals) ? input.goals.filter(isGoalLike) : [],
    debts: Array.isArray(input.debts) ? input.debts.filter(isDebtLike) : [],
    settings: {
      currency: "THB",
      locale: "th-TH",
    },
  };

  if (plan.investmentScenarios.length === 0) {
    plan.investmentScenarios = createDefaultPlan(netIncome).investmentScenarios;
  }

  return {
    plan,
    migrated: schemaVersion !== CURRENT_FINANCE_SCHEMA_VERSION,
  };
}

function isAllocationLike(value: unknown): value is FinancialPlan["allocations"][number] {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.amount === "number" &&
    typeof value.percent === "number" &&
    (value.mode === "amount" || value.mode === "percent") &&
    typeof value.color === "string" &&
    typeof value.kind === "string"
  );
}

function isInvestmentScenarioLike(
  value: unknown,
): value is FinancialPlan["investmentScenarios"][number] {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.initialAmount === "number" &&
    typeof value.monthlyContribution === "number" &&
    typeof value.annualReturnPercent === "number" &&
    typeof value.years === "number" &&
    (value.contributionSteps === undefined ||
      (Array.isArray(value.contributionSteps) &&
        value.contributionSteps.every(isContributionStepLike)))
  );
}

function isContributionStepLike(
  value: unknown,
): value is NonNullable<FinancialPlan["investmentScenarios"][number]["contributionSteps"]>[number] {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.startMonth === "number" &&
    typeof value.monthlyContribution === "number"
  );
}

function isGoalLike(value: unknown): value is FinancialPlan["goals"][number] {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.targetAmount === "number" &&
    typeof value.currentAmount === "number" &&
    typeof value.monthlySaving === "number"
  );
}

function isDebtLike(value: unknown): value is FinancialPlan["debts"][number] {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.balance === "number" &&
    typeof value.annualInterestPercent === "number" &&
    typeof value.minimumPayment === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
