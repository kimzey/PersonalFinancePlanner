import { describe, expect, it, vi } from "vitest";
import { createDefaultPlan } from "@/lib/default-plan";
import {
  createExportData,
  getExportFileName,
  mergeImportedPlan,
  serializeExportData,
} from "@/lib/export-import";
import { validateImportJson } from "@/lib/import-validation";

const defaultOptions = {
  includeActualExpenses: false,
  includeNotes: true,
  anonymize: false,
};

describe("export/import", () => {
  it("exports a plan and validates the same JSON back", () => {
    const plan = createDefaultPlan();
    const exportData = createExportData(plan, defaultOptions);
    const result = validateImportJson(serializeExportData(exportData));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.allocationCount).toBe(plan.allocations.length);
    expect(result.summary.investmentScenarioCount).toBe(1);
    expect(result.summary.noteCount).toBeGreaterThan(0);
  });

  it("anonymizes names and strips notes", () => {
    const exportData = createExportData(createDefaultPlan(), {
      includeActualExpenses: true,
      includeNotes: true,
      anonymize: true,
    });

    expect(exportData.allocations[0].name).toBe("หมวด 1");
    expect(exportData.allocations[0].note).toBeUndefined();
    expect(exportData.investmentScenarios[0].name).toBe("แผนลงทุน 1");
    expect(JSON.stringify(exportData)).not.toContain("ที่อยู่อาศัย");
  });

  it("rejects wrong JSON and schema version", () => {
    expect(validateImportJson("{").ok).toBe(false);

    const exportData = createExportData(createDefaultPlan(), defaultOptions);
    exportData.metadata.schemaVersion = 99;
    const result = validateImportJson(serializeExportData(exportData));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain("รองรับ schema version 1 เท่านั้น");
  });

  it("merges imported data without replacing the current profile", () => {
    vi.setSystemTime(new Date("2026-04-28T00:00:00.000Z"));
    const currentPlan = createDefaultPlan(40_000);
    const importedData = createExportData(createDefaultPlan(30_000), defaultOptions);
    const merged = mergeImportedPlan(currentPlan, importedData, "merge");

    expect(merged.profile.netIncome).toBe(40_000);
    expect(merged.allocations.length).toBeGreaterThan(currentPlan.allocations.length);

    vi.useRealTimers();
  });

  it("creates readable export file names", () => {
    expect(getExportFileName(new Date("2026-04-28T10:00:00.000Z"))).toBe(
      "finance-plan-2026-04-28.json",
    );
  });
});
