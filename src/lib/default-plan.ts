import type { AllocationCategory, FinancialPlan } from "@/types/finance";
import { amountToPercent } from "@/lib/finance";

export const DEFAULT_NET_INCOME = 50_000;

export const DEFAULT_BETA_FEATURES: FinancialPlan["settings"]["betaFeatures"] = {
  protection: false,
  scenarios: false,
  goals: false,
  debts: false,
  expenses: false,
};

export function createDefaultSettings(): FinancialPlan["settings"] {
  return {
    currency: "THB",
    locale: "th-TH",
    betaFeatures: {
      ...DEFAULT_BETA_FEATURES,
    },
  };
}

const colors = {
  housing: "#2563eb",
  investing: "#16a34a",
  fixed: "#9333ea",
  saving: "#f59e0b",
  necessary: "#dc2626",
  lifestyle: "#0891b2",
};

export function createDefaultAllocations(
  netIncome = DEFAULT_NET_INCOME,
): AllocationCategory[] {
  const allocations: Omit<AllocationCategory, "percent">[] = [
    {
      id: "housing-utilities",
      name: "ที่อยู่อาศัยและค่าสาธารณูปโภค",
      amount: 15_000,
      mode: "amount",
      note: "ค่าเช่า/ผ่อนบ้าน ค่าน้ำ ค่าไฟ และอินเทอร์เน็ต",
      color: colors.housing,
      kind: "fixed",
      locked: true,
    },
    {
      id: "daily-expense",
      name: "ค่าใช้จ่ายประจำวัน",
      amount: 10_000,
      mode: "amount",
      note: "อาหาร เดินทาง และของใช้จำเป็น",
      color: colors.necessary,
      kind: "necessary",
    },
    {
      id: "emergency-fund",
      name: "เงินออมฉุกเฉิน",
      amount: 10_000,
      mode: "amount",
      note: "สะสมสภาพคล่อง 3-6 เดือน",
      color: colors.saving,
      kind: "saving",
    },
    {
      id: "long-term-investing",
      name: "ลงทุนระยะยาว",
      amount: 7_500,
      mode: "amount",
      note: "DCA รายเดือนตามระดับความเสี่ยงที่รับได้",
      color: colors.investing,
      kind: "investing",
    },
    {
      id: "lifestyle",
      name: "ไลฟ์สไตล์และพัฒนาตัวเอง",
      amount: 7_500,
      mode: "amount",
      note: "พักผ่อน เรียนรู้ และค่าใช้จ่ายยืดหยุ่น",
      color: colors.lifestyle,
      kind: "lifestyle",
    },
  ];

  return allocations.map((allocation) => ({
    ...allocation,
    percent: amountToPercent(allocation.amount, netIncome),
  }));
}

export function createDefaultPlan(netIncome = DEFAULT_NET_INCOME): FinancialPlan {
  return {
    schemaVersion: 1,
    profile: {
      netIncome,
    },
    allocations: createDefaultAllocations(netIncome),
    investmentScenarios: [
      {
        id: "starter-investment",
        name: "Starter DCA",
        initialAmount: 0,
        monthlyContribution: 7_500,
        annualReturnPercent: 8,
        years: 20,
      },
    ],
    goals: [],
    debts: [],
    settings: createDefaultSettings(),
  };
}
