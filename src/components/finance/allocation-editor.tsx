"use client";

import { useState } from "react";
import { ClipboardList, Plus, RotateCcw, Scale, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  categorySuggestions,
  CategorySuggestions,
} from "@/components/finance/category-suggestions";
import { BulkPasteDialog } from "@/components/finance/bulk-paste-dialog";
import { InlineCalculatorInput } from "@/components/finance/inline-calculator-input";
import {
  amountToPercent,
  calculateAllocationTotals,
  calculateRemainingIncome,
  normalizeAllocation,
  percentToAmount,
} from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";
import type {
  AllocationCategory,
  AllocationInputMode,
  AllocationKind,
} from "@/types/finance";

type AllocationEditorProps = {
  netIncome: number;
  allocations: AllocationCategory[];
  onNetIncomeChange: (netIncome: number) => void;
  onAllocationsChange: (allocations: AllocationCategory[]) => void;
  onReset: () => void;
};

const fallbackColors = [
  "#0f766e",
  "#c2410c",
  "#7c3aed",
  "#0369a1",
  "#be123c",
  "#4d7c0f",
];

export function AllocationEditor({
  netIncome,
  allocations,
  onNetIncomeChange,
  onAllocationsChange,
  onReset,
}: AllocationEditorProps) {
  const [bulkPasteOpen, setBulkPasteOpen] = useState(false);
  const totals = calculateAllocationTotals(allocations);
  const remaining = calculateRemainingIncome(netIncome, totals.amount);
  const isOverIncome = remaining < 0;

  function updateAllocation(id: string, patch: Partial<AllocationCategory>) {
    onAllocationsChange(
      allocations.map((category) => {
        if (category.id !== id) return category;

        const next = { ...category, ...patch };
        return normalizeAllocation(next, netIncome);
      }),
    );
  }

  function updateAllocationValue(
    category: AllocationCategory,
    value: number,
    mode: AllocationInputMode,
  ) {
    const safeValue = Math.max(0, value);
    const patch =
      mode === "amount"
        ? {
            mode,
            amount: safeValue,
            percent: amountToPercent(safeValue, netIncome),
          }
        : {
            mode,
            percent: safeValue,
            amount: percentToAmount(safeValue, netIncome),
          };

    updateAllocation(category.id, patch);
  }

  function handleNetIncomeChange(value: number) {
    const safeNetIncome = Math.max(0, value);
    onNetIncomeChange(safeNetIncome);
  }

  function addAllocation() {
    const suggestion = categorySuggestions[allocations.length % categorySuggestions.length];
    const amount = Math.max(0, remaining);
    const newAllocation: AllocationCategory = normalizeAllocation(
      {
        id: `category-${Date.now()}`,
        name: suggestion.name,
        amount,
        percent: amountToPercent(amount, netIncome),
        mode: "amount",
        color: suggestion.color,
        kind: suggestion.kind as AllocationKind,
        locked: false,
      },
      netIncome,
    );

    onAllocationsChange([...allocations, newAllocation]);
  }

  function removeAllocation(id: string) {
    onAllocationsChange(allocations.filter((category) => category.id !== id));
  }

  function autoBalance() {
    const unlocked = allocations.filter((category) => !category.locked);
    if (unlocked.length === 0) return;

    const lockedTotal = calculateAllocationTotals(
      allocations.filter((category) => category.locked),
    ).amount;
    const targetPerCategory = Math.max(0, (netIncome - lockedTotal) / unlocked.length);

    onAllocationsChange(
      allocations.map((category) => {
        if (category.locked) return normalizeAllocation(category, netIncome);

        return normalizeAllocation(
          {
            ...category,
            mode: "amount",
            amount: targetPerCategory,
          },
          netIncome,
        );
      }),
    );
  }

  function applyBulkAllocations(
    nextAllocations: AllocationCategory[],
    mode: "append" | "replace",
  ) {
    onAllocationsChange(
      mode === "replace" ? nextAllocations : [...allocations, ...nextAllocations],
    );
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>จัดสรรเงินรายเดือน</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button onClick={addAllocation} size="sm" type="button">
              <Plus className="h-4 w-4" aria-hidden="true" />
              เพิ่มหมวด
            </Button>
            <Button
              onClick={() => setBulkPasteOpen(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Bulk paste
            </Button>
            <Button onClick={autoBalance} size="sm" type="button" variant="outline">
              <Scale className="h-4 w-4" aria-hidden="true" />
              Auto-balance
            </Button>
            <Button onClick={onReset} size="sm" type="button" variant="secondary">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </Button>
          </div>
        </div>
        <div className="grid gap-2 sm:max-w-xs">
          <Label htmlFor="net-income">Net Income</Label>
          <InlineCalculatorInput
            id="net-income"
            min={0}
            onValueChange={handleNetIncomeChange}
            value={netIncome}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CategorySuggestions />

        <Alert variant={isOverIncome ? "destructive" : "default"}>
          <AlertTitle>
            รวม {formatCurrency(totals.amount)} ({formatPercent(totals.percent)})
          </AlertTitle>
          <AlertDescription>
            {isOverIncome
              ? `เกินรายได้อยู่ ${formatCurrency(Math.abs(remaining))}`
              : `เงินเหลือ ${formatCurrency(remaining)}`}
          </AlertDescription>
        </Alert>

        <div className="hidden grid-cols-[1.5fr_9rem_9rem_7rem_6rem_3rem] gap-3 px-1 text-xs font-medium text-[var(--muted-foreground)] lg:grid">
          <span>หมวดหมู่</span>
          <span>โหมด</span>
          <span>ค่าที่กรอก</span>
          <span>บาท</span>
          <span>%</span>
          <span />
        </div>

        <div className="flex flex-col gap-3">
          {allocations.map((category, index) => (
            <div
              className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 lg:grid-cols-[1.5fr_9rem_9rem_7rem_6rem_3rem] lg:items-center"
              key={category.id}
            >
              <div className="grid gap-2">
                <Label className="lg:hidden" htmlFor={`${category.id}-name`}>
                  หมวดหมู่
                </Label>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        category.color ?? fallbackColors[index % fallbackColors.length],
                    }}
                  />
                  <Input
                    id={`${category.id}-name`}
                    list="category-suggestions"
                    onChange={(event) =>
                      updateAllocation(category.id, { name: event.target.value })
                    }
                    value={category.name}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="lg:hidden" htmlFor={`${category.id}-mode`}>
                  โหมด
                </Label>
                <Select
                  id={`${category.id}-mode`}
                  onChange={(event) => {
                    const mode = event.target.value as AllocationInputMode;
                    updateAllocation(category.id, { mode });
                  }}
                  value={category.mode}
                >
                  <option value="amount">บาท</option>
                  <option value="percent">%</option>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="lg:hidden" htmlFor={`${category.id}-value`}>
                  ค่าที่กรอก
                </Label>
                <InlineCalculatorInput
                  id={`${category.id}-value`}
                  min={0}
                  onValueChange={(value) =>
                    updateAllocationValue(category, value, category.mode)
                  }
                  value={
                    category.mode === "amount"
                      ? roundInput(category.amount)
                      : roundInput(category.percent)
                  }
                />
              </div>

              <div className="text-sm font-medium text-[var(--foreground)]">
                <span className="mr-2 text-xs text-[var(--muted-foreground)] lg:hidden">
                  บาท
                </span>
                {formatCurrency(category.amount)}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                <span className="mr-2 text-xs text-[var(--muted-foreground)] lg:hidden">
                  %
                </span>
                {formatPercent(category.percent)}
              </div>

              <div className="flex items-center justify-between gap-2 lg:justify-end">
                <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <Switch
                    checked={Boolean(category.locked)}
                    onChange={(event) =>
                      updateAllocation(category.id, { locked: event.target.checked })
                    }
                  />
                  Lock
                </label>
                <Button
                  aria-label={`ลบ ${category.name}`}
                  onClick={() => removeAllocation(category.id)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4 text-[var(--destructive)]" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <BulkPasteDialog
          netIncome={netIncome}
          onApply={applyBulkAllocations}
          onOpenChange={setBulkPasteOpen}
          open={bulkPasteOpen}
        />
      </CardContent>
    </Card>
  );
}

function roundInput(value: number) {
  return Number(value.toFixed(2));
}
