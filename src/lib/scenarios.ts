import {
  assessCashflowHealth,
  calculateAllocationTotals,
  calculateDcaFutureValue,
  calculateRemainingIncome,
  calculateTotalContribution,
  normalizeAllocations,
} from "@/lib/finance";
import type {
  AllocationCategory,
  AllocationTotals,
  CashflowHealth,
  FinancialPlan,
  InvestmentScenario,
} from "@/types/finance";

export type ScenarioPresetId =
  | "emergency-focus"
  | "increase-dca"
  | "salary-increase"
  | "expense-increase";

export type ScenarioPlan = {
  id: string;
  name: string;
  netIncome: number;
  allocations: AllocationCategory[];
  investmentScenario: InvestmentScenario;
};

export type ScenarioResult = {
  totals: AllocationTotals;
  remaining: number;
  health: CashflowHealth;
  totalContribution: number;
  futureValue: number;
  estimatedGain: number;
};

export const scenarioPresets: Array<{
  id: ScenarioPresetId;
  name: string;
  description: string;
}> = [
  {
    id: "emergency-focus",
    name: "ลด DCA เพื่อเงินฉุกเฉิน",
    description: "ลดเงินลงทุน 30% แล้วโยกไปเงินออมฉุกเฉิน",
  },
  {
    id: "increase-dca",
    name: "เพิ่ม DCA",
    description: "เพิ่ม DCA 2,000 บาท และลด lifestyle เท่าที่ทำได้",
  },
  {
    id: "salary-increase",
    name: "เงินเดือนเพิ่ม",
    description: "เพิ่มรายได้สุทธิ 10% โดยคงงบรายเดือนเดิม",
  },
  {
    id: "expense-increase",
    name: "ค่าใช้จ่ายเพิ่ม",
    description: "เพิ่มค่าใช้จ่ายพื้นฐาน 2,000 บาท",
  },
];

export function createScenarioFromPlan(
  plan: Pick<FinancialPlan, "profile" | "allocations" | "investmentScenarios">,
  name = "แผนปัจจุบัน",
): ScenarioPlan {
  const investmentScenario = plan.investmentScenarios[0] ?? {
    id: createId("investment"),
    name: "DCA",
    initialAmount: 0,
    monthlyContribution: getKindAmount(plan.allocations, "investing"),
    annualReturnPercent: 8,
    years: 20,
  };

  return createScenario({
    id: createId("scenario"),
    name,
    netIncome: plan.profile.netIncome,
    allocations: plan.allocations,
    investmentScenario,
  });
}

export function createScenarioFromState({
  name = "แผนปัจจุบัน",
  netIncome,
  allocations,
  investmentScenario,
}: {
  name?: string;
  netIncome: number;
  allocations: AllocationCategory[];
  investmentScenario: InvestmentScenario;
}) {
  return createScenario({
    id: createId("scenario"),
    name,
    netIncome,
    allocations,
    investmentScenario,
  });
}

export function duplicateScenario(scenario: ScenarioPlan, name?: string) {
  return createScenario({
    ...scenario,
    id: createId("scenario"),
    name: name ?? `${scenario.name} copy`,
    investmentScenario: {
      ...scenario.investmentScenario,
      id: createId("investment"),
    },
  });
}

export function applyScenarioPreset(
  baseScenario: ScenarioPlan,
  presetId: ScenarioPresetId,
) {
  if (presetId === "emergency-focus") {
    const investingAmount = getKindAmount(baseScenario.allocations, "investing");
    const reduction = Math.round(investingAmount * 0.3);
    const allocations = addToKind(
      addToKind(baseScenario.allocations, "investing", -reduction),
      "saving",
      reduction,
    );

    return createScenario({
      ...baseScenario,
      id: createId("scenario"),
      name: "ลด DCA เพื่อเงินฉุกเฉิน",
      allocations,
      investmentScenario: {
        ...baseScenario.investmentScenario,
        id: createId("investment"),
        monthlyContribution: Math.max(0, baseScenario.investmentScenario.monthlyContribution - reduction),
      },
    });
  }

  if (presetId === "increase-dca") {
    const increase = 2_000;
    const allocations = addToKind(
      addToKind(baseScenario.allocations, "investing", increase),
      "lifestyle",
      -increase,
    );

    return createScenario({
      ...baseScenario,
      id: createId("scenario"),
      name: "เพิ่ม DCA",
      allocations,
      investmentScenario: {
        ...baseScenario.investmentScenario,
        id: createId("investment"),
        monthlyContribution: baseScenario.investmentScenario.monthlyContribution + increase,
      },
    });
  }

  if (presetId === "salary-increase") {
    return createScenario({
      ...baseScenario,
      id: createId("scenario"),
      name: "เงินเดือนเพิ่ม 10%",
      netIncome: Math.round(baseScenario.netIncome * 1.1),
      investmentScenario: {
        ...baseScenario.investmentScenario,
        id: createId("investment"),
      },
    });
  }

  const allocations = addToKind(baseScenario.allocations, "necessary", 2_000);

  return createScenario({
    ...baseScenario,
    id: createId("scenario"),
    name: "ค่าใช้จ่ายเพิ่ม",
    allocations,
    investmentScenario: {
      ...baseScenario.investmentScenario,
      id: createId("investment"),
    },
  });
}

export function evaluateScenario(scenario: ScenarioPlan): ScenarioResult {
  const allocations = normalizeAllocations(scenario.allocations, scenario.netIncome);
  const totals = calculateAllocationTotals(allocations);
  const remaining = calculateRemainingIncome(scenario.netIncome, totals.amount);
  const futureValue = calculateDcaFutureValue(
    scenario.investmentScenario.initialAmount,
    scenario.investmentScenario.monthlyContribution,
    scenario.investmentScenario.annualReturnPercent,
    scenario.investmentScenario.years,
  );
  const totalContribution = calculateTotalContribution(
    scenario.investmentScenario.initialAmount,
    scenario.investmentScenario.monthlyContribution,
    scenario.investmentScenario.years,
  );

  return {
    totals,
    remaining,
    health: assessCashflowHealth({ netIncome: scenario.netIncome, totals, remaining }),
    totalContribution,
    futureValue,
    estimatedGain: futureValue - totalContribution,
  };
}

export function updateScenarioNetIncome(scenario: ScenarioPlan, netIncome: number) {
  return createScenario({
    ...scenario,
    netIncome: Math.max(0, netIncome),
  });
}

export function updateScenarioInvestment(
  scenario: ScenarioPlan,
  patch: Partial<InvestmentScenario>,
) {
  return createScenario({
    ...scenario,
    investmentScenario: {
      ...scenario.investmentScenario,
      ...patch,
    },
  });
}

export function updateScenarioKindAmount(
  scenario: ScenarioPlan,
  kind: AllocationCategory["kind"],
  amount: number,
) {
  const currentAmount = getKindAmount(scenario.allocations, kind);
  return createScenario({
    ...scenario,
    allocations: addToKind(scenario.allocations, kind, Math.max(0, amount) - currentAmount),
  });
}

function createScenario(scenario: ScenarioPlan): ScenarioPlan {
  const normalizedAllocations = normalizeAllocations(
    cloneAllocations(scenario.allocations),
    scenario.netIncome,
  );

  return {
    ...scenario,
    netIncome: Math.max(0, scenario.netIncome),
    allocations: normalizedAllocations,
    investmentScenario: {
      ...scenario.investmentScenario,
      initialAmount: Math.max(0, scenario.investmentScenario.initialAmount),
      monthlyContribution: Math.max(0, scenario.investmentScenario.monthlyContribution),
      annualReturnPercent: Math.max(0, scenario.investmentScenario.annualReturnPercent),
      years: Math.max(1, Math.round(scenario.investmentScenario.years)),
    },
  };
}

function cloneAllocations(allocations: AllocationCategory[]) {
  return allocations.map((allocation) => ({ ...allocation }));
}

function addToKind(
  allocations: AllocationCategory[],
  kind: AllocationCategory["kind"],
  delta: number,
): AllocationCategory[] {
  let remainingDelta = delta;

  return allocations.map((allocation) => {
    if (allocation.kind !== kind || remainingDelta === 0) return { ...allocation };

    const nextAmount = Math.max(0, allocation.amount + remainingDelta);
    remainingDelta = allocation.amount + remainingDelta - nextAmount;

    return {
      ...allocation,
      amount: nextAmount,
      mode: "amount",
    };
  });
}

function getKindAmount(
  allocations: AllocationCategory[],
  kind: AllocationCategory["kind"],
) {
  return allocations
    .filter((allocation) => allocation.kind === kind)
    .reduce((sum, allocation) => sum + allocation.amount, 0);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
