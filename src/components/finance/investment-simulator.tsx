"use client";

import { Plus, Trash2, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { NumberInput } from "@/components/ui/number-input";
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
  calculateDividendIncomePlan,
  calculateScheduledDcaFutureValue,
  calculateScheduledTotalContribution,
  calculateScheduledYearlyInvestmentProjection,
  normalizeContributionSteps,
} from "@/lib/finance";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type {
  InvestmentContributionStep,
  InvestmentProjectionPoint,
  InvestmentScenario,
} from "@/types/finance";

type InvestmentSimulatorProps = {
  initialScenario: InvestmentScenario;
  onScenarioChange?: (scenario: InvestmentScenario) => void;
};

type ProjectionTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: InvestmentProjectionPoint;
  }>;
};

const yearPresets = [1, 5, 10, 15, 20, 30];
const sensitivityReturns = [4, 6, 8, 10, 12];

type DraftContributionStep = {
  id: string;
  startMonth: string;
  monthlyContribution: string;
};

export function InvestmentSimulator({
  initialScenario,
  onScenarioChange,
}: InvestmentSimulatorProps) {
  const [initialAmount, setInitialAmount] = useState(initialScenario.initialAmount);
  const [monthlyContribution, setMonthlyContribution] = useState(
    initialScenario.monthlyContribution,
  );
  const [contributionSteps, setContributionSteps] = useState(
    normalizeContributionSteps(
      initialScenario.contributionSteps,
      initialScenario.monthlyContribution,
    ),
  );
  const [annualReturnPercent, setAnnualReturnPercent] = useState(
    initialScenario.annualReturnPercent,
  );
  const [years, setYears] = useState(initialScenario.years);
  const [annualDividendYieldPercent, setAnnualDividendYieldPercent] = useState(4);
  const [withholdingTaxPercent, setWithholdingTaxPercent] = useState(10);

  const safeInitialAmount = Math.max(0, initialAmount);
  const safeContributionSteps = normalizeContributionSteps(
    contributionSteps,
    monthlyContribution,
  );
  const safeMonthlyContribution = safeContributionSteps[0].monthlyContribution;
  const safeAnnualReturnPercent = Math.max(0, annualReturnPercent);
  const safeYears = Math.max(1, years);

  const projection = calculateScheduledYearlyInvestmentProjection(
    safeInitialAmount,
    safeContributionSteps,
    safeAnnualReturnPercent,
    safeYears,
  );
  const futureValue = calculateScheduledDcaFutureValue(
    safeInitialAmount,
    safeContributionSteps,
    safeAnnualReturnPercent,
    safeYears,
  );
  const totalContribution = calculateScheduledTotalContribution(
    safeInitialAmount,
    safeContributionSteps,
    safeYears,
  );
  const estimatedGain = futureValue - totalContribution;
  const finalMonthlyContribution = getMonthlyContributionForFinalMonth(
    safeContributionSteps,
    safeYears,
  );
  const dividendPlan = calculateDividendIncomePlan({
    portfolioValue: futureValue,
    annualDividendYieldPercent,
    withholdingTaxPercent,
  });

  function resetScenario() {
    setInitialAmount(initialScenario.initialAmount);
    setMonthlyContribution(initialScenario.monthlyContribution);
    setContributionSteps(
      normalizeContributionSteps(
        initialScenario.contributionSteps,
        initialScenario.monthlyContribution,
      ),
    );
    setAnnualReturnPercent(initialScenario.annualReturnPercent);
    setYears(initialScenario.years);
    onScenarioChange?.(initialScenario);
  }

  function updateScenario(patch: Partial<InvestmentScenario>) {
    const nextScenario = {
      ...initialScenario,
      initialAmount: safeInitialAmount,
      monthlyContribution: safeMonthlyContribution,
      contributionSteps: safeContributionSteps,
      annualReturnPercent: safeAnnualReturnPercent,
      years: safeYears,
      ...patch,
    };

    onScenarioChange?.(nextScenario);
  }

  function updateContributionSchedule(nextSteps: InvestmentContributionStep[]) {
    const normalizedSteps = normalizeContributionSteps(nextSteps, safeMonthlyContribution);
    setContributionSteps(normalizedSteps);
    setMonthlyContribution(normalizedSteps[0].monthlyContribution);
    updateScenario({
      monthlyContribution: normalizedSteps[0].monthlyContribution,
      contributionSteps: normalizedSteps,
    });
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
              <NumberInput
                id="initial-amount"
                min={0}
                onValueChange={(nextValue) => {
                  setInitialAmount(nextValue);
                  updateScenario({ initialAmount: Math.max(0, nextValue) });
                }}
                value={safeInitialAmount}
              />
            </div>

            <ContributionScheduleEditor
              contributionSteps={safeContributionSteps}
              onContributionStepsChange={updateContributionSchedule}
            />

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="annual-return">ผลตอบแทนเฉลี่ยต่อปี</Label>
                <span className="text-sm font-medium">
                  {formatPercent(safeAnnualReturnPercent, 1)}
                </span>
              </div>
              <Slider
                id="annual-return"
                max={100}
                min={0}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setAnnualReturnPercent(nextValue);
                  updateScenario({ annualReturnPercent: Math.max(0, nextValue) });
                }}
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
                    onClick={() => {
                      setYears(preset);
                      updateScenario({ years: preset });
                    }}
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
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
              DCA เริ่มต้น {formatCurrency(safeMonthlyContribution)} / เดือน และปลายแผนเป็น{" "}
              {formatCurrency(finalMonthlyContribution)} / เดือน
            </div>
            <ContributionScheduleSummary
              contributionSteps={safeContributionSteps}
              years={safeYears}
            />

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

        <DividendIncomePlanner
          dividendPlan={dividendPlan}
          finalMonthlyContribution={finalMonthlyContribution}
          onAnnualDividendYieldPercentChange={setAnnualDividendYieldPercent}
          onWithholdingTaxPercentChange={setWithholdingTaxPercent}
        />

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
              contributionSteps={safeContributionSteps}
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

function DividendIncomePlanner({
  dividendPlan,
  finalMonthlyContribution,
  onAnnualDividendYieldPercentChange,
  onWithholdingTaxPercentChange,
}: {
  dividendPlan: ReturnType<typeof calculateDividendIncomePlan>;
  finalMonthlyContribution: number;
  onAnnualDividendYieldPercentChange: (value: number) => void;
  onWithholdingTaxPercentChange: (value: number) => void;
}) {
  const coveragePercent =
    finalMonthlyContribution > 0
      ? (dividendPlan.netMonthlyDividend / finalMonthlyContribution) * 100
      : 0;

  return (
    <section className="grid gap-4 rounded-lg border border-[var(--border)] p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">Dividend income after DCA</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          ใช้มูลค่าอนาคตปลายแผนเป็นเงินต้น แล้วจำลองเปลี่ยนเป็นพอร์ตปันผล
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.65fr)_1fr]">
        <div className="grid gap-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="dividend-yield">Dividend yield ต่อปี</Label>
              <span className="text-sm font-medium">
                {formatPercent(dividendPlan.annualDividendYieldPercent, 1)}
              </span>
            </div>
            <Slider
              id="dividend-yield"
              max={100}
              min={0}
              onChange={(event) =>
                onAnnualDividendYieldPercentChange(
                  Math.min(100, Math.max(0, Number(event.target.value))),
                )
              }
              step={0.25}
              value={dividendPlan.annualDividendYieldPercent}
            />
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="withholding-tax">ภาษีหัก ณ ที่จ่าย</Label>
              <span className="text-sm font-medium">
                {formatPercent(dividendPlan.withholdingTaxPercent, 1)}
              </span>
            </div>
            <Slider
              id="withholding-tax"
              max={100}
              min={0}
              onChange={(event) =>
                onWithholdingTaxPercentChange(
                  Math.min(100, Math.max(0, Number(event.target.value))),
                )
              }
              step={0.5}
              value={dividendPlan.withholdingTaxPercent}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="ปันผล/เดือน หลังภาษี"
            value={formatCurrency(dividendPlan.netMonthlyDividend)}
          />
          <MetricCard
            label="ปันผล/เดือน ก่อนภาษี"
            value={formatCurrency(dividendPlan.grossMonthlyDividend)}
          />
          <MetricCard
            label="ปันผล/ปี หลังภาษี"
            value={formatCurrency(dividendPlan.netAnnualDividend)}
          />
          <MetricCard
            label="เทียบ DCA เดือนท้าย"
            value={`${formatNumber(coveragePercent)}%`}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
        พอร์ตปลายแผน {formatCurrency(dividendPlan.portfolioValue)} ที่ yield{" "}
        {formatPercent(dividendPlan.annualDividendYieldPercent, 1)} จะให้ปันผลหลังภาษีประมาณ{" "}
        {formatCurrency(dividendPlan.netMonthlyDividend)} ต่อเดือน
      </div>
    </section>
  );
}

function ContributionScheduleEditor({
  contributionSteps,
  onContributionStepsChange,
}: {
  contributionSteps: InvestmentContributionStep[];
  onContributionStepsChange: (steps: InvestmentContributionStep[]) => void;
}) {
  const [draftSteps, setDraftSteps] = useState(() => toDraftContributionSteps(contributionSteps));
  const latestDraftSteps = useRef(draftSteps);
  const latestContributionSteps = useRef(contributionSteps);
  const contributionSignature = useMemo(
    () =>
      contributionSteps
        .map((step) => `${step.id}:${step.startMonth}:${step.monthlyContribution}`)
        .join("|"),
    [contributionSteps],
  );

  useEffect(() => {
    latestContributionSteps.current = contributionSteps;
  }, [contributionSteps]);

  useEffect(() => {
    latestDraftSteps.current = draftSteps;
  }, [draftSteps]);

  useEffect(() => {
    queueMicrotask(() => {
      const nextDraftSteps = toDraftContributionSteps(latestContributionSteps.current);
      latestDraftSteps.current = nextDraftSteps;
      setDraftSteps(nextDraftSteps);
    });
  }, [contributionSignature]);

  function commitDraftSteps(nextDraftSteps: DraftContributionStep[]) {
    onContributionStepsChange(
      toContributionSteps(nextDraftSteps, latestContributionSteps.current),
    );
  }

  function updateStep(
    stepId: string,
    patch: Partial<Pick<DraftContributionStep, "startMonth" | "monthlyContribution">>,
  ) {
    const nextDraftSteps = latestDraftSteps.current.map((step) =>
      step.id === stepId
        ? {
            ...step,
            ...patch,
          }
        : step,
    );

    latestDraftSteps.current = nextDraftSteps;
    setDraftSteps(nextDraftSteps);
    commitDraftSteps(nextDraftSteps);
  }

  function cleanUpDraftSteps() {
    const nextSteps = toContributionSteps(
      latestDraftSteps.current,
      latestContributionSteps.current,
    );
    const nextDraftSteps = toDraftContributionSteps(nextSteps);

    latestDraftSteps.current = nextDraftSteps;
    onContributionStepsChange(nextSteps);
    setDraftSteps(nextDraftSteps);
  }

  function addStep() {
    const lastStep = toContributionSteps(draftSteps, contributionSteps).at(-1);

    setDraftSteps((currentSteps) => [
      ...currentSteps,
      {
        id: createContributionStepId(),
        startMonth: String((lastStep?.startMonth ?? 1) + 60),
        monthlyContribution: "",
      },
    ]);
  }

  function removeStep(stepId: string) {
    if (draftSteps.length <= 1) return;

    const nextSteps = toContributionSteps(
      draftSteps.filter((step) => step.id !== stepId),
      contributionSteps,
    );
    setDraftSteps(toDraftContributionSteps(nextSteps));
    onContributionStepsChange(nextSteps);
  }

  return (
    <div className="grid gap-3">
      <div>
        <Label>DCA schedule</Label>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          กำหนดยอดลงทุนรายเดือนตามช่วงเวลา เช่นเดือนที่ 61 คือหลังครบ 5 ปี
          ถ้ายอดเท่าช่วงก่อนหน้า แถวนั้นจะไม่มีผลและระบบจะรวมช่วงให้อัตโนมัติ
        </p>
      </div>

      <div className="grid gap-2">
        {draftSteps.map((step, index) => (
          <div
            className="grid gap-2 rounded-md border border-[var(--border)] p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            key={step.id}
          >
            <div className="grid gap-2">
              <Label htmlFor={`contribution-start-${step.id}`}>
                {index === 0 ? "เริ่มเดือน" : "เปลี่ยนตั้งแต่เดือน"}
              </Label>
              <Input
                disabled={index === 0}
                id={`contribution-start-${step.id}`}
                inputMode="numeric"
                min={1}
                onChange={(event) =>
                  updateStep(step.id, { startMonth: event.target.value })
                }
                onBlur={cleanUpDraftSteps}
                type="text"
                value={step.startMonth}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`contribution-amount-${step.id}`}>DCA / เดือน</Label>
              <Input
                id={`contribution-amount-${step.id}`}
                inputMode="decimal"
                min={0}
                onChange={(event) =>
                  updateStep(step.id, {
                    monthlyContribution: event.target.value,
                  })
                }
                onBlur={cleanUpDraftSteps}
                type="text"
                value={step.monthlyContribution}
              />
            </div>
            <Button
              disabled={draftSteps.length <= 1}
              onClick={() => removeStep(step.id)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Remove DCA step</span>
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button onClick={addStep} type="button" variant="outline">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add DCA step
        </Button>
        <Button onClick={cleanUpDraftSteps} type="button" variant="secondary">
          Clean up schedule
        </Button>
      </div>
    </div>
  );
}

function ContributionScheduleSummary({
  contributionSteps,
  years,
}: {
  contributionSteps: InvestmentContributionStep[];
  years: number;
}) {
  const segments = getContributionSegments(contributionSteps, years);

  return (
    <div className="rounded-lg border border-[var(--border)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ช่วงเดือน</TableHead>
            <TableHead>DCA/เดือน</TableHead>
            <TableHead>จำนวนเดือน</TableHead>
            <TableHead>เงินต้นช่วงนี้</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {segments.map((segment) => (
            <TableRow key={`${segment.startMonth}-${segment.endMonth}`}>
              <TableCell>
                {segment.startMonth}-{segment.endMonth}
              </TableCell>
              <TableCell>{formatCurrency(segment.monthlyContribution)}</TableCell>
              <TableCell>{formatNumber(segment.months)}</TableCell>
              <TableCell>{formatCurrency(segment.totalContribution)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
  contributionSteps,
  years,
}: {
  initialAmount: number;
  contributionSteps: InvestmentContributionStep[];
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
            const futureValue = calculateScheduledDcaFutureValue(
              initialAmount,
              contributionSteps,
              returnPercent,
              years,
            );
            const totalContribution = calculateScheduledTotalContribution(
              initialAmount,
              contributionSteps,
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

function getMonthlyContributionForFinalMonth(
  contributionSteps: InvestmentContributionStep[],
  years: number,
) {
  const finalMonth = Math.max(1, Math.round(years * 12));
  return contributionSteps.reduce(
    (currentContribution, step) =>
      step.startMonth <= finalMonth ? step.monthlyContribution : currentContribution,
    contributionSteps[0]?.monthlyContribution ?? 0,
  );
}

function createContributionStepId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `contribution-step-${crypto.randomUUID()}`;
  }

  return `contribution-step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDraftContributionSteps(
  contributionSteps: InvestmentContributionStep[],
): DraftContributionStep[] {
  return contributionSteps.map((step) => ({
    id: step.id,
    startMonth: String(step.startMonth),
    monthlyContribution: String(roundInput(step.monthlyContribution)),
  }));
}

function toContributionSteps(
  draftSteps: DraftContributionStep[],
  previousSteps: InvestmentContributionStep[],
): InvestmentContributionStep[] {
  return draftSteps.map((step, index) => {
    const previousStep = previousSteps.find((previous) => previous.id === step.id);
    const parsedStartMonth = Number(step.startMonth);
    const parsedMonthlyContribution = Number(step.monthlyContribution);

    return {
      id: step.id,
      startMonth:
        index === 0
          ? 1
          : Number.isFinite(parsedStartMonth) && parsedStartMonth > 0
            ? Math.round(parsedStartMonth)
            : previousStep?.startMonth ?? 1,
      monthlyContribution:
        Number.isFinite(parsedMonthlyContribution) && parsedMonthlyContribution >= 0
          ? parsedMonthlyContribution
          : previousStep?.monthlyContribution ?? 0,
    };
  });
}

function getContributionSegments(
  contributionSteps: InvestmentContributionStep[],
  years: number,
) {
  const finalMonth = Math.max(1, Math.round(years * 12));

  return contributionSteps
    .map((step, index) => {
      const nextStep = contributionSteps[index + 1];
      const startMonth = Math.min(step.startMonth, finalMonth);
      const endMonth = Math.min((nextStep?.startMonth ?? finalMonth + 1) - 1, finalMonth);
      const months = Math.max(0, endMonth - startMonth + 1);

      return {
        startMonth,
        endMonth,
        months,
        monthlyContribution: step.monthlyContribution,
        totalContribution: months * step.monthlyContribution,
      };
    })
    .filter((segment) => segment.months > 0);
}
