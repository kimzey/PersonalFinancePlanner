import { migrateFinancialPlan } from "@/lib/migrations";
import type { FinancialPlan } from "@/types/finance";

export const FINANCE_STORAGE_KEY = "personal-finance-planner:draft";
export const FINANCE_PLANS_STORAGE_KEY = "personal-finance-planner:plans";
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

export type StoredFinancePlan = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  plan: FinancialPlan;
};

export type FinancePlanCollection = {
  storageSchemaVersion: number;
  savedAt: string;
  activePlanId: string;
  plans: StoredFinancePlan[];
};

export type LoadPlanCollectionResult =
  | {
      ok: true;
      collection: FinancePlanCollection;
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

export function loadFinancePlanCollection(
  storage = getBrowserStorage(),
  date = new Date(),
): LoadPlanCollectionResult {
  if (!storage) {
    return { ok: false, error: "storage unavailable" };
  }

  const rawCollection = storage.getItem(FINANCE_PLANS_STORAGE_KEY);
  if (rawCollection) {
    try {
      return parsePlanCollection(rawCollection, date);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "load failed",
      };
    }
  }

  const legacyDraft = loadFinanceDraft(storage);
  if (!legacyDraft.ok) {
    return { ok: false, error: legacyDraft.error };
  }

  const savedAt = legacyDraft.draft.savedAt || date.toISOString();
  return {
    ok: true,
    collection: {
      storageSchemaVersion: STORAGE_SCHEMA_VERSION,
      savedAt,
      activePlanId: "default-plan",
      plans: [
        {
          id: "default-plan",
          name: "แผนหลัก",
          createdAt: savedAt,
          updatedAt: savedAt,
          plan: legacyDraft.draft.plan,
        },
      ],
    },
    migrated: true,
  };
}

export function saveFinancePlanCollection(
  collection: FinancePlanCollection,
  storage = getBrowserStorage(),
  date = new Date(),
): FinancePlanCollection | null {
  if (!storage) return null;

  const savedCollection: FinancePlanCollection = {
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    savedAt: date.toISOString(),
    activePlanId: collection.activePlanId,
    plans: collection.plans,
  };

  storage.setItem(FINANCE_PLANS_STORAGE_KEY, JSON.stringify(savedCollection));
  return savedCollection;
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

function parsePlanCollection(rawCollection: string, date: Date): LoadPlanCollectionResult {
  const parsed = JSON.parse(rawCollection) as unknown;
  const record = isRecord(parsed) ? parsed : {};
  const rawPlans = Array.isArray(record.plans) ? record.plans : [];
  const fallbackDate = date.toISOString();
  const plans = rawPlans
    .map((rawPlan, index): StoredFinancePlan | null => {
      if (!isRecord(rawPlan)) return null;

      const migration = migrateFinancialPlan(rawPlan.plan);
      const id = typeof rawPlan.id === "string" && rawPlan.id ? rawPlan.id : `plan-${index + 1}`;
      const name =
        typeof rawPlan.name === "string" && rawPlan.name.trim()
          ? rawPlan.name.trim()
          : `Plan ${index + 1}`;

      return {
        id,
        name,
        createdAt: typeof rawPlan.createdAt === "string" ? rawPlan.createdAt : fallbackDate,
        updatedAt: typeof rawPlan.updatedAt === "string" ? rawPlan.updatedAt : fallbackDate,
        plan: migration.plan,
      };
    })
    .filter((plan): plan is StoredFinancePlan => Boolean(plan));

  if (plans.length === 0) {
    return { ok: false, error: "plans not found" };
  }

  const activePlanId =
    typeof record.activePlanId === "string" &&
    plans.some((plan) => plan.id === record.activePlanId)
      ? record.activePlanId
      : plans[0].id;

  return {
    ok: true,
    collection: {
      storageSchemaVersion: STORAGE_SCHEMA_VERSION,
      savedAt: typeof record.savedAt === "string" ? record.savedAt : fallbackDate,
      activePlanId,
      plans,
    },
    migrated: record.storageSchemaVersion !== STORAGE_SCHEMA_VERSION,
  };
}
