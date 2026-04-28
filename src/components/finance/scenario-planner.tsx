"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  applyScenarioPreset,
  createScenarioFromState,
  duplicateScenario,
  evaluateScenario,
  scenarioPresets,
  updateScenarioInvestment,
  updateScenarioKindAmount,
  updateScenarioNetIncome,
  type ScenarioPlan,
  type ScenarioPresetId,
} from "@/lib/scenarios";
import type { AllocationCategory, InvestmentScenario } from "@/types/finance";

type ScenarioPlannerProps = {
  netIncome: number;
  allocations: AllocationCategory[];
  investmentScenario: InvestmentScenario;
};

export function ScenarioPlanner({
  netIncome,
  allocations,
  investmentScenario,
}: ScenarioPlannerProps) {
  const initialScenario = useMemo(
    () =>
      createScenarioFromState({
        name: "แผนปัจจุบัน",
        netIncome,
        allocations,
        investmentScenario,
      }),
    [allocations, investmentScenario, netIncome],
  );
  const [scenarios, setScenarios] = useState<ScenarioPlan[]>(() => [
    initialScenario,
    applyScenarioPreset(initialScenario, "emergency-focus"),
  ]);
  const [activeScenarioId, setActiveScenarioId] = useState(scenarios[0].id);
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId)
    ?? scenarios[0];
  const scenarioResults = scenarios.map((scenario) => ({
    scenario,
    result: evaluateScenario(scenario),
  }));

  function updateActiveScenario(nextScenario: ScenarioPlan) {
    setScenarios((currentScenarios) =>
      currentScenarios.map((scenario) =>
        scenario.id === nextScenario.id ? nextScenario : scenario,
      ),
    );
  }

  function addCurrentScenario() {
    const nextScenario = createScenarioFromState({
      name: `แผนปัจจุบัน ${scenarios.length + 1}`,
      netIncome,
      allocations,
      investmentScenario,
    });

    setScenarios((currentScenarios) => [...currentScenarios, nextScenario]);
    setActiveScenarioId(nextScenario.id);
  }

  function duplicateActiveScenario() {
    const nextScenario = duplicateScenario(activeScenario);
    setScenarios((currentScenarios) => [...currentScenarios, nextScenario]);
    setActiveScenarioId(nextScenario.id);
  }

  function addPresetScenario(presetId: ScenarioPresetId) {
    const nextScenario = applyScenarioPreset(initialScenario, presetId);
    setScenarios((currentScenarios) => [...currentScenarios, nextScenario]);
    setActiveScenarioId(nextScenario.id);
  }

  function removeActiveScenario() {
    if (scenarios.length <= 2) return;

    const nextScenarios = scenarios.filter((scenario) => scenario.id !== activeScenario.id);
    setScenarios(nextScenarios);
    setActiveScenarioId(nextScenarios[0].id);
  }

  const baseResult = scenarioResults[0]?.result;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Scenario Planner</CardTitle>
            <CardDescription className="mt-1">
              เทียบรายได้ ค่าใช้จ่าย DCA และ cashflow ของหลายแผนก่อนตัดสินใจ
            </CardDescription>
          </div>
          <Badge className="w-fit bg-[var(--success-soft)] text-[var(--success-soft-foreground)]">
            {scenarios.length} scenarios
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={addCurrentScenario} size="sm" type="button" variant="outline">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Current
          </Button>
          <Button onClick={duplicateActiveScenario} size="sm" type="button" variant="outline">
            <Copy className="h-4 w-4" aria-hidden="true" />
            Duplicate
          </Button>
          <Button
            disabled={scenarios.length <= 2}
            onClick={removeActiveScenario}
            size="sm"
            type="button"
            variant="outline"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remove
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_1.2fr]">
          <div className="grid gap-4 rounded-lg border border-[var(--border)] p-4">
            <div className="grid gap-2">
              <Label htmlFor="active-scenario">Scenario</Label>
              <Select
                id="active-scenario"
                onChange={(event) => setActiveScenarioId(event.target.value)}
                value={activeScenario.id}
              >
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="scenario-name">ชื่อ scenario</Label>
              <Input
                id="scenario-name"
                onChange={(event) =>
                  updateActiveScenario({ ...activeScenario, name: event.target.value })
                }
                value={activeScenario.name}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                id="scenario-income"
                label="รายได้สุทธิ"
                min={0}
                onChange={(value) =>
                  updateActiveScenario(updateScenarioNetIncome(activeScenario, value))
                }
                value={activeScenario.netIncome}
              />
              <NumberField
                id="scenario-expense"
                label="ค่าใช้จ่ายพื้นฐาน"
                min={0}
                onChange={(value) =>
                  updateActiveScenario(
                    updateScenarioKindAmount(activeScenario, "necessary", value),
                  )
                }
                value={getKindAmount(activeScenario.allocations, "necessary")}
              />
              <NumberField
                id="scenario-dca"
                label="DCA รายเดือน"
                min={0}
                onChange={(value) =>
                  updateActiveScenario(
                    updateScenarioInvestment(activeScenario, {
                      monthlyContribution: value,
                    }),
                  )
                }
                value={activeScenario.investmentScenario.monthlyContribution}
              />
              <NumberField
                id="scenario-return"
                label="Return ต่อปี (%)"
                min={0}
                onChange={(value) =>
                  updateActiveScenario(
                    updateScenarioInvestment(activeScenario, {
                      annualReturnPercent: value,
                    }),
                  )
                }
                step={0.5}
                value={activeScenario.investmentScenario.annualReturnPercent}
              />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="scenario-preset">Preset scenario</Label>
              <Select
                id="scenario-preset"
                onChange={(event) => {
                  if (!event.target.value) return;
                  addPresetScenario(event.target.value as ScenarioPresetId);
                  event.target.value = "";
                }}
                value=""
              >
                <option value="">เลือก preset เพื่อเพิ่ม scenario</option>
                {scenarioPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {scenarioPresets.map((preset) => (
                <button
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-left text-sm transition-colors hover:bg-[var(--muted)]"
                  key={preset.id}
                  onClick={() => addPresetScenario(preset.id)}
                  type="button"
                >
                  <span className="font-semibold text-[var(--foreground)]">
                    {preset.name}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>รายได้</TableHead>
                <TableHead>DCA</TableHead>
                <TableHead>Cashflow</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>มูลค่าอนาคต</TableHead>
                <TableHead>ต่างจากฐาน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarioResults.map(({ scenario, result }) => (
                <TableRow key={scenario.id}>
                  <TableCell className="min-w-44 font-medium">{scenario.name}</TableCell>
                  <TableCell>{formatCurrency(scenario.netIncome)}</TableCell>
                  <TableCell>
                    {formatCurrency(scenario.investmentScenario.monthlyContribution)}
                  </TableCell>
                  <TableCell
                    className={
                      result.remaining < 0
                        ? "text-[var(--destructive)]"
                        : "text-[var(--foreground)]"
                    }
                  >
                    {formatCurrency(result.remaining)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getHealthBadgeClass(result.health.status)}>
                      {result.health.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(result.futureValue)}</TableCell>
                  <TableCell>
                    {formatCurrency(result.futureValue - (baseResult?.futureValue ?? 0))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {scenarioResults.map(({ scenario, result }) => (
            <div
              className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4"
              key={scenario.id}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold">{scenario.name}</div>
                <Badge className={getHealthBadgeClass(result.health.status)}>
                  {result.health.status}
                </Badge>
              </div>
              <div className="mt-3 grid gap-1 text-sm text-[var(--muted-foreground)]">
                <div>จัดสรร {formatPercent(result.totals.percent)}</div>
                <div>เงินเหลือ {formatCurrency(result.remaining)}</div>
                <div>กำไรคาดการณ์ {formatCurrency(result.estimatedGain)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NumberField({
  id,
  label,
  min,
  onChange,
  step = 1,
  value,
}: {
  id: string;
  label: string;
  min?: number;
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
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={roundInput(value)}
      />
    </div>
  );
}

function getKindAmount(
  allocations: AllocationCategory[],
  kind: AllocationCategory["kind"],
) {
  return allocations
    .filter((allocation) => allocation.kind === kind)
    .reduce((sum, allocation) => sum + allocation.amount, 0);
}

function getHealthBadgeClass(status: string) {
  if (status === "ดี") {
    return "bg-[var(--success-soft)] text-[var(--success-soft-foreground)]";
  }

  if (status === "เสี่ยง") {
    return "bg-[var(--danger-soft)] text-[var(--danger-soft-foreground)]";
  }

  return "bg-[var(--muted)] text-[var(--foreground)]";
}

function roundInput(value: number) {
  return Number(value.toFixed(2));
}
