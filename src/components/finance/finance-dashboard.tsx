"use client";

import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AllocationEditor } from "@/components/finance/allocation-editor";
import { SummaryCards } from "@/components/finance/summary-cards";
import {
  calculateAllocationTotals,
  calculateRemainingIncome,
  normalizeAllocations,
} from "@/lib/finance";
import { createDefaultPlan } from "@/lib/default-plan";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { AllocationCategory, FinancialPlan } from "@/types/finance";

type FinanceDashboardProps = {
  initialPlan: FinancialPlan;
};

export function FinanceDashboard({ initialPlan }: FinanceDashboardProps) {
  const [netIncome, setNetIncome] = useState(initialPlan.profile.netIncome);
  const [allocations, setAllocations] = useState(initialPlan.allocations);

  const normalizedAllocations = useMemo(
    () => normalizeAllocations(allocations, netIncome),
    [allocations, netIncome],
  );
  const totals = calculateAllocationTotals(normalizedAllocations);
  const remaining = calculateRemainingIncome(netIncome, totals.amount);
  const isOverIncome = remaining < 0;

  function handleAllocationsChange(nextAllocations: AllocationCategory[]) {
    setAllocations(normalizeAllocations(nextAllocations, netIncome));
  }

  function handleNetIncomeChange(nextNetIncome: number) {
    setNetIncome(nextNetIncome);
    setAllocations((currentAllocations) =>
      normalizeAllocations(currentAllocations, nextNetIncome),
    );
  }

  function resetDefaultPlan() {
    const defaultPlan = createDefaultPlan();
    setNetIncome(defaultPlan.profile.netIncome);
    setAllocations(defaultPlan.allocations);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
            Personal Finance Planner
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Dashboard สำหรับวางแผนรายได้ ค่าใช้จ่าย การออม และการลงทุนรายเดือน
          </p>
        </div>
        <Badge className="w-fit bg-teal-100 text-teal-900">Phase 3 Allocation</Badge>
      </header>

      <SummaryCards netIncome={netIncome} remaining={remaining} totals={totals} />

      {isOverIncome ? (
        <Alert variant="destructive">
          <AlertTitle>ยอดจัดสรรเกินรายได้</AlertTitle>
          <AlertDescription>
            แผนนี้เกินรายได้สุทธิอยู่ {formatCurrency(Math.abs(remaining))}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTitle>แผนปัจจุบัน</AlertTitle>
          <AlertDescription>
            ยอดจัดสรรรวม {formatPercent(totals.percent)} และเงินเหลือ{" "}
            {formatCurrency(remaining)}
          </AlertDescription>
        </Alert>
      )}

      <AllocationEditor
        allocations={normalizedAllocations}
        netIncome={netIncome}
        onAllocationsChange={handleAllocationsChange}
        onNetIncomeChange={handleNetIncomeChange}
        onReset={resetDefaultPlan}
      />
    </div>
  );
}
