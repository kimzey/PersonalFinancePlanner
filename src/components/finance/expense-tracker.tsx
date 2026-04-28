"use client";

import { AlertTriangle, ReceiptText } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { AllocationCategory } from "@/types/finance";

type ExpenseTrackerProps = {
  allocations: AllocationCategory[];
};

type ActualExpenseMap = Record<string, number>;

export function ExpenseTracker({ allocations }: ExpenseTrackerProps) {
  const [actualExpenses, setActualExpenses] = useState<ActualExpenseMap>({});
  const trackedAllocations = allocations.filter(
    (allocation) => allocation.kind !== "saving" && allocation.kind !== "investing",
  );
  const totalPlanned = trackedAllocations.reduce(
    (sum, allocation) => sum + Math.max(0, allocation.amount),
    0,
  );
  const totalActual = trackedAllocations.reduce(
    (sum, allocation) => sum + Math.max(0, actualExpenses[allocation.id] ?? 0),
    0,
  );
  const totalUsedPercent = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  const warningItems = trackedAllocations.filter((allocation) => {
    const actual = actualExpenses[allocation.id] ?? 0;
    return allocation.amount > 0 && actual / allocation.amount >= 0.8;
  });

  function updateActualExpense(allocationId: string, value: number) {
    setActualExpenses((currentExpenses) => ({
      ...currentExpenses,
      [allocationId]: value,
    }));
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Expense Tracker</CardTitle>
            <CardDescription>
              กรอกยอดใช้จริงแล้วเทียบกับงบที่วางไว้ใน allocation
            </CardDescription>
          </div>
          <Badge className={getUsageBadgeClass(totalUsedPercent)}>
            <ReceiptText className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {formatPercent(totalUsedPercent)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="งบรวม" value={formatCurrency(totalPlanned)} />
          <Metric label="ใช้จริง" value={formatCurrency(totalActual)} />
          <Metric label="เหลืองบ" value={formatCurrency(totalPlanned - totalActual)} />
        </div>

        {warningItems.length > 0 ? (
          <Alert variant={totalUsedPercent > 100 ? "destructive" : "default"}>
            <AlertTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              หมวดที่ใช้เกิน 80%
            </AlertTitle>
            <AlertDescription>
              {warningItems.map((item) => item.name).join(", ")}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3">
          {trackedAllocations.map((allocation) => {
            const actual = actualExpenses[allocation.id] ?? 0;
            const usedPercent = allocation.amount > 0 ? (actual / allocation.amount) * 100 : 0;

            return (
              <div className="grid gap-3 rounded-lg border border-[var(--border)] p-4" key={allocation.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="grid gap-2 sm:w-64">
                    <Label htmlFor={`${allocation.id}-actual`}>{allocation.name}</Label>
                    <Input
                      id={`${allocation.id}-actual`}
                      inputMode="decimal"
                      min={0}
                      onChange={(event) =>
                        updateActualExpense(allocation.id, Number(event.target.value))
                      }
                      type="number"
                      value={Number(actual.toFixed(2))}
                    />
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    ใช้ {formatCurrency(actual)} จาก {formatCurrency(allocation.amount)}
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usedPercent >= 100
                        ? "bg-[var(--destructive)]"
                        : usedPercent >= 80
                          ? "bg-amber-500"
                          : "bg-[var(--primary)]"
                    }`}
                    style={{ width: `${Math.min(100, usedPercent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-2 text-lg font-semibold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function getUsageBadgeClass(percent: number) {
  if (percent >= 100) {
    return "w-fit bg-[var(--danger-soft)] text-[var(--danger-soft-foreground)]";
  }

  if (percent >= 80) {
    return "w-fit bg-amber-100 text-amber-900";
  }

  return "w-fit bg-[var(--success-soft)] text-[var(--success-soft-foreground)]";
}
