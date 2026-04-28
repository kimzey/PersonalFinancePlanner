import { amountToPercent, normalizeAllocations } from "@/lib/finance";
import type { AllocationCategory, AllocationKind, FinancialPlan } from "@/types/finance";

export type PlanTemplateId =
  | "current"
  | "fifty-thirty-twenty"
  | "aggressive-investor"
  | "family-support"
  | "debt-payoff";

export type PlanTemplate = {
  id: PlanTemplateId;
  name: string;
  description: string;
  netIncome: number;
  allocations: AllocationCategory[];
};

const templateColors: Record<AllocationKind, string> = {
  family: "#2563eb",
  necessary: "#dc2626",
  fixed: "#9333ea",
  saving: "#f59e0b",
  investing: "#16a34a",
  lifestyle: "#0891b2",
  debt: "#be123c",
  other: "#64748b",
};

export function createPlanTemplate(
  id: PlanTemplateId,
  netIncome = 38_425,
): PlanTemplate {
  const allocationsByTemplate: Record<
    PlanTemplateId,
    Omit<PlanTemplate, "id" | "allocations" | "netIncome"> & {
      items: Array<{
        id: string;
        name: string;
        percent: number;
        kind: AllocationKind;
        locked?: boolean;
      }>;
    }
  > = {
    current: {
      name: "Current Plan",
      description: "แผนตั้งต้นที่บาลานซ์ภาระครอบครัว การลงทุน และเงินฉุกเฉิน",
      items: [
        { id: "family-support", name: "ให้ครอบครัว + ค่าเทอมน้อง", percent: 31.23, kind: "family", locked: true },
        { id: "dca-qqqi", name: "ลงทุน DCA", percent: 20.82, kind: "investing" },
        { id: "fixed-tech", name: "Fixed Tech", percent: 10, kind: "fixed" },
        { id: "emergency-fund", name: "เงินออมฉุกเฉิน", percent: 13.01, kind: "saving" },
        { id: "basic-expense", name: "ค่าใช้จ่ายพื้นฐาน", percent: 13.01, kind: "necessary" },
        { id: "lifestyle", name: "Lifestyle", percent: 11.93, kind: "lifestyle" },
      ],
    },
    "fifty-thirty-twenty": {
      name: "50/30/20",
      description: "แบ่งรายได้เป็นจำเป็น 50%, ใช้ชีวิต 30%, ออมและลงทุน 20%",
      items: [
        { id: "needs", name: "Needs", percent: 50, kind: "necessary" },
        { id: "wants", name: "Wants", percent: 30, kind: "lifestyle" },
        { id: "savings", name: "ออม/ลงทุน", percent: 20, kind: "saving" },
      ],
    },
    "aggressive-investor": {
      name: "Aggressive Investor",
      description: "เพิ่มน้ำหนักลงทุนสำหรับคนที่ภาระคงที่ต่ำและรับความผันผวนได้",
      items: [
        { id: "investing", name: "ลงทุน DCA", percent: 35, kind: "investing" },
        { id: "emergency", name: "เงินฉุกเฉิน", percent: 10, kind: "saving" },
        { id: "fixed", name: "ค่าใช้จ่ายคงที่", percent: 25, kind: "fixed" },
        { id: "necessary", name: "ค่าใช้จ่ายพื้นฐาน", percent: 20, kind: "necessary" },
        { id: "lifestyle", name: "Lifestyle", percent: 10, kind: "lifestyle" },
      ],
    },
    "family-support": {
      name: "Family Support",
      description: "กันเงินช่วยครอบครัวก่อน แล้วคุมค่าใช้จ่ายให้ยังมีเงินออม",
      items: [
        { id: "family", name: "ให้ครอบครัว", percent: 30, kind: "family", locked: true },
        { id: "necessary", name: "ค่าใช้จ่ายพื้นฐาน", percent: 25, kind: "necessary" },
        { id: "fixed", name: "ค่าใช้จ่ายคงที่", percent: 15, kind: "fixed" },
        { id: "saving", name: "เงินฉุกเฉิน", percent: 15, kind: "saving" },
        { id: "investing", name: "ลงทุน", percent: 10, kind: "investing" },
        { id: "lifestyle", name: "Lifestyle", percent: 5, kind: "lifestyle" },
      ],
    },
    "debt-payoff": {
      name: "Debt Payoff",
      description: "เร่งปิดหนี้ก่อนเพิ่มน้ำหนักลงทุน เหมาะกับช่วงลดภาระดอกเบี้ย",
      items: [
        { id: "debt", name: "จ่ายหนี้เพิ่ม", percent: 25, kind: "debt", locked: true },
        { id: "necessary", name: "ค่าใช้จ่ายพื้นฐาน", percent: 35, kind: "necessary" },
        { id: "fixed", name: "ค่าใช้จ่ายคงที่", percent: 15, kind: "fixed" },
        { id: "emergency", name: "เงินฉุกเฉิน", percent: 10, kind: "saving" },
        { id: "investing", name: "ลงทุนขั้นต่ำ", percent: 5, kind: "investing" },
        { id: "lifestyle", name: "Lifestyle", percent: 10, kind: "lifestyle" },
      ],
    },
  };

  const template = allocationsByTemplate[id];
  const allocations = template.items.map((item) => ({
    id: item.id,
    name: item.name,
    percent: item.percent,
    amount: (netIncome * item.percent) / 100,
    mode: "percent" as const,
    color: templateColors[item.kind],
    kind: item.kind,
    locked: item.locked,
  }));

  return {
    id,
    name: template.name,
    description: template.description,
    netIncome,
    allocations: normalizeAllocations(allocations, netIncome),
  };
}

export function getPlanTemplates(netIncome = 38_425): PlanTemplate[] {
  return [
    createPlanTemplate("current", netIncome),
    createPlanTemplate("fifty-thirty-twenty", netIncome),
    createPlanTemplate("aggressive-investor", netIncome),
    createPlanTemplate("family-support", netIncome),
    createPlanTemplate("debt-payoff", netIncome),
  ];
}

export function createFinancialPlanFromTemplate(template: PlanTemplate): FinancialPlan {
  const investing = template.allocations.find((allocation) => allocation.kind === "investing");

  return {
    schemaVersion: 1,
    profile: {
      netIncome: template.netIncome,
    },
    allocations: template.allocations.map((allocation) => ({
      ...allocation,
      percent: amountToPercent(allocation.amount, template.netIncome),
    })),
    investmentScenarios: [
      {
        id: `${template.id}-investment`,
        name: `${template.name} DCA`,
        initialAmount: 0,
        monthlyContribution: investing?.amount ?? 0,
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
