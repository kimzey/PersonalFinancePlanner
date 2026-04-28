"use client";

import { Plus, Target, Trash2 } from "lucide-react";
import { useMemo } from "react";
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
import { evaluateGoal } from "@/lib/goals";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { FinancialGoal } from "@/types/finance";

type FinancialGoalsProps = {
  goals: FinancialGoal[];
  onGoalsChange: (goals: FinancialGoal[]) => void;
};

export function FinancialGoals({ goals, onGoalsChange }: FinancialGoalsProps) {
  const evaluatedGoals = useMemo(
    () => goals.map((goal) => ({ goal, progress: evaluateGoal(goal) })),
    [goals],
  );

  function addGoal() {
    onGoalsChange([
      ...goals,
      {
        id: `goal-${Date.now()}`,
        name: `Goal ${goals.length + 1}`,
        targetAmount: 100_000,
        currentAmount: 0,
        monthlySaving: 5_000,
        targetDate: getDefaultTargetDate(),
      },
    ]);
  }

  function updateGoal(goalId: string, patch: Partial<FinancialGoal>) {
    onGoalsChange(goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal)));
  }

  function removeGoal(goalId: string) {
    onGoalsChange(goals.filter((goal) => goal.id !== goalId));
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Financial Goals</CardTitle>
            <CardDescription>
              ตั้งเป้าหมายเงินก้อนแล้วดูเงินออมต่อเดือนที่ต้องใช้
            </CardDescription>
          </div>
          <Badge className="w-fit bg-[var(--success-soft)] text-[var(--success-soft-foreground)]">
            <Target className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {goals.length} goals
          </Badge>
        </div>
        <Button onClick={addGoal} size="sm" type="button" variant="outline">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add goal
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {goals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
            ยังไม่มี goal กด Add goal เพื่อเริ่มวางแผนเงินก้อน
          </div>
        ) : null}

        {evaluatedGoals.map(({ goal, progress }) => (
          <div className="grid gap-4 rounded-lg border border-[var(--border)] p-4" key={goal.id}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  id={`${goal.id}-name`}
                  label="ชื่อ goal"
                  onChange={(value) => updateGoal(goal.id, { name: value })}
                  value={goal.name}
                />
                <NumberField
                  id={`${goal.id}-target`}
                  label="เป้าหมาย"
                  onChange={(value) => updateGoal(goal.id, { targetAmount: value })}
                  value={goal.targetAmount}
                />
                <NumberField
                  id={`${goal.id}-current`}
                  label="เงินปัจจุบัน"
                  onChange={(value) => updateGoal(goal.id, { currentAmount: value })}
                  value={goal.currentAmount}
                />
                <div className="grid gap-2">
                  <Label htmlFor={`${goal.id}-date`}>Target date</Label>
                  <Input
                    id={`${goal.id}-date`}
                    onChange={(event) => updateGoal(goal.id, { targetDate: event.target.value })}
                    type="date"
                    value={goal.targetDate ?? ""}
                  />
                </div>
              </div>
              <Button
                aria-label={`Remove ${goal.name}`}
                onClick={() => removeGoal(goal.id)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="ต้องออมต่อเดือน" value={formatCurrency(progress.requiredMonthlySaving)} />
              <Metric label="ขาดอีก" value={formatCurrency(progress.remainingAmount)} />
              <Metric
                label="เวลาที่เหลือ"
                value={
                  progress.monthsToTarget === null
                    ? "-"
                    : `${formatNumber(progress.monthsToTarget)} เดือน`
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-[var(--muted-foreground)]">
                  {formatNumber(progress.progressPercent)}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Field({
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
  value,
}: {
  id: string;
  label: string;
  onChange: (value: number) => void;
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

function getDefaultTargetDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}
