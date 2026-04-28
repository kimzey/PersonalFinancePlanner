import { migrateFinancialPlan } from "@/lib/migrations";
import type { FinancialPlan } from "@/types/finance";

export const FINANCE_STORAGE_KEY = "personal-finance-planner:draft";
export const STORAGE_SCHEMA_VERSION = 1;

export type FinanceDraft = {
  storageSchemaVersion: number;
  savedAt: string;
  plan: FinancialPlan;
};

export type LoadDraftResult =
  | {
      ok: true;
      draft: FinanceDraft;
      migrated: boolean;
    }
  | {
      ok: false;
      error: string;
    };

type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadFinanceDraft(storage = getBrowserStorage()): LoadDraftResult {
  if (!storage) {
    return { ok: false, error: "storage unavailable" };
  }

  const rawDraft = storage.getItem(FINANCE_STORAGE_KEY);
  if (!rawDraft) {
    return { ok: false, error: "draft not found" };
  }

  try {
    const parsed = JSON.parse(rawDraft) as unknown;
    const record = isRecord(parsed) ? parsed : {};
    const migration = migrateFinancialPlan(record.plan ?? parsed);
    const savedAt =
      typeof record.savedAt === "string" ? record.savedAt : new Date().toISOString();

    return {
      ok: true,
      draft: {
        storageSchemaVersion: STORAGE_SCHEMA_VERSION,
        savedAt,
        plan: migration.plan,
      },
      migrated:
        migration.migrated ||
        record.storageSchemaVersion !== STORAGE_SCHEMA_VERSION ||
        !isRecord(parsed),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "load failed",
    };
  }
}

export function saveFinanceDraft(
  plan: FinancialPlan,
  storage = getBrowserStorage(),
  date = new Date(),
): FinanceDraft | null {
  if (!storage) return null;

  const draft: FinanceDraft = {
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    savedAt: date.toISOString(),
    plan,
  };

  storage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(draft));
  return draft;
}

export function clearFinanceDraft(storage = getBrowserStorage()) {
  storage?.removeItem(FINANCE_STORAGE_KEY);
}

function getBrowserStorage(): BrowserStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
