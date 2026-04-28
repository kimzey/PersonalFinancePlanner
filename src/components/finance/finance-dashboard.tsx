"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  Landmark,
  LineChart,
  PieChart,
  ReceiptText,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AllocationEditor } from "@/components/finance/allocation-editor";
import { CashflowHealth } from "@/components/finance/cashflow-health";
import { EmergencyFundPlanner } from "@/components/finance/emergency-fund-planner";
import { ExportImportDialog } from "@/components/finance/export-import-dialog";
import { DebtPlanner } from "@/components/finance/debt-planner";
import { ExpenseTracker } from "@/components/finance/expense-tracker";
import { FinancialGoals } from "@/components/finance/financial-goals";
import { GuidedSetupWizard } from "@/components/finance/guided-setup-wizard";
import { ScenarioPlanner } from "@/components/finance/scenario-planner";
import { SummaryCards } from "@/components/finance/summary-cards";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import {
  calculateAllocationTotals,
  calculateRemainingIncome,
  normalizeAllocations,
} from "@/lib/finance";
import { createDefaultPlan } from "@/lib/default-plan";
import { formatCurrency, formatPercent } from "@/lib/format";
import { loadFinanceDraft, saveFinanceDraft } from "@/lib/storage";
import type { AllocationCategory, FinancialPlan } from "@/types/finance";
import type { ScenarioPlan } from "@/lib/scenarios";

type FinanceDashboardProps = {
  initialPlan: FinancialPlan;
};

type DashboardSection =
  | "overview"
  | "budget"
  | "protection"
  | "investing"
  | "scenarios"
  | "goals"
  | "debts"
  | "expenses";

const dashboardSections: {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "budget", label: "Budget", icon: SlidersHorizontal },
  { id: "protection", label: "Protection", icon: ShieldCheck },
  { id: "investing", label: "Investing", icon: LineChart },
  { id: "scenarios", label: "Scenarios", icon: PieChart },
  { id: "goals", label: "Goals", icon: Target },
  { id: "debts", label: "Debt", icon: Landmark },
  { id: "expenses", label: "Expenses", icon: ReceiptText },
];

const AllocationChart = dynamic(
  () =>
    import("@/components/finance/allocation-chart").then(
      (module) => module.AllocationChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 rounded-lg border border-[var(--border)] bg-[var(--card)]" />
    ),
  },
);

const InvestmentSimulator = dynamic(
  () =>
    import("@/components/finance/investment-simulator").then(
      (module) => module.InvestmentSimulator,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[36rem] rounded-lg border border-[var(--border)] bg-[var(--card)]" />
    ),
  },
);

export function FinanceDashboard({ initialPlan }: FinanceDashboardProps) {
  const [netIncome, setNetIncome] = useState(initialPlan.profile.netIncome);
  const [allocations, setAllocations] = useState(initialPlan.allocations);
  const [investmentScenario, setInvestmentScenario] = useState(
    initialPlan.investmentScenarios[0],
  );
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedScenarios, setImportedScenarios] = useState<ScenarioPlan[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [simulatorRevision, setSimulatorRevision] = useState(0);
  const [goals, setGoals] = useState(initialPlan.goals);
  const [debts, setDebts] = useState(initialPlan.debts);
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");

  const normalizedAllocations = useMemo(
    () => normalizeAllocations(allocations, netIncome),
    [allocations, netIncome],
  );
  const totals = calculateAllocationTotals(normalizedAllocations);
  const remaining = calculateRemainingIncome(netIncome, totals.amount);
  const isOverIncome = remaining < 0;

  function handleAllocationsChange(nextAllocations: AllocationCategory[]) {
    setAllocations(normalizeAllocations(nextAllocations, netIncome));
  }

  function handleNetIncomeChange(nextNetIncome: number) {
    setNetIncome(nextNetIncome);
    setAllocations((currentAllocations) =>
      normalizeAllocations(currentAllocations, nextNetIncome),
    );
  }

  function resetDefaultPlan() {
    const defaultPlan = createDefaultPlan();
    setNetIncome(defaultPlan.profile.netIncome);
    setAllocations(defaultPlan.allocations);
    setInvestmentScenario(defaultPlan.investmentScenarios[0]);
    setGoals(defaultPlan.goals);
    setDebts(defaultPlan.debts);
    setSimulatorRevision((currentRevision) => currentRevision + 1);
  }

  function resetAllocations() {
    const defaultPlan = createDefaultPlan(netIncome);
    setAllocations(defaultPlan.allocations);
  }

  function resetSimulator() {
    const defaultPlan = createDefaultPlan(netIncome);
    setInvestmentScenario(defaultPlan.investmentScenarios[0]);
    setSimulatorRevision((currentRevision) => currentRevision + 1);
  }

  function applyPlan(nextPlan: FinancialPlan) {
    setNetIncome(nextPlan.profile.netIncome);
    setAllocations(nextPlan.allocations);
    setInvestmentScenario(nextPlan.investmentScenarios[0]);
    setGoals(nextPlan.goals);
    setDebts(nextPlan.debts);
    setSimulatorRevision((currentRevision) => currentRevision + 1);
  }

  const currentPlan: FinancialPlan = useMemo(
    () => ({
      schemaVersion: initialPlan.schemaVersion,
      profile: {
        netIncome,
      },
      allocations: normalizedAllocations,
      investmentScenarios: [investmentScenario],
      goals,
      debts,
      settings: initialPlan.settings,
    }),
    [
      debts,
      goals,
      initialPlan.schemaVersion,
      initialPlan.settings,
      investmentScenario,
      netIncome,
      normalizedAllocations,
    ],
  );

  useEffect(() => {
    const savedDraft = loadFinanceDraft();
    queueMicrotask(() => {
      if (savedDraft.ok) {
        applyPlan(savedDraft.draft.plan);
        setLastSavedAt(savedDraft.draft.savedAt);
        setStorageMessage(savedDraft.migrated ? "โหลด draft และ migrate schema แล้ว" : null);
      }
      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    const savedDraft = saveFinanceDraft(currentPlan);
    if (!savedDraft) {
      queueMicrotask(() => {
        setStorageMessage("ไม่สามารถบันทึก draft ใน browser นี้ได้");
      });
      return;
    }

    queueMicrotask(() => {
      setLastSavedAt(savedDraft.savedAt);
      setStorageMessage(null);
    });
  }, [currentPlan, storageReady]);

  return (
    <div className="mx-auto flex max-w-7xl min-w-0 flex-col gap-6 pb-24 md:pb-0">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            Personal Finance Planner
          </h1>
          <p className="max-w-3xl text-sm text-[var(--muted-foreground)]">
            Dashboard สำหรับวางแผนรายได้ ค่าใช้จ่าย การออม และการลงทุนรายเดือน
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="w-fit bg-[var(--success-soft)] text-[var(--success-soft-foreground)]">
            Phase 12 QA Polish
          </Badge>
          {lastSavedAt ? (
            <Badge className="w-fit bg-[var(--muted)] text-[var(--muted-foreground)]">
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Saved {formatSavedTime(lastSavedAt)}
            </Badge>
          ) : null}
          <Button onClick={() => setImportDialogOpen(true)} size="sm" type="button" variant="outline">
            <Download className="h-4 w-4" aria-hidden="true" />
            Export / Import
          </Button>
          <Button onClick={resetDefaultPlan} size="sm" type="button" variant="secondary">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset all
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <ExportImportDialog
        currentPlan={currentPlan}
        onImportPlan={applyPlan}
        onImportScenario={(scenario) =>
          setImportedScenarios((currentScenarios) => [...currentScenarios, scenario])
        }
        onOpenChange={setImportDialogOpen}
        open={importDialogOpen}
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav
            aria-label="Dashboard sections"
            className="hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 lg:grid lg:gap-1"
          >
            {dashboardSections.map((section) => (
              <SectionButton
                active={activeSection === section.id}
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                section={section}
              />
            ))}
          </nav>
          <nav
            aria-label="Dashboard sections"
            className="flex max-w-[calc(100vw-2rem)] gap-2 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 lg:hidden"
          >
            {dashboardSections.map((section) => (
              <SectionButton
                active={activeSection === section.id}
                compact
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                section={section}
              />
            ))}
          </nav>
        </aside>

        <section className="grid min-w-0 gap-6">
          {activeSection === "overview" ? (
            <>
              <GuidedSetupWizard netIncome={netIncome} onApplyPlan={applyPlan} />
              <SummaryCards netIncome={netIncome} remaining={remaining} totals={totals} />
              {isOverIncome ? (
                <Alert variant="destructive">
                  <AlertTitle>ยอดจัดสรรเกินรายได้</AlertTitle>
                  <AlertDescription>
                    แผนนี้เกินรายได้สุทธิอยู่ {formatCurrency(Math.abs(remaining))}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTitle>แผนปัจจุบัน</AlertTitle>
                  <AlertDescription>
                    ยอดจัดสรรรวม {formatPercent(totals.percent)} และเงินเหลือ{" "}
                    {formatCurrency(remaining)}
                  </AlertDescription>
                </Alert>
              )}
              {storageMessage ? (
                <Alert>
                  <AlertTitle>Storage</AlertTitle>
                  <AlertDescription>{storageMessage}</AlertDescription>
                </Alert>
              ) : null}
              <AllocationChart allocations={normalizedAllocations} />
            </>
          ) : null}

          {activeSection === "budget" ? (
            <>
              <AllocationEditor
                allocations={normalizedAllocations}
                netIncome={netIncome}
                onAllocationsChange={handleAllocationsChange}
                onNetIncomeChange={handleNetIncomeChange}
                onReset={resetAllocations}
              />
              <Button onClick={resetAllocations} size="sm" type="button" variant="outline">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset allocation
              </Button>
            </>
          ) : null}

          {activeSection === "protection" ? (
            <div className="grid min-w-0 gap-6 min-[1800px]:grid-cols-2">
              <EmergencyFundPlanner
                monthlyEssentialExpense={totals.essentialAmount}
                monthlySaving={totals.savingsAmount}
              />
              <CashflowHealth netIncome={netIncome} remaining={remaining} totals={totals} />
            </div>
          ) : null}

          {activeSection === "investing" ? (
            <>
              <InvestmentSimulator
                key={simulatorRevision}
                initialScenario={investmentScenario}
                onScenarioChange={setInvestmentScenario}
              />
              <Button onClick={resetSimulator} size="sm" type="button" variant="outline">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset simulator
              </Button>
            </>
          ) : null}

          {activeSection === "scenarios" ? (
            <ScenarioPlanner
              allocations={normalizedAllocations}
              importedScenarios={importedScenarios}
              investmentScenario={investmentScenario}
              netIncome={netIncome}
            />
          ) : null}

          {activeSection === "goals" ? (
            <FinancialGoals goals={goals} onGoalsChange={setGoals} />
          ) : null}

          {activeSection === "debts" ? (
            <DebtPlanner debts={debts} onDebtsChange={setDebts} />
          ) : null}

          {activeSection === "expenses" ? (
            <ExpenseTracker allocations={normalizedAllocations} />
          ) : null}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-lg md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">รายได้</p>
            <p className="font-semibold">{formatCurrency(netIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">จัดสรร</p>
            <p className="font-semibold">{formatPercent(totals.percent)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">เหลือ</p>
            <p
              className={`font-semibold ${
                isOverIncome ? "text-[var(--destructive)]" : "text-[var(--foreground)]"
              }`}
            >
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionButton({
  active,
  compact = false,
  onClick,
  section,
}: {
  active: boolean;
  compact?: boolean;
  onClick: () => void;
  section: (typeof dashboardSections)[number];
}) {
  const Icon = section.icon;

  return (
    <button
      aria-current={active ? "page" : undefined}
      className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-[0.97] ${
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      } ${compact ? "min-w-fit" : "justify-start"}`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" aria-hidden />
      {section.label}
    </button>
  );
}

function formatSavedTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}
