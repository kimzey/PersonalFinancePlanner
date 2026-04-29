import type { AllocationCategory, FinancialPlan, LifetimeLedger } from "@/types/finance";
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

export function createDefaultLifetimeLedger(netIncome = DEFAULT_NET_INCOME): LifetimeLedger {
  const yearlyIncome = netIncome * 12;

  return {
    currentAge: 28,
    targetAge: 65,
    startingAssets: 0,
    incomePeriods: [
      {
        id: "early-career",
        label: "เริ่มทำงาน",
        startAge: 22,
        endAge: 27,
        monthlyIncome: Math.round(netIncome * 0.65),
        annualBonus: Math.round(yearlyIncome * 0.5),
      },
      {
        id: "current-career",
        label: "ช่วงปัจจุบัน",
        startAge: 28,
        endAge: 35,
        monthlyIncome: netIncome,
        annualBonus: yearlyIncome,
      },
      {
        id: "growth-career",
        label: "ช่วงเติบโต",
        startAge: 36,
        endAge: 50,
        monthlyIncome: Math.round(netIncome * 1.6),
        annualBonus: Math.round(yearlyIncome * 1.5),
      },
    ],
    spendingCategories: [
      {
        id: "living-cost",
        name: "ค่าครองชีพ",
        amount: Math.round(yearlyIncome * 5.4),
        color: "#dc2626",
        note: "อาหาร เดินทาง ค่าเช่า และค่าใช้จ่ายจำเป็น",
      },
      {
        id: "home-family",
        name: "บ้านและครอบครัว",
        amount: Math.round(yearlyIncome * 2.6),
        color: "#2563eb",
      },
      {
        id: "learning-health",
        name: "เรียนรู้และสุขภาพ",
        amount: Math.round(yearlyIncome * 0.9),
        color: "#0891b2",
      },
      {
        id: "travel-lifestyle",
        name: "ท่องเที่ยวและไลฟ์สไตล์",
        amount: Math.round(yearlyIncome * 1.1),
        color: "#f59e0b",
      },
      {
        id: "invested-saved",
        name: "ออมและลงทุนแล้ว",
        amount: Math.round(yearlyIncome * 2.2),
        color: "#16a34a",
      },
    ],
  };
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
    lifetimeLedger: createDefaultLifetimeLedger(netIncome),
    settings: createDefaultSettings(),
  };
}
