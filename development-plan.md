# Development Plan: Personal Finance Planner

เอกสารนี้เป็นแผนเริ่มพัฒนาเว็บวางแผนการเงิน แบ่งเป็น phase เพื่อทำงานเป็นลำดับ ตรวจสอบได้ง่าย และลดความเสี่ยงจากการทำหลายฟีเจอร์พร้อมกันเกินไป

## Development Principles

- เริ่มจาก core calculation และ data model ก่อน UI ซับซ้อน
- ทุก phase ต้องมีสิ่งที่ใช้งานได้จริง ไม่ใช่แค่หน้าตา
- ฟีเจอร์ที่กระทบข้อมูลการเงินต้องมี validation ชัดเจน
- ข้อมูลผู้ใช้ต้องอยู่ในเครื่องก่อนด้วย localStorage
- Export/import ต้อง preview ก่อนเขียนทับข้อมูลเดิม
- UI ใช้ shadcn/ui เป็นหลัก และใช้ animation เท่าที่ช่วยให้เข้าใจสถานะ

## Phase 0: Project Setup

### Goal

ตั้งโปรเจกต์ให้พร้อมพัฒนา UI, calculation และ test ได้

### Tasks

- สร้าง Next.js + TypeScript project
- ติดตั้ง Tailwind CSS
- ติดตั้ง shadcn/ui
- ติดตั้ง dependencies:
  - `lucide-react`
  - `recharts`
  - `framer-motion`
  - `react-hook-form`
  - `zod`
  - test runner เช่น `vitest`
- ตั้งค่า path alias เช่น `@/components`, `@/lib`, `@/types`
- เพิ่ม shadcn components ที่ต้องใช้ใน MVP:
  - `button`
  - `card`
  - `input`
  - `label`
  - `select`
  - `tabs`
  - `table`
  - `badge`
  - `slider`
  - `switch`
  - `tooltip`
  - `dialog`
  - `alert`

### Output

- เปิดเว็บหน้าแรกได้
- Tailwind และ shadcn ใช้งานได้
- มีโครง folder เริ่มต้น

### Done When

- `npm run dev` เปิดหน้าเว็บได้
- `npm run lint` ผ่าน
- มีหน้า dashboard เปล่าพร้อม layout พื้นฐาน

## Phase 1: Data Model และ Finance Core

### Goal

สร้างแกนคำนวณให้ถูกต้องก่อนเริ่มผูก UI

### Tasks

- สร้าง type หลัก:
  - `AllocationCategory`
  - `InvestmentScenario`
  - `FinancialPlan`
  - `FinancialGoal`
  - `DebtItem`
  - `ExportedFinanceData`
- สร้าง default plan จาก Net Income 38,425 บาท
- สร้าง utility format:
  - format เงินบาท
  - format เปอร์เซ็นต์
  - format จำนวนปี/เดือน
- สร้าง calculation functions:
  - amount to percent
  - percent to amount
  - total allocation
  - remaining income
  - savings rate
  - investment rate
  - future value จากเงินก้อน
  - future value จาก DCA
  - yearly investment projection
- เพิ่ม unit tests สำหรับ finance calculation

### Output

- `src/types/finance.ts`
- `src/lib/finance.ts`
- `src/lib/format.ts`
- `src/lib/default-plan.ts`
- unit tests สำหรับสูตรสำคัญ

### Done When

- คำนวณ allocation รวมได้ถูกต้อง
- DCA 8,000 บาท 20 ปี ที่ 8% ต่อปี ได้ผลใกล้ 4,706,153 บาท
- test ผ่านทั้งหมด

## Phase 2: MVP Dashboard Layout

### Goal

ทำหน้า dashboard ที่เห็นภาพรวมแผนการเงินได้ทันที

### Tasks

- สร้าง layout หลักของหน้าแรก
- เพิ่ม summary cards:
  - Net Income
  - ค่าใช้จ่ายรวม
  - เงินออม/ลงทุนรวม
  - เงินเหลือหรือเงินขาด
- เพิ่ม responsive grid
- เพิ่ม alert ถ้ายอดรวมเกินรายได้
- เพิ่ม empty/loading state ที่เหมาะสม

### Output

- `src/app/page.tsx`
- `src/components/finance/summary-cards.tsx`
- dashboard ใช้งานบน desktop และ mobile ได้

### Done When

- เห็นแผนตั้งต้น Net Income 38,425 บาท
- summary cards คำนวณจากข้อมูลจริง
- layout ไม่แตกบน mobile

## Phase 3: Allocation Editor

### Goal

ให้ผู้ใช้กรอกเงินเดือนและจัดสรรเงินได้ทั้งแบบบาทและเปอร์เซ็นต์

### Tasks

- สร้าง allocation editor
- แก้ Net Income ได้
- เพิ่ม/ลบ/แก้ชื่อหมวดหมู่ได้
- เลือก input mode เป็น `บาท` หรือ `%`
- แสดง amount และ percent พร้อมกัน
- ทำ real-time validation
- เพิ่ม lock category สำหรับหมวดที่ไม่อยากให้ auto-adjust
- เพิ่มปุ่ม reset เป็น default plan
- เพิ่ม auto-balance เงินเหลือแบบพื้นฐาน

### Output

- `src/components/finance/allocation-editor.tsx`
- `src/components/finance/category-suggestions.tsx`

### Done When

- กรอก 8,000 บาทแล้วเห็น 20.8%
- กรอก 10% แล้วคำนวณเป็น 3,843 บาทเมื่อ Net Income 38,425
- เพิ่ม/ลบ category แล้ว summary update ทันที
- แจ้งเตือนเมื่อรวมเกิน 100%

## Phase 4: Visualization

### Goal

แสดงสัดส่วนการเงินเป็นกราฟที่อ่านง่ายและเปลี่ยนตามข้อมูลจริง

### Tasks

- สร้าง donut chart ด้วย Recharts
- กำหนดสีแต่ละหมวดให้คงที่
- เพิ่ม tooltip
- เพิ่ม legend
- เพิ่ม animation ตอนข้อมูลเปลี่ยน
- เพิ่ม state ซ่อน/แสดงหมวดใน chart

### Output

- `src/components/finance/allocation-chart.tsx`

### Done When

- chart ตรงกับ allocation ปัจจุบัน
- tooltip แสดงชื่อหมวด จำนวนเงิน และเปอร์เซ็นต์
- chart ไม่แตกเมื่อมี category เยอะ

## Phase 5: Investment Simulator

### Goal

จำลองการลงทุนและ DCA ได้ตามระยะเวลา 1, 5, 10, 15, 20, 30 ปี

### Tasks

- สร้าง investment simulator form
- กรอกเงินตั้งต้นได้
- กรอก DCA รายเดือนได้
- ปรับ annual return ได้
- เลือกระยะเวลาจาก preset
- แสดง future value, total contribution, estimated gain
- เพิ่ม line chart มูลค่าพอร์ตตามปี
- เพิ่ม comparison table สำหรับ DCA 8k, 10k, 20k
- เพิ่ม sensitivity table สำหรับ 4%, 6%, 8%, 10%, 12%

### Output

- `src/components/finance/investment-simulator.tsx`
- `src/components/finance/scenario-comparison-table.tsx`

### Done When

- เปรียบเทียบ DCA 8k/10k/20k ระยะ 20 ปีได้
- เปลี่ยน return assumption แล้ว chart และ table update ทันที
- มี disclaimer ว่าเป็นการจำลอง ไม่ใช่คำแนะนำการลงทุน

## Phase 6: Guided Input UX

### Goal

ทำให้ผู้ใช้เริ่มกรอกข้อมูลได้ง่าย ไม่ต้องเข้าใจทุกช่องตั้งแต่แรก

### Tasks

- สร้าง guided setup wizard
- เพิ่ม quick start templates:
  - Current Plan
  - 50/30/20
  - Aggressive Investor
  - Family Support
  - Debt Payoff
- เพิ่ม smart defaults จาก template
- เพิ่ม inline calculator input:
  - `8k`
  - `1.5m`
  - `38425*0.1`
  - `12000+3500`
- เพิ่ม category autocomplete
- เพิ่ม bulk paste dialog พร้อม preview
- เพิ่ม mobile sticky summary bar

### Output

- `src/components/finance/guided-setup-wizard.tsx`
- `src/components/finance/inline-calculator-input.tsx`
- `src/components/finance/bulk-paste-dialog.tsx`
- `src/lib/templates.ts`
- `src/lib/calculators.ts`

### Done When

- ผู้ใช้สร้างแผนแรกจาก template ได้ภายในไม่กี่คลิก
- paste รายการหลายบรรทัดแล้วแปลงเป็น category ได้
- inline calculator ไม่ใช้ `eval`
- mobile input ใช้งานง่าย

## Phase 7: Emergency Fund และ Cashflow Health

### Goal

เพิ่มคำแนะนำพื้นฐานว่าการเงินรายเดือนตึงหรือปลอดภัยแค่ไหน

### Tasks

- สร้าง emergency fund planner
- กรอกเงินฉุกเฉินปัจจุบันได้
- เลือกเป้าหมาย 3, 6, 12 เดือนได้
- คำนวณเดือนที่ต้องใช้ถึงเป้า
- สร้าง cashflow health check
- คำนวณ savings rate, investment rate, fixed cost ratio
- แสดง rule-based warning เบื้องต้น

### Output

- `src/components/finance/emergency-fund-planner.tsx`
- `src/components/finance/cashflow-health.tsx`

### Done When

- เห็นเป้าหมายเงินฉุกเฉินจากค่าใช้จ่ายจำเป็น
- เห็นสถานะ `ดี`, `ตึง`, หรือ `เสี่ยง`
- มีคำเตือนเมื่อแผนลงทุนหนักเกินไปเมื่อเทียบกับเงินเหลือ

## Phase 8: Scenario Planning

### Goal

ให้ผู้ใช้เทียบแผนหลายแบบก่อนตัดสินใจ

### Tasks

- สร้าง scenario planner
- duplicate แผนปัจจุบันเป็น scenario ใหม่ได้
- ปรับ Net Income, DCA, expense และ return ต่อ scenario ได้
- เทียบผลลัพธ์ข้างกัน
- เพิ่ม scenario preset:
  - ลด DCA เพื่อเก็บเงินฉุกเฉิน
  - เพิ่ม DCA
  - เงินเดือนเพิ่ม
  - ค่าใช้จ่ายเพิ่ม

### Output

- `src/components/finance/scenario-planner.tsx`
- `src/lib/scenarios.ts`

### Done When

- สร้างอย่างน้อย 2 scenarios แล้วเทียบได้
- แต่ละ scenario มีผลลัพธ์ DCA และ cashflow ของตัวเอง
- import data เป็น scenario ใหม่ได้ใน phase ถัดไป

## Phase 9: Export / Import Data

### Goal

ให้ผู้ใช้ส่งข้อมูลทั้งหมดที่กรอกให้เพื่อน หรือย้ายเครื่องได้อย่างปลอดภัย

### Tasks

- สร้าง export/import dialog
- Export JSON ข้อมูลทั้งหมด:
  - metadata
  - profile
  - allocations
  - investment scenarios
  - goals
  - debts
  - expenses
  - monthly reviews
  - settings
- เพิ่มตัวเลือกก่อน export:
  - include actual expenses
  - include notes
  - anonymize before export
- สร้าง import preview
- validate JSON ด้วย schema version
- รองรับ import mode:
  - Replace all
  - Merge
  - Import as scenario
- ป้องกันการเขียนทับโดยไม่ยืนยัน
- เพิ่ม download file ชื่ออ่านง่าย เช่น `finance-plan-2026-04-28.json`

### Output

- `src/components/finance/export-import-dialog.tsx`
- `src/components/finance/import-preview.tsx`
- `src/lib/export-import.ts`
- `src/lib/import-validation.ts`
- `src/types/import-export.ts`

### Done When

- export JSON แล้ว import กลับมาได้ข้อมูลครบ
- import ไฟล์ผิด format แล้วมี error ที่เข้าใจได้
- import as scenario ไม่ทับแผนเดิม
- anonymize แล้วไม่ติด note หรือชื่อส่วนตัวที่เลือกซ่อน

## Phase 10: Persistence และ State Management

### Goal

ทำให้ข้อมูลไม่หายเมื่อ refresh และรองรับการขยายฟีเจอร์

### Tasks

- สร้าง storage layer
- เก็บข้อมูลใน localStorage
- เพิ่ม schema version
- เพิ่ม migration function สำหรับข้อมูลเก่า
- เพิ่ม autosave draft
- เพิ่ม last saved timestamp
- เพิ่ม reset ราย section
- พิจารณา Zustand ถ้า state เริ่มซับซ้อน

### Output

- `src/lib/storage.ts`
- `src/lib/migrations.ts`
- optional `src/store/finance-store.ts`

### Done When

- refresh แล้วข้อมูลยังอยู่
- schema เก่าถูก migrate ได้
- reset เฉพาะ allocation หรือ simulator ได้

## Phase 11: Goals, Debt และ Expense Tracker

### Goal

ขยายจากแผนรายเดือนเป็นเครื่องมือวางแผนการเงินที่ครบขึ้น

### Tasks

- Financial goals:
  - target amount
  - current amount
  - target date
  - monthly saving required
- Debt planner:
  - balance
  - interest rate
  - minimum payment
  - payoff month
  - avalanche vs snowball
- Expense tracker แบบเบา:
  - planned vs actual
  - budget used
  - warning เมื่อเกิน 80%

### Output

- `src/components/finance/financial-goals.tsx`
- `src/components/finance/debt-planner.tsx`
- `src/components/finance/expense-tracker.tsx`
- `src/lib/goals.ts`
- `src/lib/debt.ts`

### Done When

- ตั้ง goal แล้วรู้ว่าต้องออมเดือนละเท่าไหร่
- กรอกหนี้แล้วเห็น payoff estimate
- กรอก expense จริงแล้วเทียบกับงบได้

## Phase 12: Polish, Accessibility และ QA

### Goal

ทำให้เว็บพร้อมใช้งานจริงบน desktop และ mobile

### Tasks

- ตรวจ responsive ทุก breakpoint
- ตรวจ keyboard navigation
- ตรวจ focus states
- เพิ่ม `prefers-reduced-motion`
- ตรวจ contrast สี
- เพิ่ม loading และ empty states
- เพิ่ม error states ที่อ่านง่าย
- เพิ่ม chart fallback เมื่อไม่มีข้อมูล
- ทดสอบบน mobile viewport
- ตรวจว่าไม่มี text overflow ในปุ่ม card และ table

### Output

- UI พร้อมใช้งานจริง
- bug list ถูกแก้ก่อนส่งมอบ

### Done When

- desktop และ mobile ใช้งาน flow หลักได้ครบ
- lint/test ผ่าน
- ไม่มี console error หลัก
- export/import ใช้งานได้จริง

## Suggested Milestones

| Milestone | Phase | Result |
|---|---|---|
| M1 | Phase 0-2 | เปิด dashboard และเห็นแผนตั้งต้น |
| M2 | Phase 3-5 | แก้ allocation และจำลอง DCA ได้ |
| M3 | Phase 6-7 | กรอกง่ายขึ้น พร้อม emergency/cashflow check |
| M4 | Phase 8-10 | มี scenario, export/import และ persistence |
| M5 | Phase 11-12 | เพิ่ม goals/debt/expense และ polish |

## Recommended Build Order

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 5
6. Phase 4
7. Phase 10
8. Phase 9
9. Phase 6
10. Phase 7
11. Phase 8
12. Phase 11
13. Phase 12

เหตุผล: เริ่มจาก calculation และ editor ก่อน แล้วค่อยเพิ่ม chart/simulator/persistence เพื่อให้ทุกอย่างมีข้อมูลจริงรองรับ หลังจากนั้นค่อยเพิ่ม UX ช่วยกรอกและฟีเจอร์วิเคราะห์เชิงลึก

## MVP Scope ที่ควรทำก่อน

ถ้าต้องการเริ่มแบบเร็ว ให้ทำเฉพาะรายการนี้ก่อน:

- Dashboard layout
- Net Income input
- Allocation editor บาท/เปอร์เซ็นต์
- Donut chart
- Investment simulator
- DCA comparison 8k/10k/20k
- Emergency fund planner
- Cashflow health check
- localStorage
- Export/import JSON

## Risks

- ฟีเจอร์เยอะเกินไปทำให้ MVP ช้า ควรล็อก scope ตาม phase
- สูตรการเงินต้องมี test เพราะตัวเลขผิดจะทำให้ผู้ใช้ตัดสินใจผิด
- Export/import ต้องระวังการเขียนทับข้อมูล
- Chart บนมือถืออาจอ่านยาก ต้องมี table summary ควบคู่
- Inline calculator ห้ามใช้ `eval` ควร parse เฉพาะ expression ที่รองรับ

## Definition of Done

- ฟีเจอร์ทำงานจากข้อมูลจริง ไม่ใช่ mock ถาวร
- validation ครอบคลุม input สำคัญ
- responsive บนมือถือ
- มี loading/empty/error state ที่เหมาะสม
- test ผ่านสำหรับ calculation สำคัญ
- ไม่มีข้อมูลผู้ใช้หายเมื่อ refresh
- export/import ข้อมูลได้โดยไม่ทำลายแผนเดิมโดยไม่ยืนยัน
