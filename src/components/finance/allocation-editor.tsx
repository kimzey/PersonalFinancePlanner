"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  ClipboardList,
  Lock,
  Plus,
  RotateCcw,
  Scale,
  Sparkles,
  Trash2,
  Unlock,
  WalletCards,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const remainingPercent = netIncome > 0 ? (remaining / netIncome) * 100 : 0;
  const usedPercent = Math.min(100, Math.max(0, totals.percent));

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
    <Card className="overflow-hidden">
      <CardHeader className="gap-5 border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--card)_0%,var(--muted)_100%)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
                <WalletCards className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Budget Planner</CardTitle>
                <CardDescription>
                  ปรับงบรายเดือนแบบเห็นภาพรวมทันที ใช้บาทหรือเปอร์เซ็นต์ได้ในแต่ละหมวด
                </CardDescription>
              </div>
            </div>
            <div className="grid gap-2 sm:max-w-sm">
              <Label htmlFor="net-income">Net Income</Label>
              <InlineCalculatorInput
                id="net-income"
                min={0}
                onValueChange={handleNetIncomeChange}
                value={netIncome}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
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
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Auto-balance
            </Button>
            <Button onClick={onReset} size="sm" type="button" variant="secondary">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--muted-foreground)]">จัดสรรไปแล้ว</span>
              <span className="font-semibold text-[var(--foreground)]">
                {formatPercent(totals.percent)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--card)] shadow-inner">
              <motion.div
                animate={{ width: `${usedPercent}%` }}
                className={`h-full rounded-full ${
                  isOverIncome ? "bg-[var(--destructive)]" : "bg-[var(--primary)]"
                }`}
                initial={false}
                transition={{ duration: 0.28, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <BudgetMetric label="รายได้" value={formatCurrency(netIncome)} />
            <BudgetMetric label="จัดสรร" value={formatCurrency(totals.amount)} />
            <BudgetMetric
              danger={isOverIncome}
              label={isOverIncome ? "เกินงบ" : "คงเหลือ"}
              value={formatCurrency(Math.abs(remaining))}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 p-5">
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

        <div className="flex flex-col gap-3">
          {allocations.map((category, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="grid min-w-0 gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-colors hover:border-[var(--primary)]/60 xl:grid-cols-[minmax(14rem,1.5fr)_8rem_10rem_minmax(9rem,0.9fr)_7rem_5rem] xl:items-center"
              initial={{ opacity: 0, y: 8 }}
              key={category.id}
              layout
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="grid gap-2">
                <Label className="xl:hidden" htmlFor={`${category.id}-name`}>
                  หมวดหมู่
                </Label>
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full shadow-sm ring-2 ring-[var(--card)]"
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
                <Label className="xl:hidden" htmlFor={`${category.id}-mode`}>
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
                <Label className="xl:hidden" htmlFor={`${category.id}-value`}>
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

              <div className="grid gap-1">
                <span className="text-xs text-[var(--muted-foreground)]">บาท</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {formatCurrency(category.amount)}
                </span>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">สัดส่วน</span>
                  <Badge className="bg-[var(--muted)] text-[var(--muted-foreground)]">
                    {formatPercent(category.percent)}
                  </Badge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                  <motion.div
                    animate={{ width: `${Math.min(100, Math.max(0, category.percent))}%` }}
                    className="h-full rounded-full"
                    initial={false}
                    style={{
                      backgroundColor:
                        category.color ?? fallbackColors[index % fallbackColors.length],
                    }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 xl:justify-end">
                <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <Switch
                    checked={Boolean(category.locked)}
                    onChange={(event) =>
                      updateAllocation(category.id, { locked: event.target.checked })
                    }
                  />
                  {category.locked ? (
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
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
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
          <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Auto-balance จะกระจายเงินที่เหลือให้หมวดที่ไม่ได้ล็อก โดยยังรักษาหมวดที่ล็อกไว้เหมือนเดิม
            {remainingPercent > 0 ? ` ตอนนี้เหลือ ${formatPercent(remainingPercent)}` : ""}
          </span>
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

function BudgetMetric({
  danger = false,
  label,
  value,
}: {
  danger?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
      <div
        className={`mt-1 text-sm font-semibold ${
          danger ? "text-[var(--destructive)]" : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function roundInput(value: number) {
  return Number(value.toFixed(2));
}
