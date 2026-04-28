"use client";

import { motion } from "framer-motion";
import type React from "react";
import { Download, Globe2, RotateCcw, Save, Settings, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import type { FinancialPlan } from "@/types/finance";

type SettingsPanelProps = {
  lastSavedAt: string | null;
  onExportImport: () => void;
  onResetPlan: () => void;
  onSettingsChange: (settings: FinancialPlan["settings"]) => void;
  settings: FinancialPlan["settings"];
};

export function SettingsPanel({
  lastSavedAt,
  onExportImport,
  onResetPlan,
  onSettingsChange,
  settings,
}: SettingsPanelProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--card)_0%,var(--muted)_100%)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Settings className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>ตั้งค่าการแสดงผล ข้อมูล และไฟล์แผนการเงิน</CardDescription>
            </div>
          </div>
          <Badge className="w-fit bg-[var(--muted)] text-[var(--muted-foreground)]">
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {lastSavedAt ? `Saved ${formatSavedTime(lastSavedAt)}` : "Draft not saved yet"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 p-5 md:grid-cols-2">
        <SettingsTile
          description="สลับโหมดสีของแอป ระบบจะจำค่าที่เลือกไว้ใน browser"
          icon={Globe2}
          title="Appearance"
        >
          <ThemeToggle />
        </SettingsTile>

        <SettingsTile
          description="ใช้สกุลเงินและรูปแบบตัวเลขสำหรับการคำนวณใน dashboard"
          icon={Wallet}
          title="Money Format"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="settings-currency">Currency</Label>
              <Select
                id="settings-currency"
                onChange={(event) =>
                  onSettingsChange({
                    ...settings,
                    currency: event.target.value as FinancialPlan["settings"]["currency"],
                  })
                }
                value={settings.currency}
              >
                <option value="THB">THB</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="settings-locale">Locale</Label>
              <Select
                id="settings-locale"
                onChange={(event) =>
                  onSettingsChange({
                    ...settings,
                    locale: event.target.value as FinancialPlan["settings"]["locale"],
                  })
                }
                value={settings.locale}
              >
                <option value="th-TH">th-TH</option>
              </Select>
            </div>
          </div>
        </SettingsTile>

        <SettingsTile
          description="ส่งออก backup หรือนำเข้าแผนที่เคยบันทึกไว้"
          icon={Download}
          title="Export / Import"
        >
          <Button onClick={onExportImport} type="button" variant="outline">
            <Download className="h-4 w-4" aria-hidden="true" />
            Export / Import
          </Button>
        </SettingsTile>

        <SettingsTile
          description="ล้างแผนปัจจุบันและกลับไปใช้ค่าเริ่มต้นของระบบ"
          icon={RotateCcw}
          title="Reset"
        >
          <Button onClick={onResetPlan} type="button" variant="secondary">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset all
          </Button>
        </SettingsTile>
      </CardContent>
    </Card>
  );
}

function SettingsTile({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="grid content-start gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--muted)] text-[var(--foreground)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </motion.section>
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
