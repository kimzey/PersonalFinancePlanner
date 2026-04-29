"use client";

import { ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { calculateEmergencyFundPlan } from "@/lib/finance";
import { formatCurrency, formatNumber } from "@/lib/format";

type EmergencyFundPlannerProps = {
  monthlyEssentialExpense: number;
  monthlySaving: number;
};

const targetMonthOptions = [3, 6, 12];

export function EmergencyFundPlanner({
  monthlyEssentialExpense,
  monthlySaving,
}: EmergencyFundPlannerProps) {
  const [currentAmount, setCurrentAmount] = useState(0);
  const [targetMonths, setTargetMonths] = useState(6);

  const plan = useMemo(
    () =>
      calculateEmergencyFundPlan({
        currentAmount,
        monthlyEssentialExpense,
        monthlySaving,
        targetMonths,
      }),
    [currentAmount, monthlyEssentialExpense, monthlySaving, targetMonths],
  );
  const progressWidth = `${plan.progressPercent}%`;
  const monthText =
    plan.monthsToTarget === null
      ? "ยังคำนวณไม่ได้"
      : plan.monthsToTarget === 0
        ? "ถึงเป้าแล้ว"
        : `${formatNumber(plan.monthsToTarget)} เดือน`;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Emergency Fund Planner</CardTitle>
            <CardDescription>
              คำนวณเงินสำรองจากค่าใช้จ่ายจำเป็นและเงินออมรายเดือน
            </CardDescription>
          </div>
          <Badge className="w-fit bg-[var(--success-soft)] text-[var(--success-soft-foreground)]">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {targetMonths} เดือน
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid min-w-0 gap-4 min-[1150px]:grid-cols-[minmax(16rem,0.75fr)_minmax(0,1.25fr)]">
          <div className="grid min-w-0 gap-4 rounded-lg border border-[var(--border)] p-4">
            <div className="grid gap-2">
              <Label htmlFor="current-emergency-fund">เงินฉุกเฉินปัจจุบัน</Label>
              <NumberInput
                id="current-emergency-fund"
                min={0}
                onValueChange={setCurrentAmount}
                value={plan.currentAmount}
              />
            </div>

            <div className="grid gap-2">
              <Label>เป้าหมาย</Label>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,6.5rem),1fr))] gap-2">
                {targetMonthOptions.map((option) => (
                  <Button
                    key={option}
                    onClick={() => setTargetMonths(option)}
                    size="sm"
                    type="button"
                    variant={targetMonths === option ? "default" : "outline"}
                  >
                    {option} เดือน
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-4">
            <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
              <Metric label="ค่าใช้จ่ายจำเป็น" value={formatCurrency(plan.monthlyEssentialExpense)} />
              <Metric label="เป้าหมายเงินฉุกเฉิน" value={formatCurrency(plan.targetAmount)} />
              <Metric label="เวลาถึงเป้า" value={monthText} />
            </div>

            <div className="min-w-0 rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">ความคืบหน้า</span>
                <span className="text-[var(--muted-foreground)]">
                  {formatNumber(plan.progressPercent)}%
                </span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all"
                  style={{ width: progressWidth }}
                />
              </div>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                ยังขาด {formatCurrency(plan.remainingAmount)} โดยอิงจากเงินออมรายเดือน{" "}
                {formatCurrency(plan.monthlySaving)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-2 text-lg font-semibold leading-snug text-[var(--foreground)] sm:text-xl">
        {value}
      </div>
    </div>
  );
}
