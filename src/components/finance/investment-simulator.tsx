"use client";

import { TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScenarioComparisonTable } from "@/components/finance/scenario-comparison-table";
import {
  calculateDcaFutureValue,
  calculateTotalContribution,
  calculateYearlyInvestmentProjection,
} from "@/lib/finance";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { InvestmentProjectionPoint, InvestmentScenario } from "@/types/finance";

type InvestmentSimulatorProps = {
  initialScenario: InvestmentScenario;
};

type ProjectionTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: InvestmentProjectionPoint;
  }>;
};

const yearPresets = [1, 5, 10, 15, 20, 30];
const sensitivityReturns = [4, 6, 8, 10, 12];

export function InvestmentSimulator({ initialScenario }: InvestmentSimulatorProps) {
  const [initialAmount, setInitialAmount] = useState(initialScenario.initialAmount);
  const [monthlyContribution, setMonthlyContribution] = useState(
    initialScenario.monthlyContribution,
  );
  const [annualReturnPercent, setAnnualReturnPercent] = useState(
    initialScenario.annualReturnPercent,
  );
  const [years, setYears] = useState(initialScenario.years);

  const safeInitialAmount = Math.max(0, initialAmount);
  const safeMonthlyContribution = Math.max(0, monthlyContribution);
  const safeAnnualReturnPercent = Math.max(0, annualReturnPercent);
  const safeYears = Math.max(1, years);

  const projection = calculateYearlyInvestmentProjection(
    safeInitialAmount,
    safeMonthlyContribution,
    safeAnnualReturnPercent,
    safeYears,
  );
  const futureValue = calculateDcaFutureValue(
    safeInitialAmount,
    safeMonthlyContribution,
    safeAnnualReturnPercent,
    safeYears,
  );
  const totalContribution = calculateTotalContribution(
    safeInitialAmount,
    safeMonthlyContribution,
    safeYears,
  );
  const estimatedGain = futureValue - totalContribution;

  function resetScenario() {
    setInitialAmount(initialScenario.initialAmount);
    setMonthlyContribution(initialScenario.monthlyContribution);
    setAnnualReturnPercent(initialScenario.annualReturnPercent);
    setYears(initialScenario.years);
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Investment Simulator</CardTitle>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              จำลองเงินลงทุนก้อนแรกและ DCA รายเดือนตามผลตอบแทนเฉลี่ย
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-[var(--muted)] px-3 py-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
            {formatPercent(safeAnnualReturnPercent, 1)} ต่อปี
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(18rem,0.85fr)_1.15fr]">
          <div className="grid gap-4 rounded-lg border border-[var(--border)] p-4">
            <div className="grid gap-2">
              <Label htmlFor="initial-amount">เงินตั้งต้น</Label>
              <Input
                id="initial-amount"
                inputMode="decimal"
                min={0}
                onChange={(event) => setInitialAmount(Number(event.target.value))}
                type="number"
                value={roundInput(safeInitialAmount)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="monthly-contribution">DCA รายเดือน</Label>
              <Input
                id="monthly-contribution"
                inputMode="decimal"
                min={0}
                onChange={(event) => setMonthlyContribution(Number(event.target.value))}
                type="number"
                value={roundInput(safeMonthlyContribution)}
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="annual-return">ผลตอบแทนเฉลี่ยต่อปี</Label>
                <span className="text-sm font-medium">
                  {formatPercent(safeAnnualReturnPercent, 1)}
                </span>
              </div>
              <Slider
                id="annual-return"
                max={20}
                min={0}
                onChange={(event) => setAnnualReturnPercent(Number(event.target.value))}
                step={0.5}
                value={safeAnnualReturnPercent}
              />
            </div>

            <div className="grid gap-2">
              <Label>ระยะเวลา</Label>
              <div className="grid grid-cols-3 gap-2">
                {yearPresets.map((preset) => (
                  <Button
                    key={preset}
                    onClick={() => setYears(preset)}
                    size="sm"
                    type="button"
                    variant={safeYears === preset ? "default" : "outline"}
                  >
                    {preset} ปี
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={resetScenario} type="button" variant="secondary">
              Reset Scenario
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="มูลค่าอนาคต" value={formatCurrency(futureValue)} />
              <MetricCard label="เงินต้นรวม" value={formatCurrency(totalContribution)} />
              <MetricCard label="กำไรคาดการณ์" value={formatCurrency(estimatedGain)} />
            </div>

            <div className="h-80 rounded-lg border border-[var(--border)] p-3">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={projection} margin={{ bottom: 8, left: 8, right: 18, top: 8 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    tickFormatter={(value) => `${value}y`}
                    tickLine={false}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    tickFormatter={(value) => `${formatNumber(Number(value) / 1_000_000)}M`}
                    tickLine={false}
                    width={56}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip content={<ProjectionTooltip />} />
                  <Line
                    activeDot={{ r: 5 }}
                    dataKey="futureValue"
                    dot={false}
                    name="มูลค่าอนาคต"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    type="monotone"
                  />
                  <Line
                    dataKey="totalContribution"
                    dot={false}
                    name="เงินต้นรวม"
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="grid gap-3">
            <div>
              <h3 className="text-base font-semibold">เปรียบเทียบ DCA</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                ใช้เงินตั้งต้นและผลตอบแทนเดียวกับ scenario ปัจจุบัน
              </p>
            </div>
            <ScenarioComparisonTable
              annualReturnPercent={safeAnnualReturnPercent}
              initialAmount={safeInitialAmount}
              years={safeYears}
            />
          </section>

          <section className="grid gap-3">
            <div>
              <h3 className="text-base font-semibold">Sensitivity ตามผลตอบแทน</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                เทียบผลลัพธ์จาก DCA รายเดือนปัจจุบัน
              </p>
            </div>
            <SensitivityTable
              initialAmount={safeInitialAmount}
              monthlyContribution={safeMonthlyContribution}
              years={safeYears}
            />
          </section>
        </div>

        <Alert>
          <AlertTitle>หมายเหตุการจำลอง</AlertTitle>
          <AlertDescription>
            ผลลัพธ์เป็นการคำนวณจากสมมติฐานผลตอบแทนเฉลี่ย ไม่ใช่คำแนะนำการลงทุน
            และผลตอบแทนจริงอาจผันผวนหรือขาดทุนได้
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-2 text-xl font-semibold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function SensitivityTable({
  initialAmount,
  monthlyContribution,
  years,
}: {
  initialAmount: number;
  monthlyContribution: number;
  years: number;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Return</TableHead>
            <TableHead>มูลค่าอนาคต</TableHead>
            <TableHead>กำไรคาดการณ์</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sensitivityReturns.map((returnPercent) => {
            const futureValue = calculateDcaFutureValue(
              initialAmount,
              monthlyContribution,
              returnPercent,
              years,
            );
            const totalContribution = calculateTotalContribution(
              initialAmount,
              monthlyContribution,
              years,
            );

            return (
              <TableRow key={returnPercent}>
                <TableCell className="font-medium">
                  {formatPercent(returnPercent, 0)}
                </TableCell>
                <TableCell>{formatCurrency(futureValue)}</TableCell>
                <TableCell>{formatCurrency(futureValue - totalContribution)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ProjectionTooltip({ active, payload }: ProjectionTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] shadow-lg">
      <div className="font-medium">ปีที่ {point.year}</div>
      <div className="mt-1 text-[var(--muted-foreground)]">
        มูลค่า {formatCurrency(point.futureValue)}
      </div>
      <div className="text-[var(--muted-foreground)]">
        เงินต้น {formatCurrency(point.totalContribution)}
      </div>
      <div className="text-[var(--muted-foreground)]">
        กำไร {formatCurrency(point.estimatedGain)}
      </div>
    </div>
  );
}

function roundInput(value: number) {
  return Number(value.toFixed(2));
}
