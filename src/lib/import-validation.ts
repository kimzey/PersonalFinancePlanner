import type { AllocationCategory, InvestmentScenario } from "@/types/finance";
import {
  EXPORT_SCHEMA_VERSION,
  type ExportedFinanceData,
  type ImportPreviewSummary,
  type ImportValidationResult,
} from "@/types/import-export";

export function validateImportJson(input: string): ImportValidationResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, errors: ["ไฟล์ JSON ไม่ถูกต้อง หรืออ่านข้อมูลไม่ได้"] };
  }

  return validateImportData(parsed);
}

export function validateImportData(data: unknown): ImportValidationResult {
  const errors: string[] = [];

  if (!isRecord(data)) {
    return { ok: false, errors: ["รูปแบบไฟล์ไม่ใช่ object ของแผนการเงิน"] };
  }

  const metadata = data.metadata;
  if (!isRecord(metadata)) {
    errors.push("ไม่พบ metadata");
  } else {
    if (metadata.appName !== "Personal Finance Planner") {
      errors.push("ไฟล์นี้ไม่ได้มาจาก Personal Finance Planner");
    }
    if (metadata.schemaVersion !== EXPORT_SCHEMA_VERSION) {
      errors.push(`รองรับ schema version ${EXPORT_SCHEMA_VERSION} เท่านั้น`);
    }
  }

  if (!isRecord(data.profile) || !isFiniteNumber(data.profile.netIncome)) {
    errors.push("profile.netIncome ต้องเป็นตัวเลข");
  }

  if (!Array.isArray(data.allocations)) {
    errors.push("allocations ต้องเป็น array");
  } else {
    data.allocations.forEach((allocation, index) => {
      validateAllocation(allocation, index, errors);
    });
  }

  if (!Array.isArray(data.investmentScenarios)) {
    errors.push("investmentScenarios ต้องเป็น array");
  } else {
    data.investmentScenarios.forEach((scenario, index) => {
      validateInvestmentScenario(scenario, index, errors);
    });
  }

  for (const key of ["goals", "debts", "expenses", "monthlyReviews"] as const) {
    if (!Array.isArray(data[key])) {
      errors.push(`${key} ต้องเป็น array`);
    }
  }

  if (!isRecord(data.settings)) {
    errors.push("settings ต้องเป็น object");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const exportData = data as ExportedFinanceData;
  return {
    ok: true,
    data: exportData,
    summary: summarizeImport(exportData),
    warnings: createWarnings(exportData),
  };
}

function summarizeImport(data: ExportedFinanceData): ImportPreviewSummary {
  return {
    schemaVersion: data.metadata.schemaVersion,
    exportedAt: data.metadata.exportedAt,
    netIncome: data.profile.netIncome,
    allocationCount: data.allocations.length,
    investmentScenarioCount: data.investmentScenarios.length,
    goalCount: data.goals.length,
    debtCount: data.debts.length,
    expenseCount: data.expenses.length,
    monthlyReviewCount: data.monthlyReviews.length,
    noteCount:
      data.allocations.filter((allocation) => Boolean(allocation.note)).length
      + data.expenses.filter((expense) => Boolean(expense.note)).length
      + data.monthlyReviews.filter((review) => Boolean(review.note)).length,
  };
}

function createWarnings(data: ExportedFinanceData) {
  const warnings: string[] = [];
  const totalAmount = data.allocations.reduce((sum, allocation) => sum + allocation.amount, 0);

  if (totalAmount > data.profile.netIncome) {
    warnings.push("ยอดจัดสรรในไฟล์มากกว่ารายได้สุทธิ");
  }

  if (data.allocations.length === 0) {
    warnings.push("ไฟล์นี้ไม่มี allocation");
  }

  if (data.investmentScenarios.length === 0) {
    warnings.push("ไฟล์นี้ไม่มี investment scenario ระบบจะใช้ค่าเริ่มต้น");
  }

  return warnings;
}

function validateAllocation(
  allocation: unknown,
  index: number,
  errors: string[],
): asserts allocation is AllocationCategory {
  if (!isRecord(allocation)) {
    errors.push(`allocation #${index + 1} ต้องเป็น object`);
    return;
  }

  for (const key of ["id", "name", "mode", "color", "kind"] as const) {
    if (typeof allocation[key] !== "string") {
      errors.push(`allocation #${index + 1}.${key} ต้องเป็นข้อความ`);
    }
  }

  for (const key of ["amount", "percent"] as const) {
    if (!isFiniteNumber(allocation[key])) {
      errors.push(`allocation #${index + 1}.${key} ต้องเป็นตัวเลข`);
    }
  }
}

function validateInvestmentScenario(
  scenario: unknown,
  index: number,
  errors: string[],
): asserts scenario is InvestmentScenario {
  if (!isRecord(scenario)) {
    errors.push(`investment scenario #${index + 1} ต้องเป็น object`);
    return;
  }

  for (const key of ["id", "name"] as const) {
    if (typeof scenario[key] !== "string") {
      errors.push(`investment scenario #${index + 1}.${key} ต้องเป็นข้อความ`);
    }
  }

  for (const key of [
    "initialAmount",
    "monthlyContribution",
    "annualReturnPercent",
    "years",
  ] as const) {
    if (!isFiniteNumber(scenario[key])) {
      errors.push(`investment scenario #${index + 1}.${key} ต้องเป็นตัวเลข`);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
