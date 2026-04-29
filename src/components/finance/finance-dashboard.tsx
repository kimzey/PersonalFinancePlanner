"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Calculator,
  ChevronDown,
  Copy,
  Download,
  Landmark,
  LineChart,
  PieChart,
  Plus,
  ReceiptText,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AllocationEditor } from "@/components/finance/allocation-editor";
import { CashflowHealth } from "@/components/finance/cashflow-health";
import { EmergencyFundPlanner } from "@/components/finance/emergency-fund-planner";
import { ExportImportDialog } from "@/components/finance/export-import-dialog";
import { DebtPlanner } from "@/components/finance/debt-planner";
import { ExpenseTracker } from "@/components/finance/expense-tracker";
import { FinancialGoals } from "@/components/finance/financial-goals";
import { ScenarioPlanner } from "@/components/finance/scenario-planner";
import { SettingsPanel } from "@/components/finance/settings-panel";
import { SummaryCards } from "@/components/finance/summary-cards";
import { TaxCalculator } from "@/components/finance/tax-calculator";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import {
  calculateAllocationTotals,
  calculateRemainingIncome,
  normalizeAllocations,
} from "@/lib/finance";
import { createDefaultPlan } from "@/lib/default-plan";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  loadFinancePlanCollection,
  saveFinancePlanCollection,
  type StoredFinancePlan,
} from "@/lib/storage";
import type {
  AllocationCategory,
  DebtItem,
  FinancialGoal,
  FinancialPlan,
} from "@/types/finance";
import type { ScenarioPlan } from "@/lib/scenarios";

type FinanceDashboardProps = {
  initialPlan: FinancialPlan;
};

type QuickAction = {
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  onClick: () => void;
};

type DashboardSection =
  | "overview"
  | "budget"
  | "protection"
  | "investing"
  | "scenarios"
  | "goals"
  | "debts"
  | "expenses"
  | "tax"
  | "settings";

const dashboardSections: {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  betaFeature?: keyof FinancialPlan["settings"]["betaFeatures"];
}[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "budget", label: "Budget", icon: SlidersHorizontal },
  { id: "protection", label: "Protection", icon: ShieldCheck, betaFeature: "protection" },
  { id: "investing", label: "Investing", icon: LineChart },
  { id: "scenarios", label: "Scenarios", icon: PieChart, betaFeature: "scenarios" },
  { id: "goals", label: "Goals", icon: Target, betaFeature: "goals" },
  { id: "debts", label: "Debt", icon: Landmark, betaFeature: "debts" },
  { id: "expenses", label: "Expenses", icon: ReceiptText, betaFeature: "expenses" },
  { id: "tax", label: "Tax", icon: Calculator },
  { id: "settings", label: "Settings", icon: Settings },
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
  const initialPlanProfile: StoredFinancePlan = {
    id: "default-plan",
    name: "แผนหลัก",
    createdAt: "",
    updatedAt: "",
    plan: initialPlan,
  };
  const [netIncome, setNetIncome] = useState(initialPlan.profile.netIncome);
  const [allocations, setAllocations] = useState(initialPlan.allocations);
  const [investmentScenario, setInvestmentScenario] = useState(
    initialPlan.investmentScenarios[0],
  );
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedScenarios, setImportedScenarios] = useState<ScenarioPlan[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [simulatorRevision, setSimulatorRevision] = useState(0);
  const [goals, setGoals] = useState(initialPlan.goals);
  const [debts, setDebts] = useState(initialPlan.debts);
  const [settings, setSettings] = useState(initialPlan.settings);
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [planProfileOpen, setPlanProfileOpen] = useState(false);
  const [expenseTrackerRevision, setExpenseTrackerRevision] = useState(0);
  const [taxCalculatorRevision, setTaxCalculatorRevision] = useState(0);
  const [planProfiles, setPlanProfiles] = useState<StoredFinancePlan[]>([
    initialPlanProfile,
  ]);
  const [activePlanId, setActivePlanId] = useState(initialPlanProfile.id);
  const shouldReduceMotion = useReducedMotion();

  const normalizedAllocations = useMemo(
    () => normalizeAllocations(allocations, netIncome),
    [allocations, netIncome],
  );
  const visibleDashboardSections = useMemo(
    () =>
      dashboardSections.filter(
        (section) => !section.betaFeature || settings.betaFeatures[section.betaFeature],
      ),
    [settings.betaFeatures],
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
    setSettings(defaultPlan.settings);
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
    setSettings(nextPlan.settings);
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
      settings,
    }),
    [
      debts,
      goals,
      investmentScenario,
      netIncome,
      normalizedAllocations,
      settings,
      initialPlan.schemaVersion,
    ],
  );

  useEffect(() => {
    const currentSection = dashboardSections.find((section) => section.id === activeSection);

    if (
      currentSection?.betaFeature &&
      !settings.betaFeatures[currentSection.betaFeature]
    ) {
      setActiveSection("overview");
    }
  }, [activeSection, settings.betaFeatures]);

  useEffect(() => {
    const savedCollection = loadFinancePlanCollection();
    queueMicrotask(() => {
      if (savedCollection.ok) {
        const activePlan =
          savedCollection.collection.plans.find(
            (plan) => plan.id === savedCollection.collection.activePlanId,
          ) ?? savedCollection.collection.plans[0];

        setPlanProfiles(savedCollection.collection.plans);
        setActivePlanId(activePlan.id);
        applyPlan(activePlan.plan);
        setLastSavedAt(activePlan.updatedAt || savedCollection.collection.savedAt);
        setStorageMessage(
          savedCollection.migrated ? "โหลด draft เดิมและย้ายเข้า plan library แล้ว" : null,
        );
      }
      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    const savedAt = new Date().toISOString();
    queueMicrotask(() => {
      setPlanProfiles((currentProfiles) => {
        return currentProfiles.map((profile) =>
          profile.id === activePlanId
            ? {
                ...profile,
                updatedAt: savedAt,
                plan: currentPlan,
              }
            : profile,
        );
      });
    });
  }, [activePlanId, currentPlan, storageReady]);

  useEffect(() => {
    if (!storageReady) return;

    const activeProfile = planProfiles.find((profile) => profile.id === activePlanId);
    const savedCollection = saveFinancePlanCollection({
      storageSchemaVersion: 1,
      savedAt: new Date().toISOString(),
      activePlanId,
      plans: planProfiles,
    });

    if (!savedCollection) {
      queueMicrotask(() => {
        setStorageMessage("ไม่สามารถบันทึก plan ใน browser นี้ได้");
      });
      return;
    }

    queueMicrotask(() => {
      setLastSavedAt(activeProfile?.updatedAt || savedCollection.savedAt);
      setStorageMessage(null);
    });
  }, [activePlanId, planProfiles, storageReady]);

  function handleSelectPlan(nextPlanId: string) {
    const nextProfile = planProfiles.find((profile) => profile.id === nextPlanId);
    if (!nextProfile) return;

    setActivePlanId(nextProfile.id);
    applyPlan(nextProfile.plan);
    setLastSavedAt(nextProfile.updatedAt || null);
    setStorageMessage(null);
  }

  function handleRenamePlan(nextName: string) {
    setPlanProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === activePlanId
          ? {
              ...profile,
              name: nextName,
            }
          : profile,
      ),
    );
  }

  function createNewPlan() {
    const now = new Date().toISOString();
    const nextPlan = createDefaultPlan();
    const nextProfile: StoredFinancePlan = {
      id: createPlanId("plan"),
      name: `Plan ${planProfiles.length + 1}`,
      createdAt: now,
      updatedAt: now,
      plan: nextPlan,
    };

    setPlanProfiles((currentProfiles) => [
      ...currentProfiles.map((profile) =>
        profile.id === activePlanId ? { ...profile, updatedAt: now, plan: currentPlan } : profile,
      ),
      nextProfile,
    ]);
    setActivePlanId(nextProfile.id);
    applyPlan(nextPlan);
    setLastSavedAt(now);
    setStorageMessage(null);
  }

  function duplicateCurrentPlan() {
    const activeProfile = planProfiles.find((profile) => profile.id === activePlanId);
    const now = new Date().toISOString();
    const nextProfile: StoredFinancePlan = {
      id: createPlanId("copy"),
      name: `${activeProfile?.name || "Plan"} copy`,
      createdAt: now,
      updatedAt: now,
      plan: currentPlan,
    };

    setPlanProfiles((currentProfiles) => [
      ...currentProfiles.map((profile) =>
        profile.id === activePlanId ? { ...profile, updatedAt: now, plan: currentPlan } : profile,
      ),
      nextProfile,
    ]);
    setActivePlanId(nextProfile.id);
    setLastSavedAt(now);
    setStorageMessage(null);
  }

  function deleteCurrentPlan() {
    if (planProfiles.length <= 1) return;

    const currentIndex = planProfiles.findIndex((profile) => profile.id === activePlanId);
    const nextProfiles = planProfiles.filter((profile) => profile.id !== activePlanId);
    const nextProfile = nextProfiles[Math.max(0, currentIndex - 1)] ?? nextProfiles[0];

    setPlanProfiles(nextProfiles);
    setActivePlanId(nextProfile.id);
    applyPlan(nextProfile.plan);
    setLastSavedAt(nextProfile.updatedAt || null);
    setStorageMessage(null);
  }

  function runQuickAction(action: () => void) {
    action();
    setActionMenuOpen(false);
  }

  function addGoal() {
    const nextGoal: FinancialGoal = {
      id: createPlanId("goal"),
      name: `Goal ${goals.length + 1}`,
      targetAmount: 100_000,
      currentAmount: 0,
      monthlySaving: 5_000,
      targetDate: getDefaultTargetDate(),
    };

    setGoals((currentGoals) => [...currentGoals, nextGoal]);
  }

  function addDebt() {
    const nextDebt: DebtItem = {
      id: createPlanId("debt"),
      name: `Debt ${debts.length + 1}`,
      balance: 50_000,
      annualInterestPercent: 12,
      minimumPayment: 2_000,
    };

    setDebts((currentDebts) => [...currentDebts, nextDebt]);
  }

  const quickActions = useMemo<QuickAction[]>(() => {
    switch (activeSection) {
      case "overview":
        return [
          { label: "New plan", icon: Plus, onClick: createNewPlan },
          {
            label: "Export / Import",
            icon: Download,
            onClick: () => setImportDialogOpen(true),
          },
        ];
      case "budget":
        return [{ label: "Reset allocation", icon: RotateCcw, onClick: resetAllocations }];
      case "investing":
        return [{ label: "Reset simulator", icon: RotateCcw, onClick: resetSimulator }];
      case "scenarios":
        return importedScenarios.length > 0
          ? [
              {
                label: "Clear imported scenarios",
                icon: Trash2,
                onClick: () => setImportedScenarios([]),
              },
            ]
          : [];
      case "goals":
        return [{ label: "Add goal", icon: Target, onClick: addGoal }];
      case "debts":
        return [{ label: "Add debt", icon: Landmark, onClick: addDebt }];
      case "expenses":
        return [
          {
            label: "Reset actual expenses",
            icon: RotateCcw,
            onClick: () => setExpenseTrackerRevision((revision) => revision + 1),
          },
        ];
      case "tax":
        return [
          {
            label: "Reset tax calculator",
            icon: RotateCcw,
            onClick: () => setTaxCalculatorRevision((revision) => revision + 1),
          },
        ];
      case "settings":
        return [
          { label: "New plan", icon: Plus, onClick: createNewPlan },
          { label: "Duplicate plan", icon: Copy, onClick: duplicateCurrentPlan },
          {
            label: "Export / Import",
            icon: Download,
            onClick: () => setImportDialogOpen(true),
          },
          { label: "Reset all", icon: RotateCcw, onClick: resetDefaultPlan },
        ];
      case "protection":
      default:
        return [];
    }
  }, [
    activeSection,
    debts.length,
    goals.length,
    importedScenarios.length,
    currentPlan,
    planProfiles.length,
    activePlanId,
  ]);

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

      <PlanProfileBar
        activePlanId={activePlanId}
        canDelete={planProfiles.length > 1}
        onCreatePlan={createNewPlan}
        onDeletePlan={deleteCurrentPlan}
        onDuplicatePlan={duplicateCurrentPlan}
        onRenamePlan={handleRenamePlan}
        onSelectPlan={handleSelectPlan}
        onOpenChange={setPlanProfileOpen}
        open={planProfileOpen}
        plans={planProfiles}
        reduceMotion={Boolean(shouldReduceMotion)}
      />

      <ExportImportDialog
        currentPlan={currentPlan}
        onImportPlan={applyPlan}
        onImportScenario={(scenario) =>
          setImportedScenarios((currentScenarios) => [...currentScenarios, scenario])
        }
        onImportComplete={setActionMessage}
        onOpenChange={setImportDialogOpen}
        open={importDialogOpen}
      />

      {actionMessage ? (
        <Alert>
          <AlertTitle>Import สำเร็จ</AlertTitle>
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      ) : null}

      <FloatingActionMenu
        actions={quickActions}
        onAction={runQuickAction}
        open={actionMenuOpen}
        onOpenChange={setActionMenuOpen}
        reduceMotion={Boolean(shouldReduceMotion)}
        sectionLabel={getSectionLabel(activeSection)}
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav
            aria-label="Dashboard sections"
            className="hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 lg:grid lg:gap-1"
          >
            {visibleDashboardSections.map((section) => (
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
            {visibleDashboardSections.map((section) => (
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
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="grid min-w-0 gap-6"
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              key={activeSection}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
          {activeSection === "overview" ? (
            <>
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
            <ExpenseTracker key={expenseTrackerRevision} allocations={normalizedAllocations} />
          ) : null}

          {activeSection === "tax" ? (
            <TaxCalculator key={taxCalculatorRevision} initialMonthlyIncome={netIncome} />
          ) : null}

          {activeSection === "settings" ? (
            <SettingsPanel
              activePlanId={activePlanId}
              lastSavedAt={lastSavedAt}
              onExportImport={() => setImportDialogOpen(true)}
              onCreatePlan={createNewPlan}
              onDeletePlan={deleteCurrentPlan}
              onDuplicatePlan={duplicateCurrentPlan}
              onRenamePlan={handleRenamePlan}
              onResetPlan={resetDefaultPlan}
              onSelectPlan={handleSelectPlan}
              onSettingsChange={setSettings}
              planProfiles={planProfiles}
              settings={settings}
            />
          ) : null}
            </motion.div>
          </AnimatePresence>
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

function PlanProfileBar({
  activePlanId,
  canDelete,
  onCreatePlan,
  onDeletePlan,
  onDuplicatePlan,
  onOpenChange,
  onRenamePlan,
  onSelectPlan,
  open,
  plans,
  reduceMotion,
}: {
  activePlanId: string;
  canDelete: boolean;
  onCreatePlan: () => void;
  onDeletePlan: () => void;
  onDuplicatePlan: () => void;
  onOpenChange: (open: boolean) => void;
  onRenamePlan: (name: string) => void;
  onSelectPlan: (planId: string) => void;
  open: boolean;
  plans: StoredFinancePlan[];
  reduceMotion: boolean;
}) {
  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? plans[0];

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <button
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--muted)]"
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        <span className="grid min-w-0 gap-1">
          <span className="text-xs font-medium uppercase text-[var(--muted-foreground)]">
            Plan / Profile
          </span>
          <span className="truncate text-sm font-semibold text-[var(--foreground)]">
            {activePlan?.name || "Untitled plan"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">
            {plans.length} plan{plans.length === 1 ? "" : "s"}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="border-t border-[var(--border)]"
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="grid gap-3 p-4 md:grid-cols-[minmax(12rem,18rem)_minmax(12rem,1fr)_auto] md:items-end">
              <div className="grid gap-2">
                <Label htmlFor="active-plan">Active plan</Label>
                <Select
                  id="active-plan"
                  onChange={(event) => onSelectPlan(event.target.value)}
                  value={activePlanId}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name || "Untitled plan"}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plan-name">Plan name</Label>
                <Input
                  id="plan-name"
                  onChange={(event) => onRenamePlan(event.target.value)}
                  placeholder="ตั้งชื่อ plan"
                  value={activePlan?.name ?? ""}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={onCreatePlan} size="sm" type="button" variant="outline">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  New
                </Button>
                <Button onClick={onDuplicatePlan} size="sm" type="button" variant="outline">
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Duplicate
                </Button>
                <Button
                  disabled={!canDelete}
                  onClick={onDeletePlan}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function FloatingActionMenu({
  actions,
  onAction,
  onOpenChange,
  open,
  reduceMotion,
  sectionLabel,
}: {
  actions: QuickAction[];
  onAction: (action: () => void) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  reduceMotion: boolean;
  sectionLabel: string;
}) {
  const MainIcon = open ? X : Plus;

  return (
    <div className="fixed bottom-28 right-4 z-50 grid justify-items-end gap-3 md:bottom-6 md:right-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 shadow-xl"
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div className="px-3 py-1 text-xs font-medium uppercase text-[var(--muted-foreground)]">
              {sectionLabel}
            </div>
            {actions.length > 0 ? (
              actions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    className="inline-flex min-w-52 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                    key={action.label}
                    onClick={() => onAction(action.onClick)}
                    type="button"
                  >
                    <Icon className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
                    {action.label}
                  </button>
                );
              })
            ) : (
              <div className="min-w-52 rounded-md px-3 py-2 text-sm text-[var(--muted-foreground)]">
                No quick actions for this view
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        aria-expanded={open}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        className="grid h-14 w-14 place-items-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xl transition-transform hover:-translate-y-0.5 active:scale-95"
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        <MainIcon className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}

function getSectionLabel(section: DashboardSection) {
  return dashboardSections.find((item) => item.id === section)?.label ?? "Current view";
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
      className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 active:scale-[0.97] ${
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

function createPlanId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultTargetDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}
