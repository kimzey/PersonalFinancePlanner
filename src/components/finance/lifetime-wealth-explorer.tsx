"use client";

import {
  BarChart3,
  Brain,
  Briefcase,
  Plus,
  Sparkles,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput as UiNumberInput } from "@/components/ui/number-input";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type {
  AllocationCategory,
  LifetimeIncomePeriod,
  LifetimeLedger,
  LifetimeSpendingCategory,
} from "@/types/finance";

type LifetimeWealthExplorerProps = {
  allocations: AllocationCategory[];
  ledger: LifetimeLedger;
  netIncome: number;
  onLedgerChange: (ledger: LifetimeLedger) => void;
};

type SpendingPoint = LifetimeSpendingCategory & {
  percentOfEarned: number;
  value: number;
};

const fallbackColors = [
  "#0f766e",
  "#2563eb",
  "#dc2626",
  "#f59e0b",
  "#7c3aed",
  "#0891b2",
  "#16a34a",
  "#be123c",
];

export function LifetimeWealthExplorer({
  allocations,
  ledger,
  netIncome,
  onLedgerChange,
}: LifetimeWealthExplorerProps) {
  const summary = useMemo(() => calculateLifetimeSummary(ledger), [ledger]);
  const spendingData = summary.spendingCategories;
  const careerYears = Math.max(0, ledger.targetAge - ledger.currentAge);
  const annualBurnRate = careerYears > 0 ? summary.totalSpent / careerYears : summary.totalSpent;
  const biggestCategory = [...spendingData].sort((a, b) => b.amount - a.amount)[0];
  const savingsRate =
    summary.totalEarned > 0
      ? ((summary.totalEarned - summary.totalSpent) / summary.totalEarned) * 100
      : 0;
  const remainingPercent =
    summary.totalEarned > 0 ? (summary.remaining / summary.totalEarned) * 100 : 0;
  const unallocatedAmount = Math.max(0, summary.remaining);

  function updateLedger(patch: Partial<LifetimeLedger>) {
    onLedgerChange({ ...ledger, ...patch });
  }

  function updateIncomePeriod(id: string, patch: Partial<LifetimeIncomePeriod>) {
    updateLedger({
      incomePeriods: ledger.incomePeriods.map((period) =>
        period.id === id ? sanitizeIncomePeriod({ ...period, ...patch }) : period,
      ),
    });
  }

  function updateSpendingCategory(id: string, patch: Partial<LifetimeSpendingCategory>) {
    updateLedger({
      spendingCategories: ledger.spendingCategories.map((category) =>
        category.id === id
          ? {
              ...category,
              ...patch,
              amount:
                patch.amount === undefined
                  ? category.amount
                  : clampSpendingAmount(id, patch.amount),
            }
          : category,
      ),
    });
  }

  function updateSpendingCategoryPercent(id: string, percent: number) {
    updateSpendingCategory(id, {
      amount: summary.totalEarned > 0 ? (summary.totalEarned * percent) / 100 : 0,
    });
  }

  function clampSpendingAmount(categoryId: string, amount: number) {
    const otherCategoryTotal = ledger.spendingCategories
      .filter((category) => category.id !== categoryId)
      .reduce((sum, category) => sum + Math.max(0, category.amount), 0);
    const categoryLimit = Math.max(0, summary.totalEarned - otherCategoryTotal);

    return Math.min(Math.max(0, amount), categoryLimit);
  }

  function addIncomePeriod() {
    const lastPeriod = ledger.incomePeriods[ledger.incomePeriods.length - 1];
    const startAge = lastPeriod ? lastPeriod.endAge + 1 : ledger.currentAge;
    const nextPeriod: LifetimeIncomePeriod = {
      id: createLocalId("income"),
      label: `ช่วงรายได้ ${ledger.incomePeriods.length + 1}`,
      startAge,
      endAge: startAge + 4,
      monthlyIncome: netIncome,
      annualBonus: netIncome,
    };

    updateLedger({ incomePeriods: [...ledger.incomePeriods, nextPeriod] });
  }

  function addSpendingCategory() {
    const otherCategoryTotal = ledger.spendingCategories.reduce(
      (sum, category) => sum + Math.max(0, category.amount),
      0,
    );
    const availableAmount = Math.max(0, summary.totalEarned - otherCategoryTotal);
    const nextCategory: LifetimeSpendingCategory = {
      id: createLocalId("spending"),
      name: `หมวดใช้จ่าย ${ledger.spendingCategories.length + 1}`,
      amount: Math.min(Math.round(netIncome * 12), availableAmount),
      color: fallbackColors[ledger.spendingCategories.length % fallbackColors.length],
    };

    updateLedger({ spendingCategories: [...ledger.spendingCategories, nextCategory] });
  }

  function deleteIncomePeriod(id: string) {
    if (ledger.incomePeriods.length <= 1) return;
    updateLedger({
      incomePeriods: ledger.incomePeriods.filter((period) => period.id !== id),
    });
  }

  function deleteSpendingCategory(id: string) {
    if (ledger.spendingCategories.length <= 1) return;
    const nextCategories = ledger.spendingCategories.filter((category) => category.id !== id);
    updateLedger({ spendingCategories: nextCategories });
  }

  function syncBudgetToLifetime() {
    const projectedYears = Math.max(1, ledger.targetAge - ledger.currentAge);
    const nextCategories = allocations.map((allocation, index) => ({
      id: `budget-${allocation.id}`,
      name: allocation.name,
      amount: Math.round(Math.max(0, allocation.amount) * 12 * projectedYears),
      color: allocation.color || fallbackColors[index % fallbackColors.length],
      note: allocation.note,
    }));

    updateLedger({
      spendingCategories: nextCategories.length > 0 ? nextCategories : ledger.spendingCategories,
    });
  }

  return (
    <div className="grid min-w-0 gap-6">
      <section className="grid min-w-0 gap-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-6 xl:grid-cols-[minmax(15rem,0.75fr)_minmax(22rem,1.2fr)_minmax(15rem,0.75fr)] xl:items-center">
        <div className="grid gap-3">
          <Badge className="w-fit bg-[var(--success-soft)] text-[var(--success-soft-foreground)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Lifetime
          </Badge>
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              Life Money Map
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              รวมเงินที่หาได้ทั้งชีวิต แล้วเทียบว่าเงินออกไปกับหมวดไหนมากที่สุด
            </p>
          </div>
          <div className="grid gap-2">
            <NumberInput
              id="lifetime-current-age"
              label="อายุปัจจุบัน"
              onValueChange={(value) => updateLedger({ currentAge: Math.max(0, value) })}
              value={ledger.currentAge}
            />
            <NumberInput
              id="lifetime-target-age"
              label="ดูถึงอายุ"
              onValueChange={(value) =>
                updateLedger({ targetAge: Math.max(ledger.currentAge, value) })
              }
              value={ledger.targetAge}
            />
            <NumberInput
              id="lifetime-starting-assets"
              label="สินทรัพย์ตั้งต้น"
              onValueChange={(value) => updateLedger({ startingAssets: Math.max(0, value) })}
              value={ledger.startingAssets}
            />
          </div>
        </div>

        <div className="relative mx-auto grid aspect-square w-full max-w-[36rem] place-items-center">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                data={spendingData}
                dataKey="value"
                innerRadius="68%"
                nameKey="name"
                outerRadius="94%"
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={4}
              >
                {spendingData.map((category, index) => (
                  <Cell
                    fill={category.color || fallbackColors[index % fallbackColors.length]}
                    key={category.id}
                  />
                ))}
              </Pie>
              <Tooltip content={<SpendingTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-[22%] grid place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-center shadow-sm">
            <div className="grid gap-1 px-4">
              <div className="text-xs font-medium uppercase text-[var(--muted-foreground)]">
                เหลือสุทธิ
              </div>
              <div
                className={`text-2xl font-semibold leading-tight sm:text-3xl ${
                  summary.remaining < 0
                    ? "text-[var(--destructive)]"
                    : "text-[var(--foreground)]"
                }`}
              >
                {formatCurrency(summary.remaining)}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {formatPercent(remainingPercent)} ของเงินทั้งหมด
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <MetricCard
            icon={WalletCards}
            label="หาได้ทั้งหมด"
            value={formatCurrency(summary.totalEarned)}
            detail={`${formatNumber(ledger.incomePeriods.length)} ช่วงรายได้`}
          />
          <MetricCard
            icon={BarChart3}
            label="ใช้ไป/วางไว้"
            value={formatCurrency(summary.totalSpent)}
            detail={`${formatPercent(summary.spentPercent)} ของเงินทั้งหมด`}
          />
          <MetricCard
            icon={Sparkles}
            label="อัตราเหลือ"
            value={formatPercent(savingsRate)}
            detail={`เฉลี่ยใช้ ${formatCurrency(annualBurnRate)} ต่อปี`}
            tone={summary.remaining < 0 ? "danger" : "success"}
          />
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <Button onClick={addIncomePeriod} type="button">
              <Briefcase className="h-4 w-4" aria-hidden="true" />
              เพิ่มช่วงรายได้
            </Button>
            <Button onClick={addSpendingCategory} type="button" variant="secondary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              เพิ่มหมวดใช้จ่าย
            </Button>
            <Button onClick={syncBudgetToLifetime} type="button" variant="outline">
              <Brain className="h-4 w-4" aria-hidden="true" />
              เติมจาก Budget
            </Button>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>หมวดค่าใช้จ่ายสะสม</CardTitle>
            <CardDescription>
              กรอกจากสัดส่วนของเงินทั้งหมดหรือยอดเงินจริง ระบบจะไม่ให้รวมเกินเงินที่มี
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="w-fit bg-[var(--muted)] text-[var(--foreground)]">
              เหลือให้จัดสรร {formatCurrency(unallocatedAmount)}
            </Badge>
            <Button onClick={addSpendingCategory} size="sm" type="button">
              <Plus className="h-4 w-4" aria-hidden="true" />
              เพิ่มหมวด
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {ledger.spendingCategories.map((category, index) => {
            const percentOfEarned =
              summary.totalEarned > 0 ? (category.amount / summary.totalEarned) * 100 : 0;
            const categoryLimit = clampSpendingAmount(category.id, Number.POSITIVE_INFINITY);
            const percentLimit =
              summary.totalEarned > 0 ? (categoryLimit / summary.totalEarned) * 100 : 0;

            return (
              <section
                className="grid min-w-0 gap-3 rounded-lg border border-[var(--border)] p-4 xl:grid-cols-[minmax(12rem,1.2fr)_minmax(7rem,0.65fr)_minmax(9rem,0.8fr)_5rem_auto] xl:items-end"
                key={category.id}
              >
                <TextInput
                  id={`${category.id}-name`}
                  label="ชื่อหมวด"
                  onValueChange={(value) =>
                    updateSpendingCategory(category.id, { name: value })
                  }
                  value={category.name}
                />
                <NumberInput
                  id={`${category.id}-percent`}
                  label="% ของเงินทั้งหมด"
                  max={percentLimit}
                  onValueChange={(value) => updateSpendingCategoryPercent(category.id, value)}
                  precision={1}
                  value={percentOfEarned}
                />
                <NumberInput
                  id={`${category.id}-amount`}
                  label="ยอดรวม"
                  max={categoryLimit}
                  onValueChange={(value) =>
                    updateSpendingCategory(category.id, { amount: value })
                  }
                  value={category.amount}
                />
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor={`${category.id}-color`}>สี</Label>
                  <Input
                    className="h-10"
                    id={`${category.id}-color`}
                    onChange={(event) =>
                      updateSpendingCategory(category.id, {
                        color: event.target.value,
                      })
                    }
                    type="color"
                    value={category.color || fallbackColors[index % fallbackColors.length]}
                  />
                </div>
                <div className="flex items-center gap-3 xl:justify-end">
                  <div className="min-w-0 flex-1 xl:w-24 xl:flex-none">
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, percentOfEarned)}%`,
                          backgroundColor:
                            category.color || fallbackColors[index % fallbackColors.length],
                        }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      สูงสุด {formatPercent(percentLimit)}
                    </div>
                  </div>
                  <Button
                    aria-label={`ลบ ${category.name}`}
                    disabled={ledger.spendingCategories.length <= 1}
                    onClick={() => deleteSpendingCategory(category.id)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </section>
            );
          })}
        </CardContent>
      </Card>

      {biggestCategory ? (
        <Alert variant={summary.spentPercent > 100 ? "destructive" : "default"}>
          <AlertTitle>หมวดที่กินสัดส่วนสูงสุด</AlertTitle>
          <AlertDescription>
            {biggestCategory.name} ใช้ไป {formatPercent(biggestCategory.percentOfEarned)}
            ของเงินที่หาได้ทั้งหมด
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>ช่วงรายได้ชีวิต</CardTitle>
              <CardDescription>
                เพิ่มได้ไม่จำกัด แยกตามช่วงงาน เงินเดือน หรือจุดเปลี่ยนในชีวิต
              </CardDescription>
            </div>
            <Button onClick={addIncomePeriod} size="sm" type="button">
              <Plus className="h-4 w-4" aria-hidden="true" />
              เพิ่มช่วง
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {ledger.incomePeriods.map((period, index) => {
              const yearlyIncome = period.monthlyIncome * 12 + period.annualBonus;
              const years = getPeriodYears(period);
              const totalIncome = yearlyIncome * years;

              return (
                <section
                  className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
                  key={period.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--muted)] text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--foreground)]">
                          {period.label || `ช่วงรายได้ ${index + 1}`}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          อายุ {formatNumber(period.startAge)}-{formatNumber(period.endAge)} ·{" "}
                          {formatNumber(years)} ปี · รวม {formatCurrency(totalIncome)}
                        </div>
                      </div>
                    </div>
                    <Button
                      aria-label={`ลบ ${period.label}`}
                      disabled={ledger.incomePeriods.length <= 1}
                      onClick={() => deleteIncomePeriod(period.id)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(12rem,1.2fr)_repeat(4,minmax(7rem,1fr))]">
                    <TextInput
                      id={`${period.id}-label`}
                      label="ชื่อช่วง"
                      onValueChange={(value) => updateIncomePeriod(period.id, { label: value })}
                      value={period.label}
                    />
                    <NumberInput
                      id={`${period.id}-start`}
                      label="อายุเริ่ม"
                      onValueChange={(value) => updateIncomePeriod(period.id, { startAge: value })}
                      value={period.startAge}
                    />
                    <NumberInput
                      id={`${period.id}-end`}
                      label="อายุจบ"
                      onValueChange={(value) => updateIncomePeriod(period.id, { endAge: value })}
                      value={period.endAge}
                    />
                    <NumberInput
                      id={`${period.id}-income`}
                      label="เงินเดือน"
                      onValueChange={(value) =>
                        updateIncomePeriod(period.id, { monthlyIncome: value })
                      }
                      value={period.monthlyIncome}
                    />
                    <NumberInput
                      id={`${period.id}-bonus`}
                      label="โบนัส/ปี"
                      onValueChange={(value) =>
                        updateIncomePeriod(period.id, { annualBonus: value })
                      }
                      value={period.annualBonus}
                    />
                  </div>
                </section>
              );
            })}
            <Button onClick={addIncomePeriod} type="button" variant="outline">
              <Plus className="h-4 w-4" aria-hidden="true" />
              เพิ่มช่วงรายได้ถัดไป
            </Button>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income Timeline</CardTitle>
          <CardDescription>รายได้รวมของแต่ละช่วงชีวิต</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-w-0 overflow-x-auto pb-2">
            <div
              className="h-80"
              style={{ width: Math.max(640, summary.incomeTimeline.length * 160) }}
            >
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={summary.incomeTimeline}
                  margin={{ bottom: 18, left: 0, right: 12, top: 8 }}
                >
                  <XAxis
                    dataKey="label"
                    height={48}
                    interval={0}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickFormatter={formatAxisLabel}
                    tickMargin={10}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}M`}
                  />
                  <Tooltip content={<MoneyTooltip />} />
                  <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function calculateLifetimeSummary(ledger: LifetimeLedger) {
  const incomeTimeline = ledger.incomePeriods.map((period) => {
    const years = getPeriodYears(period);
    const total = years * (period.monthlyIncome * 12 + period.annualBonus);

    return {
      id: period.id,
      label: period.label,
      total,
      years,
    };
  });
  const earnedFromIncome = incomeTimeline.reduce((sum, period) => sum + period.total, 0);
  const totalEarned = earnedFromIncome + Math.max(0, ledger.startingAssets);
  const totalSpent = ledger.spendingCategories.reduce(
    (sum, category) => sum + Math.max(0, category.amount),
    0,
  );
  const spendingCategories: SpendingPoint[] = ledger.spendingCategories.map((category) => ({
    ...category,
    amount: Math.max(0, category.amount),
    value: Math.max(0, category.amount),
    percentOfEarned: totalEarned > 0 ? (Math.max(0, category.amount) / totalEarned) * 100 : 0,
  }));

  return {
    incomeTimeline,
    totalEarned,
    totalSpent,
    spentPercent: totalEarned > 0 ? (totalSpent / totalEarned) * 100 : 0,
    remaining: totalEarned - totalSpent,
    spendingCategories,
  };
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  tone?: "success" | "danger";
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </div>
      <div
        className={`mt-2 text-xl font-semibold ${
          tone === "danger"
            ? "text-[var(--destructive)]"
            : tone === "success"
              ? "text-[var(--success-soft-foreground)]"
              : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--muted-foreground)]">{detail}</div>
    </div>
  );
}

function TextInput({
  id,
  label,
  onValueChange,
  value,
}: {
  id: string;
  label: string;
  onValueChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} onChange={(event) => onValueChange(event.target.value)} value={value} />
    </div>
  );
}

function NumberInput({
  id,
  label,
  max,
  onValueChange,
  precision,
  value,
}: {
  id: string;
  label: string;
  max?: number;
  onValueChange: (value: number) => void;
  precision?: number;
  value: number;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>{label}</Label>
      <UiNumberInput
        id={id}
        max={max}
        min={0}
        onValueChange={onValueChange}
        precision={precision}
        value={value}
      />
    </div>
  );
}

function MoneyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { label: string; total: number; years: number } }>;
}) {
  if (!active || !payload?.length) return null;

  const period = payload[0].payload;

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm shadow-lg">
      <div className="font-medium">{period.label}</div>
      <div className="text-[var(--muted-foreground)]">
        {formatCurrency(period.total)} · {formatNumber(period.years)} ปี
      </div>
    </div>
  );
}

function SpendingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SpendingPoint }>;
}) {
  if (!active || !payload?.length) return null;

  const category = payload[0].payload;

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm shadow-lg">
      <div className="font-medium">{category.name}</div>
      <div className="text-[var(--muted-foreground)]">
        {formatCurrency(category.amount)} · {formatPercent(category.percentOfEarned)}
      </div>
    </div>
  );
}

function formatAxisLabel(value: string) {
  return value.length > 10 ? `${value.slice(0, 9)}...` : value;
}

function getPeriodYears(period: LifetimeIncomePeriod) {
  return Math.max(0, Math.floor(period.endAge) - Math.floor(period.startAge) + 1);
}

function sanitizeIncomePeriod(period: LifetimeIncomePeriod): LifetimeIncomePeriod {
  return {
    ...period,
    startAge: Math.max(0, period.startAge),
    endAge: Math.max(0, period.endAge),
    monthlyIncome: Math.max(0, period.monthlyIncome),
    annualBonus: Math.max(0, period.annualBonus),
  };
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
