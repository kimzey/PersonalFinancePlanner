"use client";

import { Landmark, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { createDebtPlanSummary, type DebtStrategy } from "@/lib/debt";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DebtItem } from "@/types/finance";

type DebtPlannerProps = {
  debts: DebtItem[];
  onDebtsChange: (debts: DebtItem[]) => void;
};

export function DebtPlanner({ debts, onDebtsChange }: DebtPlannerProps) {
  const [strategy, setStrategy] = useState<DebtStrategy>("avalanche");
  const summary = useMemo(() => createDebtPlanSummary(debts, strategy), [debts, strategy]);

  function addDebt() {
    onDebtsChange([
      ...debts,
      {
        id: `debt-${Date.now()}`,
        name: `Debt ${debts.length + 1}`,
        balance: 50_000,
        annualInterestPercent: 12,
        minimumPayment: 2_000,
      },
    ]);
  }

  function updateDebt(debtId: string, patch: Partial<DebtItem>) {
    onDebtsChange(debts.map((debt) => (debt.id === debtId ? { ...debt, ...patch } : debt)));
  }

  function removeDebt(debtId: string) {
    onDebtsChange(debts.filter((debt) => debt.id !== debtId));
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Debt Planner</CardTitle>
            <CardDescription>
              ประเมินเดือนปิดหนี้และเทียบลำดับ avalanche กับ snowball
            </CardDescription>
          </div>
          <Badge className="w-fit bg-[var(--muted)] text-[var(--foreground)]">
            <Landmark className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {formatCurrency(summary.totalBalance)}
          </Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="grid gap-2 sm:w-56">
            <Label htmlFor="debt-strategy">Strategy</Label>
            <Select
              id="debt-strategy"
              onChange={(event) => setStrategy(event.target.value as DebtStrategy)}
              value={strategy}
            >
              <option value="avalanche">Avalanche ดอกสูงก่อน</option>
              <option value="snowball">Snowball ยอดเล็กก่อน</option>
            </Select>
          </div>
          <Button onClick={addDebt} size="sm" type="button" variant="outline">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add debt
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="หนี้รวม" value={formatCurrency(summary.totalBalance)} />
          <Metric label="ขั้นต่ำรวม" value={formatCurrency(summary.minimumPaymentTotal)} />
          <Metric
            label="หมดหนี้ประมาณ"
            value={
              summary.monthsToDebtFree === null
                ? "ยังคำนวณไม่ได้"
                : `${formatNumber(summary.monthsToDebtFree)} เดือน`
            }
          />
        </div>

        {debts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
            ยังไม่มีหนี้ กด Add debt เพื่อเริ่มคำนวณ payoff estimate
          </div>
        ) : null}

        {debts.map((debt) => (
          <div className="grid gap-4 rounded-lg border border-[var(--border)] p-4" key={debt.id}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TextField
                  id={`${debt.id}-name`}
                  label="ชื่อหนี้"
                  onChange={(value) => updateDebt(debt.id, { name: value })}
                  value={debt.name}
                />
                <NumberField
                  id={`${debt.id}-balance`}
                  label="ยอดคงเหลือ"
                  onChange={(value) => updateDebt(debt.id, { balance: value })}
                  value={debt.balance}
                />
                <NumberField
                  id={`${debt.id}-interest`}
                  label="ดอกต่อปี (%)"
                  onChange={(value) => updateDebt(debt.id, { annualInterestPercent: value })}
                  step={0.1}
                  value={debt.annualInterestPercent}
                />
                <NumberField
                  id={`${debt.id}-payment`}
                  label="ขั้นต่ำต่อเดือน"
                  onChange={(value) => updateDebt(debt.id, { minimumPayment: value })}
                  value={debt.minimumPayment}
                />
              </div>
              <Button
                aria-label={`Remove ${debt.name}`}
                onClick={() => removeDebt(debt.id)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}

        {summary.payoffOrder.length > 0 ? (
          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="text-sm font-semibold">Payoff order</div>
            <div className="mt-3 grid gap-2">
              {summary.payoffOrder.map((estimate, index) => (
                <div
                  className="flex flex-col gap-1 rounded-md bg-[var(--muted)] p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  key={estimate.debtId}
                >
                  <span className="font-medium">
                    {index + 1}. {estimate.name}
                  </span>
                  <span className="text-[var(--muted-foreground)]">
                    {estimate.monthsToPayoff === null
                      ? "ยอดจ่ายยังไม่พอปิดเงินต้น"
                      : `${formatNumber(estimate.monthsToPayoff)} เดือน, ดอก ${formatCurrency(
                          estimate.totalInterest,
                        )}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TextField({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} onChange={(event) => onChange(event.target.value)} value={value} />
    </div>
  );
}

function NumberField({
  id,
  label,
  onChange,
  step = 1,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={Number(value.toFixed(2))}
      />
    </div>
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
