"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineCalculatorInput } from "@/components/finance/inline-calculator-input";
import { calculateAllocationTotals } from "@/lib/finance";
import {
  createFinancialPlanFromTemplate,
  getPlanTemplates,
  type PlanTemplateId,
} from "@/lib/templates";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { FinancialPlan } from "@/types/finance";

type GuidedSetupWizardProps = {
  netIncome: number;
  onApplyPlan: (plan: FinancialPlan) => void;
};

const stepLabels = ["Template", "Income", "Preview"];

export function GuidedSetupWizard({ netIncome, onApplyPlan }: GuidedSetupWizardProps) {
  const [step, setStep] = useState(0);
  const [draftIncome, setDraftIncome] = useState(netIncome);
  const [selectedTemplateId, setSelectedTemplateId] = useState<PlanTemplateId>("starter");
  const shouldReduceMotion = useReducedMotion();
  const templates = useMemo(() => getPlanTemplates(draftIncome), [draftIncome]);
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? templates[0];
  const totals = calculateAllocationTotals(selectedTemplate.allocations);

  function applyTemplate() {
    onApplyPlan(createFinancialPlanFromTemplate(selectedTemplate));
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Guided Setup</CardTitle>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              เลือก template ปรับรายได้ แล้วสร้างแผนแรกได้ทันที
            </p>
          </div>
          <Badge className="w-fit bg-[var(--success-soft)] text-[var(--success-soft-foreground)]">
            Phase 6
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {stepLabels.map((label, index) => (
            <button
              className={`rounded-md border px-3 py-2 text-left text-sm ${
                step === index
                  ? "border-[var(--primary)] bg-[var(--success-soft)] text-[var(--success-soft-foreground)]"
                  : "border-[var(--border)] bg-transparent text-[var(--muted-foreground)]"
              }`}
              key={label}
              onClick={() => setStep(index)}
              type="button"
            >
              <span className="block text-xs">Step {index + 1}</span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-3 md:grid-cols-5"
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            key="template"
            transition={{ duration: 0.18 }}
          >
            {templates.map((template) => (
              <button
                className={`rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 ${
                  selectedTemplate.id === template.id
                    ? "border-[var(--primary)] bg-[var(--success-soft)]"
                    : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                }`}
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                type="button"
              >
                <span className="block text-sm font-semibold text-[var(--foreground)]">
                  {template.name}
                </span>
                <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                  {template.description}
                </span>
              </button>
            ))}
          </motion.div>
        ) : null}

        {step === 1 ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-3 sm:max-w-sm"
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            key="income"
            transition={{ duration: 0.18 }}
          >
            <label
              className="text-sm font-medium text-[var(--foreground)]"
              htmlFor="wizard-net-income"
            >
              รายได้สุทธิรายเดือน
            </label>
            <InlineCalculatorInput
              id="wizard-net-income"
              onValueChange={setDraftIncome}
              value={draftIncome}
            />
            <p className="text-sm text-[var(--muted-foreground)]">
              รองรับรูปแบบอย่าง `50,000`, `40k`, `50000*1.1`
            </p>
          </motion.div>
        ) : null}

        {step === 2 ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 lg:grid-cols-[18rem_1fr]"
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            key="preview"
            transition={{ duration: 0.18 }}
          >
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-sm text-[var(--muted-foreground)]">Template</p>
              <h3 className="mt-1 text-lg font-semibold">{selectedTemplate.name}</h3>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span>รายได้สุทธิ</span>
                  <strong>{formatCurrency(draftIncome)}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span>จัดสรรรวม</span>
                  <strong>{formatPercent(totals.percent)}</strong>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              {selectedTemplate.allocations.map((allocation) => (
                <div
                  className="grid grid-cols-[1fr_7rem_5rem] items-center gap-3 rounded-md border border-[var(--border)] px-3 py-2 text-sm"
                  key={allocation.id}
                >
                  <span className="truncate">{allocation.name}</span>
                  <span className="text-right font-medium">
                    {formatCurrency(allocation.amount)}
                  </span>
                  <span className="text-right text-[var(--muted-foreground)]">
                    {formatPercent(allocation.percent)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
        </AnimatePresence>

        <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-between">
          <Button
            disabled={step === 0}
            onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))}
            type="button"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            ก่อนหน้า
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={applyTemplate} type="button" variant="secondary">
              <Check className="h-4 w-4" aria-hidden="true" />
              ใช้ template นี้
            </Button>
            <Button
              onClick={() => {
                if (step === stepLabels.length - 1) {
                  applyTemplate();
                  return;
                }

                setStep((currentStep) => Math.min(stepLabels.length - 1, currentStep + 1));
              }}
              type="button"
            >
              {step === stepLabels.length - 1 ? (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
              {step === stepLabels.length - 1 ? "สร้างแผน" : "ถัดไป"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
