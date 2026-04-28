import { describe, expect, it } from "vitest";
import { createDefaultPlan } from "@/lib/default-plan";
import {
  FINANCE_STORAGE_KEY,
  loadFinanceDraft,
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
