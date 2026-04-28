import type { AllocationCategory, FinancialPlan } from "@/types/finance";
import { amountToPercent } from "@/lib/finance";

export const DEFAULT_NET_INCOME = 38_425;

const colors = {
  family: "#2563eb",
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
      id: "family-support",
      name: "ให้ครอบครัว + ค่าเทอมน้อง",
      amount: 12_000,
      mode: "amount",
      note: "รวมภาระค่าเทอมน้องเรียบร้อย",
      color: colors.family,
      kind: "family",
      locked: true,
    },
    {
      id: "dca-qqqi",
      name: "ลงทุน DCA (QQQI)",
      amount: 8_000,
      mode: "amount",
      note: "ปรับลดลงเพื่อให้ชีวิตยืดหยุ่นขึ้น",
      color: colors.investing,
      kind: "investing",
    },
    {
      id: "fixed-tech",
      name: "Fixed Tech (Net/AI)",
      amount: 3_843,
      mode: "amount",
      note: "งบเครื่องมือและซอฟต์แวร์ 10%",
      color: colors.fixed,
      kind: "fixed",
    },
    {
      id: "emergency-fund",
      name: "เงินออมฉุกเฉิน",
      amount: 5_000,
      mode: "amount",
      note: "สะสมสภาพคล่องรายเดือน",
      color: colors.saving,
      kind: "saving",
    },
    {
      id: "basic-expense",
      name: "ค่าใช้จ่ายพื้นฐาน",
      amount: 5_000,
      mode: "amount",
      note: "ค่ากินและของใช้ประจำวัน",
      color: colors.necessary,
      kind: "necessary",
    },
    {
      id: "lifestyle",
      name: "เงินส่วนตัว (Lifestyle)",
      amount: 4_582,
      mode: "amount",
      note: "เพิ่มความยืดหยุ่นในการใช้ชีวิต",
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
        id: "dca-current",
        name: "DCA ปัจจุบัน",
        initialAmount: 0,
        monthlyContribution: 8_000,
        annualReturnPercent: 8,
        years: 20,
      },
    ],
    goals: [],
    debts: [],
    settings: {
      currency: "THB",
      locale: "th-TH",
    },
  };
}
