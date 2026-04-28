import { describe, expect, it } from "vitest";
import { createDefaultPlan } from "@/lib/default-plan";
import {
  FINANCE_PLANS_STORAGE_KEY,
  FINANCE_STORAGE_KEY,
  loadFinancePlanCollection,
  loadFinanceDraft,
  saveFinancePlanCollection,
  saveFinanceDraft,
} from "@/lib/storage";

describe("finance draft storage", () => {
  it("saves and loads a financial plan draft", () => {
    const storage = createMemoryStorage();
    const plan = createDefaultPlan(50_000);

    const saved = saveFinanceDraft(plan, storage, new Date("2026-04-28T00:00:00.000Z"));
    const loaded = loadFinanceDraft(storage);

    expect(saved?.savedAt).toBe("2026-04-28T00:00:00.000Z");
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.draft.plan.profile.netIncome).toBe(50_000);
      expect(loaded.draft.savedAt).toBe("2026-04-28T00:00:00.000Z");
    }
  });

  it("migrates legacy drafts that stored the plan directly", () => {
    const storage = createMemoryStorage();
    const legacyPlan = {
      ...createDefaultPlan(42_000),
      schemaVersion: 0,
    };

    storage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(legacyPlan));
    const loaded = loadFinanceDraft(storage);

    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.migrated).toBe(true);
      expect(loaded.draft.plan.schemaVersion).toBe(1);
      expect(loaded.draft.plan.profile.netIncome).toBe(42_000);
    }
  });

  it("returns a readable error for invalid JSON", () => {
    const storage = createMemoryStorage();
    storage.setItem(FINANCE_STORAGE_KEY, "{bad json");

    const loaded = loadFinanceDraft(storage);

    expect(loaded.ok).toBe(false);
  });

  it("saves and loads multiple named plans", () => {
    const storage = createMemoryStorage();
    const firstPlan = createDefaultPlan(50_000);
    const secondPlan = createDefaultPlan(75_000);

    const saved = saveFinancePlanCollection(
      {
        storageSchemaVersion: 1,
        savedAt: "2026-04-28T00:00:00.000Z",
        activePlanId: "second",
        plans: [
          {
            id: "first",
            name: "Main",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T00:00:00.000Z",
            plan: firstPlan,
          },
          {
            id: "second",
            name: "Side income",
            createdAt: "2026-04-28T00:00:00.000Z",
            updatedAt: "2026-04-28T01:00:00.000Z",
            plan: secondPlan,
          },
        ],
      },
      storage,
      new Date("2026-04-28T02:00:00.000Z"),
    );
    const loaded = loadFinancePlanCollection(storage);

    expect(saved?.activePlanId).toBe("second");
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.collection.activePlanId).toBe("second");
      expect(loaded.collection.plans).toHaveLength(2);
      expect(loaded.collection.plans[1].plan.profile.netIncome).toBe(75_000);
    }
  });

  it("migrates a legacy single draft into the plan collection", () => {
    const storage = createMemoryStorage();
    const legacyPlan = createDefaultPlan(42_000);

    storage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(legacyPlan));
    const loaded = loadFinancePlanCollection(
      storage,
      new Date("2026-04-28T00:00:00.000Z"),
    );

    expect(storage.getItem(FINANCE_PLANS_STORAGE_KEY)).toBeNull();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.migrated).toBe(true);
      expect(loaded.collection.activePlanId).toBe("default-plan");
      expect(loaded.collection.plans[0].name).toBe("แผนหลัก");
      expect(loaded.collection.plans[0].plan.profile.netIncome).toBe(42_000);
    }
  });
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}
