# แผนพัฒนาเว็บวางแผนการเงินส่วนบุคคล

## เป้าหมาย

สร้างเว็บสำหรับวางแผนการเงินจากรายได้สุทธิรายเดือน โดยผู้ใช้สามารถกรอกเงินเดือน ค่าใช้จ่าย การออม และการลงทุนได้ทั้งแบบจำนวนเงินบาทหรือสัดส่วนเปอร์เซ็นต์ พร้อมกราฟวงกลมแสดงสัดส่วน และเครื่องมือจำลองการเติบโตของเงินลงทุนในอนาคตจากการลงทุนก้อนเดียวและ DCA รายเดือน

## Tech Stack

- Framework: Next.js + TypeScript
- UI: shadcn/ui
- Styling: Tailwind CSS
- Chart: Recharts หรือ Visx
- Animation: Framer Motion
- Form: React Hook Form + Zod
- State: Zustand หรือ React state ถ้า scope ยังเล็ก
- Currency: `Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" })`

## หน้าหลักของเว็บ

หน้าแรกควรเป็น dashboard ใช้งานจริงทันที ไม่ต้องทำ landing page

โครงสร้างหน้าจอ:

1. แถบสรุปด้านบน
   - รายได้สุทธิรายเดือน
   - ค่าใช้จ่ายรวม
   - เงินลงทุนรวม
   - เงินเหลือหรือเงินขาด

2. ส่วนกรอกแผนการเงิน
   - กรอก Net Income
   - เพิ่ม/ลบหมวดหมู่เองได้
   - แต่ละหมวดเลือกได้ว่าใช้ `บาท` หรือ `%`
   - ถ้ากรอกเป็นเปอร์เซ็นต์ ระบบคำนวณเงินบาทจาก Net Income
   - ถ้ากรอกเป็นเงินบาท ระบบคำนวณเปอร์เซ็นต์กลับให้
   - ตรวจสอบว่ายอดรวมเท่ากับ 100% หรือเกินรายได้หรือไม่

3. กราฟสัดส่วน
   - กราฟวงกลม หรือ donut chart
   - animation ตอนโหลดและตอนเปลี่ยนตัวเลข
   - legend แสดงสี ชื่อหมวด จำนวนเงิน และเปอร์เซ็นต์
   - tooltip เมื่อ hover บนแต่ละ slice

4. เครื่องมือจำลองการลงทุน
   - เงินลงทุนตั้งต้น
   - DCA รายเดือน
   - ผลตอบแทนคาดหวังต่อปี
   - ระยะเวลา: 1, 5, 10, 15, 20, 30 ปี
   - ตัวเลือกพอร์ต เช่น `กองทุนดัชนี`, `ETF`, หรือกำหนดเอง
   - แสดงผลเป็น line chart และ summary cards

5. ตารางเปรียบเทียบ DCA
   - เปรียบเทียบ DCA 8,000 / 10,000 / 20,000 บาทต่อเดือน
   - แสดงเงินต้นรวม ผลตอบแทนคาดการณ์ และมูลค่ารวม
   - เน้นความต่างเมื่อผ่านไป 20 ปี

## shadcn/ui Components ที่ใช้

- `Button`
- `Card`
- `Input`
- `Label`
- `Select`
- `Tabs`
- `Table`
- `Badge`
- `Slider`
- `Switch`
- `Separator`
- `Tooltip`
- `Dialog`
- `Alert`

แนวทาง UI:

- ใช้ layout แบบ dashboard ที่อ่านง่าย
- ไม่ใช้ hero section
- ใช้ card เฉพาะกล่องข้อมูล เครื่องมือคำนวณ และตาราง
- สีควรแยกหมวดหมู่ชัดเจน ไม่ใช้โทนเดียวทั้งหน้า
- ปุ่ม action ใช้ icon จาก lucide-react เช่น `Plus`, `Trash2`, `Calculator`, `PieChart`, `TrendingUp`
- รองรับมือถือ โดยส่วน form, chart และ table ต้องเรียงเป็นแนวตั้งเมื่อจอแคบ

## Animation

ใช้ Framer Motion สำหรับ:

- fade/slide in ของ summary cards
- animated number ตอนยอดเงินเปลี่ยน
- transition ของ donut chart
- row animation เมื่อเพิ่ม/ลบหมวดหมู่
- chart line animation ตอนเปลี่ยนสมมติฐานผลตอบแทน

Animation ต้องสั้นและไม่รบกวนการอ่าน:

- duration ประมาณ 150-350ms
- easing แบบ `easeOut`
- เคารพ `prefers-reduced-motion`

## Data Model

```ts
type AllocationInputMode = "amount" | "percent";

type AllocationCategory = {
  id: string;
  name: string;
  amount: number;
  percent: number;
  mode: AllocationInputMode;
  note?: string;
  color: string;
};

type InvestmentScenario = {
  id: string;
  name: string;
  initialAmount: number;
  monthlyContribution: number;
  annualReturnPercent: number;
  years: number;
};
```

## สูตรคำนวณ

### แปลงจำนวนเงินกับเปอร์เซ็นต์

```ts
percent = amount / netIncome * 100;
amount = netIncome * percent / 100;
```

### Future Value จากเงินก้อนเดียว

```ts
futureValue = principal * (1 + annualReturn) ** years;
```

### Future Value จาก DCA รายเดือน

สมมติลงทุนปลายเดือน:

```ts
monthlyReturn = annualReturn / 12;
months = years * 12;
futureValue = monthlyContribution * (((1 + monthlyReturn) ** months - 1) / monthlyReturn);
```

ถ้ามีเงินตั้งต้นด้วย:

```ts
futureValue =
  principal * (1 + monthlyReturn) ** months +
  monthlyContribution * (((1 + monthlyReturn) ** months - 1) / monthlyReturn);
```

กรณี annual return เป็น 0%:

```ts
futureValue = principal + monthlyContribution * months;
```

## แผนการเงินตั้งต้น

Net Income: 50,000 บาท

| หมวดหมู่ | จำนวนเงิน (บาท) | สัดส่วน | หมายเหตุ |
|---|---:|---:|---|
| ที่อยู่อาศัยและค่าสาธารณูปโภค | 15,000 | 30.0% | ค่าเช่า/ผ่อนบ้าน ค่าน้ำ ค่าไฟ และอินเทอร์เน็ต |
| ค่าใช้จ่ายประจำวัน | 10,000 | 20.0% | อาหาร เดินทาง และของใช้จำเป็น |
| เงินออมฉุกเฉิน | 10,000 | 20.0% | สะสมสภาพคล่อง 3-6 เดือน |
| ลงทุนระยะยาว | 7,500 | 15.0% | DCA รายเดือนตามระดับความเสี่ยงที่รับได้ |
| ไลฟ์สไตล์และพัฒนาตัวเอง | 7,500 | 15.0% | พักผ่อน เรียนรู้ และค่าใช้จ่ายยืดหยุ่น |
| รวม | 50,000 | 100.0% |  |

## ตัวอย่างผลจำลอง DCA 20 ปี

สมมติฐาน:

- ลงทุนทุกเดือนปลายเดือน
- ไม่มีเงินตั้งต้น
- ผลตอบแทนเฉลี่ย 8% ต่อปี
- ตัวเลขเป็นการจำลอง ไม่ใช่การรับประกันผลตอบแทน
- พอร์ต `QQQM + SCHD` มีความผันผวนจริง และผลตอบแทนจริงอาจต่ำกว่าหรือสูงกว่านี้มาก

| DCA ต่อเดือน | เงินต้นรวม 20 ปี | มูลค่าคาดการณ์ที่ 8% ต่อปี | กำไรคาดการณ์ | ต่างจาก DCA 8,000 |
|---:|---:|---:|---:|---:|
| 8,000 | 1,920,000 | 4,706,153 | 2,786,153 | - |
| 10,000 | 2,400,000 | 5,882,692 | 3,482,692 | +1,176,539 |
| 20,000 | 4,800,000 | 11,765,383 | 6,965,383 | +7,059,230 |

สรุป: ถ้าใช้สมมติฐาน 8% ต่อปี ระยะเวลา 20 ปี การเพิ่ม DCA จาก 8,000 เป็น 10,000 บาทต่อเดือน ทำให้มูลค่าอนาคตเพิ่มประมาณ 1.18 ล้านบาท ส่วนการเพิ่มเป็น 20,000 บาทต่อเดือน ทำให้มูลค่าอนาคตเพิ่มประมาณ 7.06 ล้านบาทเมื่อเทียบกับ 8,000 บาทต่อเดือน

## ตารางจำลองตามระยะเวลา

สมมติ DCA 8,000 บาทต่อเดือน ผลตอบแทนเฉลี่ย 8% ต่อปี ไม่มีเงินตั้งต้น

| ระยะเวลา | เงินต้นรวม | มูลค่าคาดการณ์ |
|---:|---:|---:|
| 1 ปี | 96,000 | 99,595 |
| 5 ปี | 480,000 | 586,962 |
| 10 ปี | 960,000 | 1,463,179 |
| 15 ปี | 1,440,000 | 2,768,253 |
| 20 ปี | 1,920,000 | 4,706,153 |
| 30 ปี | 2,880,000 | 11,913,260 |

## Feature Requirements

### 1. Income และ Allocation

- ผู้ใช้กรอก Net Income ได้
- ค่า default คือ 50,000
- เพิ่มหมวดหมู่ได้
- ลบหมวดหมู่ได้
- แก้ชื่อหมวดหมู่ได้
- เลือก input mode เป็นบาทหรือเปอร์เซ็นต์ได้
- ระบบคำนวณอีกค่าหนึ่งอัตโนมัติ
- แจ้งเตือนถ้ารวมเกิน 100% หรือเกินรายได้
- แจ้งเตือนถ้ายอดรวมต่ำกว่า 100% และแสดงเงินเหลือ

### 2. Visualization

- Donut chart แสดงสัดส่วนรายจ่าย/ลงทุน
- สีแต่ละหมวดต้องคงที่ระหว่าง session
- Tooltip แสดงรายละเอียด
- Legend คลิกเพื่อซ่อน/แสดงหมวดหมู่ได้

### 3. Investment Simulator

- กรอกเงินตั้งต้น
- กรอก DCA รายเดือน
- ปรับ annual return ด้วย input หรือ slider
- เลือกระยะเวลาจาก preset 1, 5, 10, 15, 20, 30 ปี
- แสดง future value, total contribution, estimated gain
- แสดง chart มูลค่าพอร์ตตามปี
- มี scenario เปรียบเทียบ 8k, 10k, 20k

### 4. Persistence

- เก็บข้อมูลใน localStorage ก่อน
- ปุ่ม reset เป็นค่า default
- ปุ่ม export/import ข้อมูลทั้งหมดเป็น JSON
- ปุ่ม export เฉพาะ summary เป็น CSV หรือ PDF ภายหลัง

## ฟีเจอร์ช่วยให้ผู้ใช้กรอกข้อมูลง่ายขึ้น

### 1. Guided Setup Wizard

- เริ่มต้นด้วย wizard 4-6 ขั้นตอน แทนการโยน form ทั้งหมดให้ผู้ใช้ทันที
- Step 1: กรอกรายได้สุทธิรายเดือน
- Step 2: เลือก preset แผนการเงิน เช่น `Balanced`, `เน้นลงทุน`, `เน้นเงินฉุกเฉิน`, `ภาระครอบครัวสูง`
- Step 3: กรอกภาระจำเป็น เช่น ครอบครัว, ค่าเช่า, ค่าเดินทาง, ค่าอาหาร, subscription
- Step 4: กรอกเป้าหมาย เช่น เงินฉุกเฉิน, DCA, ซื้อของใหญ่, เกษียณ
- Step 5: ระบบสรุปแผนแรกให้ แล้วผู้ใช้ค่อยปรับละเอียด
- มี progress indicator ว่ากรอกถึงขั้นไหนแล้ว

### 2. Quick Start Templates

- มี template สำเร็จรูปให้เลือกแล้วเติมตัวเลขอัตโนมัติจากรายได้
- ตัวอย่าง template:
  - `50/30/20`: ค่าใช้จ่ายจำเป็น 50%, lifestyle 30%, ออม/ลงทุน 20%
  - `Aggressive Investor`: ลงทุน 30-40%, lifestyle ต่ำลง
  - `Family Support`: ภาระครอบครัวสูง, กันเงินฉุกเฉินมากขึ้น
  - `Debt Payoff`: ลดลงทุนชั่วคราวเพื่อปิดหนี้ดอกสูง
  - `Starter Plan`: ใช้แผนตั้งต้น Net Income 50,000 บาท
- หลังเลือก template ผู้ใช้แก้ตัวเลขเองได้ทันที

### 3. Smart Defaults

- เติมหมวดหมู่เริ่มต้นให้เลย เช่น ครอบครัว, ค่าอาหาร, เดินทาง, ที่พัก, internet/software, ลงทุน, เงินฉุกเฉิน, lifestyle
- ค่า default อ้างอิงจาก Net Income และ template ที่เลือก
- ถ้าผู้ใช้กรอกเงินเดือนใหม่ ระบบถามว่าจะปรับสัดส่วนตามรายได้ใหม่หรือคงจำนวนเงินบาทเดิม
- จำค่าที่ผู้ใช้กรอกล่าสุดเป็น default ของเดือนถัดไป

### 4. Inline Calculator

- ช่องกรอกตัวเลขรองรับนิพจน์ง่าย ๆ เช่น `12000+3500`, `50000*0.1`, `7500*12`
- รองรับ shorthand เช่น `8k`, `10k`, `1.5m`
- กด enter แล้วแปลงเป็นตัวเลขจริง
- แสดงผล preview ใต้ช่อง เช่น `10% ของ 50,000 = 5,000 บาท`

### 5. Amount / Percent Toggle ที่เข้าใจง่าย

- แต่ละแถวมี toggle `บาท` / `%`
- เมื่อเปลี่ยน mode ระบบไม่ทำให้ค่ากระโดดผิดความตั้งใจ
- แสดงทั้งสองค่าเสมอ เช่น input เป็น 8,000 บาท และข้าง ๆ แสดง `20.8%`
- ถ้า input เป็น 20% ข้าง ๆ แสดง `7,685 บาท`

### 6. Autocomplete และ Category Suggestions

- ตอนเพิ่มหมวดหมู่ มี autocomplete เช่น ค่าอาหาร, ค่าเดินทาง, ค่าเช่า, ครอบครัว, ประกัน, subscription, ลงทุน
- เลือก category แล้วระบบแนะนำ icon, สี และ type เช่น necessary, lifestyle, saving, investing, debt
- หมวดหมู่ที่ใช้บ่อยขึ้นมาอยู่ด้านบน

### 7. Bulk Paste / Table Input

- ผู้ใช้ paste ตารางจาก Excel, Google Sheets หรือข้อความธรรมดาได้
- รองรับ format เช่น:

```txt
ค่าอาหาร 5000
ครอบครัว 12000
ลงทุน 8000
```

- ระบบ parse เป็นรายการหมวดหมู่อัตโนมัติ
- ก่อน import เข้าแผนจริงต้องมี preview ให้ตรวจสอบและแก้ไข

### 8. Duplicate, Split และ Lock Category

- Duplicate category เพื่อสร้างหมวดคล้ายกันเร็วขึ้น
- Split category เช่น แยก `Lifestyle 7,500` เป็น `กินนอกบ้าน`, `ช้อปปิ้ง`, `เที่ยว`
- Lock category ที่เป็นภาระตายตัว เช่น ให้ครอบครัว 12,000 บาท แล้วให้ระบบปรับหมวดอื่นแทน
- มีปุ่ม auto-balance ให้กระจายเงินเหลือไปยังหมวดที่ไม่ได้ lock

### 9. Input Quality Checks

- ตรวจจับค่าที่ดูผิดปกติ เช่น กรอก 800,000 แทน 8,000
- เตือนถ้าหมวดใดสูงผิดปกติเมื่อเทียบกับรายได้
- เตือนถ้ารวมเกินรายได้ทันที โดยไม่ต้องกด submit
- แสดงคำแนะนำแก้ไข เช่น ลด lifestyle, ลด DCA ชั่วคราว, หรือเพิ่มรายได้

### 10. Mobile-first Input

- ใช้ numeric keyboard บนมือถือ
- ปุ่มเพิ่ม/ลบหมวดต้องกดง่าย
- ตารางบนมือถือควรเปลี่ยนเป็น list editor แทน table แน่น ๆ
- มี sticky summary bar ด้านล่าง แสดงยอดรวม เงินเหลือ และปุ่มบันทึก

### 11. Undo / Redo และ Draft Save

- รองรับ undo/redo เมื่อแก้ allocation หรือ scenario
- autosave draft ทุกครั้งที่แก้ข้อมูล
- แสดง timestamp ว่าบันทึกล่าสุดเมื่อไหร่
- มี reset เฉพาะ section เช่น reset allocation, reset simulator, reset goals

### 12. Import Assistant

- เมื่อนำเข้าข้อมูล ระบบแสดง preview ก่อนเขียนทับข้อมูลเดิม
- เลือกได้ว่าจะ `Replace all`, `Merge`, หรือ `Import as new scenario`
- ถ้าข้อมูลซ้ำ ให้เลือกเก็บของเดิมหรือใช้ของใหม่
- ตรวจ version ของไฟล์ import และ migrate schema อัตโนมัติถ้าเป็นไฟล์เก่า

## ฟีเจอร์เพิ่มเติมสำหรับช่วยวางแผนการเงินจริง

### 1. Cashflow Health Check

- แสดงสุขภาพการเงินรายเดือนเป็นสถานะ เช่น `ดี`, `ตึง`, `เสี่ยง`
- คำนวณเงินเหลือหลังหักค่าใช้จ่ายและเงินลงทุน
- แสดง savings rate, investment rate และ fixed cost ratio
- แจ้งเตือนถ้าค่าใช้จ่ายจำเป็นสูงเกิน 50-60% ของรายได้
- แจ้งเตือนถ้าเงินส่วนตัวต่ำเกินไปจนแผนอาจทำต่อเนื่องยาก

### 2. Emergency Fund Planner

- ตั้งเป้ากองทุนฉุกเฉินเป็นจำนวนเดือนของค่าใช้จ่ายจำเป็น เช่น 3, 6, 12 เดือน
- คำนวณเป้าหมายเงินฉุกเฉินจากค่าใช้จ่ายพื้นฐาน + ภาระครอบครัว + fixed cost
- กรอกยอดเงินฉุกเฉินที่มีอยู่ตอนนี้ได้
- คำนวณว่าต้องใช้เวลากี่เดือนถึงเป้า ถ้าออมเดือนละ 5,000 บาท
- แนะนำลำดับความสำคัญ เช่น ถ้ายังไม่มีเงินฉุกเฉิน 3 เดือน ให้ลด DCA ชั่วคราวได้

### 3. Financial Goals

- เพิ่มเป้าหมายการเงินได้หลายรายการ เช่น ซื้อคอม, เรียนต่อ, ท่องเที่ยว, ดาวน์บ้าน, เกษียณ
- แต่ละเป้าหมายมี target amount, target date, current amount และ monthly saving
- ระบบคำนวณว่าต้องออมเดือนละเท่าไหร่ถึงทันเวลา
- แสดง progress bar และสถานะ `ทันแผน` / `ต้องเพิ่มเงินออม` / `เลื่อนเวลา`
- แยกเป้าหมายระยะสั้น ระยะกลาง ระยะยาว

### 4. Debt Planner

- กรอกหนี้แต่ละรายการได้ เช่น บัตรเครดิต, ผ่อนของ, กยศ., สินเชื่อ
- ระบุยอดหนี้ ดอกเบี้ยต่อปี และยอดจ่ายขั้นต่ำ
- คำนวณเดือนที่ต้องใช้ในการปิดหนี้
- เปรียบเทียบวิธีจ่ายแบบ avalanche คือปิดหนี้ดอกสูงก่อน กับ snowball คือปิดก้อนเล็กก่อน
- แจ้งเตือนถ้าดอกเบี้ยหนี้สูงกว่าผลตอบแทนลงทุนคาดหวัง ควรพิจารณาปิดหนี้ก่อนลงทุนเพิ่ม

### 5. Expense Tracker แบบเบา

- เพิ่มรายการใช้จ่ายจริงระหว่างเดือนได้
- ผูก expense เข้ากับหมวดหมู่ในแผน
- แสดง budget used ของแต่ละหมวด เช่น ใช้ไปแล้ว 65%
- แจ้งเตือนเมื่อหมวดใดใช้เกิน 80% หรือเกินงบ
- สรุป planned vs actual รายเดือน

### 6. Scenario Planning

- สร้าง scenario ได้หลายแบบ เช่น `แผนปัจจุบัน`, `เพิ่ม DCA`, `ลด DCA เพื่อเก็บเงินฉุกเฉิน`, `ย้ายงานเงินเดือนเพิ่ม`
- เปรียบเทียบผลลัพธ์ข้างกัน
- ปรับ Net Income, expense, DCA และ return assumption ต่อ scenario ได้
- แสดงผลกระทบต่อเงินเหลือ เงินฉุกเฉิน และพอร์ตลงทุนในอนาคต

### 7. Income Growth Simulator

- จำลองเงินเดือนเพิ่มปีละกี่เปอร์เซ็นต์
- ตั้ง rule ได้ว่าเมื่อรายได้เพิ่ม ให้แบ่งส่วนเพิ่มไปลงทุน/ออม/ใช้ส่วนตัวกี่เปอร์เซ็นต์
- แสดงผลว่า lifestyle inflation กระทบเงินลงทุนระยะยาวเท่าไหร่
- ใช้เปรียบเทียบกรณีเงินเดือนคงที่กับเงินเดือนโต

### 8. Portfolio Allocation และ Risk

- กรอกสัดส่วนพอร์ต เช่น QQQM 70%, SCHD 30%
- กำหนด expected return แยกต่อ asset ได้
- คำนวณ expected return เฉลี่ยของพอร์ตจากน้ำหนักแต่ละ asset
- แสดง risk label เช่น conservative, balanced, growth, aggressive
- เพิ่ม sensitivity table ที่ลองผลตอบแทน 4%, 6%, 8%, 10%, 12% เพื่อไม่ให้ผู้ใช้ยึดติดกับตัวเลขเดียว

### 9. Drawdown และ Bear Market Simulator

- จำลองปีที่ตลาดติดลบ เช่น -20%, -30%, -40%
- ให้เลือกว่าตลาดตกในปีที่ 1, 5, 10 หรือก่อนถึงเป้าหมาย
- แสดงว่าพอร์ตยังเหลือเท่าไหร่ และต้องใช้เวลากี่ปีในการฟื้นตามสมมติฐาน
- ช่วยให้เห็นความเสี่ยงของการลงทุนใน ETF ที่ผันผวนสูง

### 10. FIRE / Financial Independence Tracker

- คำนวณ annual expense จากค่าใช้จ่ายรายเดือน
- ประเมิน FI number จาก rule เช่น 25x หรือ 30x ของค่าใช้จ่ายต่อปี
- คำนวณว่าจาก DCA ปัจจุบันจะถึง FI ในกี่ปี
- ให้ปรับ withdrawal rate เช่น 3%, 3.5%, 4%
- แสดงผลกระทบถ้าลดค่าใช้จ่ายหรือเพิ่ม DCA

### 11. Tax, Insurance และ Annual Expenses

- เพิ่มรายจ่ายรายปี เช่น ประกัน, ภาษี, คอร์สเรียน, ต่ออายุ software, เที่ยว
- แปลงรายจ่ายรายปีเป็น sinking fund รายเดือน
- เตือนให้กันเงินสำหรับค่าใช้จ่ายที่ไม่ได้เกิดทุกเดือน
- เพิ่ม checklist ประกันพื้นฐาน เช่น ประกันสุขภาพ, ประกันอุบัติเหตุ, ประกันชีวิตถ้ามีคนพึ่งพารายได้

### 12. Recommendation Engine แบบ Rule-based

- สร้างคำแนะนำจากกฎที่โปร่งใส ไม่ใช่ AI ตัดสินใจลอย ๆ
- ตัวอย่างกฎ:
  - ถ้าเงินฉุกเฉินต่ำกว่า 3 เดือน ให้ prioritize emergency fund
  - ถ้าหนี้ดอกเบี้ยสูงเกิน 10% ให้ prioritize debt payoff
  - ถ้า DCA เกิน 30% ของรายได้และเงินส่วนตัวต่ำมาก ให้เตือนเรื่อง sustainability
  - ถ้า fixed cost เกิน 20% ให้แนะนำตรวจ subscription
  - ถ้า planned expense ไม่ครบ 100% ให้แสดงเงินเหลือที่ควรจัดสรร

### 13. Monthly Review

- หน้าสรุปรายเดือนว่าแผนกับของจริงต่างกันเท่าไหร่
- บันทึก note สั้น ๆ ได้ เช่น เดือนนี้มีค่าใช้จ่ายพิเศษอะไร
- แสดง trend 3-6 เดือนของ savings rate, investment rate และ spending
- มีปุ่ม duplicate แผนเดือนก่อนมาใช้กับเดือนใหม่

### 14. Data Export และ Privacy

- Export เป็น JSON สำหรับข้อมูลทั้งหมดที่ผู้ใช้กรอก เพื่อส่งต่อให้เพื่อนหรือย้ายเครื่อง
- Export เป็น CSV สำหรับตาราง allocation, goals, debt, expenses และ scenario comparison
- Export เป็น PDF summary ภายหลัง สำหรับส่งแผนแบบอ่านง่ายโดยไม่ต้องให้ข้อมูลดิบทั้งหมด
- Import ข้อมูลกลับมาได้จาก JSON
- ก่อน import ต้องมี preview และ validation
- เลือก import mode ได้:
  - `Replace all`: เขียนทับข้อมูลเดิมทั้งหมด
  - `Merge`: รวมข้อมูลใหม่เข้ากับข้อมูลเดิม
  - `Import as scenario`: นำเข้าเป็น scenario ใหม่เพื่อเทียบกับแผนเดิม
- Export file ควรมี metadata เช่น app version, schema version, exported date, currency, locale
- มีตัวเลือก `Anonymize before export` เพื่อซ่อนชื่อ scenario, note หรือข้อมูลส่วนตัวก่อนส่งให้เพื่อน
- มีตัวเลือก `Include actual expenses` เพื่อให้ผู้ใช้ตัดสินใจว่าจะส่งประวัติใช้จ่ายจริงไปด้วยหรือไม่
- มีตัวเลือก `Include notes` เพราะ note อาจมีข้อมูลส่วนตัว
- รองรับ share code หรือ compressed JSON ภายหลัง ถ้าต้องการ copy/paste ผ่าน chat
- ข้อมูลอยู่ในเครื่องผู้ใช้ด้วย localStorage หรือ IndexedDB
- ถ้ามี backend ภายหลัง ต้องมีตัวเลือกไม่ sync ข้อมูลการเงินส่วนตัว

ตัวอย่างโครง export JSON:

```json
{
  "metadata": {
    "appName": "Personal Finance Planner",
    "appVersion": "1.0.0",
    "schemaVersion": 1,
    "exportedAt": "2026-04-28T00:00:00.000Z",
    "currency": "THB",
    "locale": "th-TH"
  },
  "profile": {
    "netIncome": 50000
  },
  "allocations": [],
  "investmentScenarios": [],
  "goals": [],
  "debts": [],
  "expenses": [],
  "monthlyReviews": [],
  "settings": {}
}
```

## Priority Roadmap

### MVP

- Guided setup wizard
- Quick start templates
- Smart defaults
- Amount / percent toggle
- Income และ allocation editor
- Donut chart
- Investment simulator
- DCA comparison 8k, 10k, 20k
- Emergency fund planner
- Cashflow health check
- localStorage
- Export/import JSON แบบข้อมูลทั้งหมด

### Version 1.1

- Inline calculator
- Autocomplete และ category suggestions
- Bulk paste / table input
- Import assistant พร้อม preview
- Financial goals
- Scenario planning
- Expense tracker แบบเบา
- Planned vs actual
- Rule-based recommendations

### Version 1.2

- Duplicate, split และ lock category
- Undo/redo
- Export CSV
- Anonymize export
- Debt planner
- Income growth simulator
- Portfolio allocation
- Sensitivity table
- Annual expenses และ sinking fund

### Version 2

- FIRE tracker
- Drawdown simulator
- Monthly review trend
- PDF summary export
- Share code หรือ compressed JSON
- IndexedDB persistence

## Validation

- Net Income ต้องมากกว่า 0
- Amount ต้องไม่ติดลบ
- Percent ต้องไม่ติดลบ
- Annual return อนุญาตช่วง -50% ถึง 50%
- Years ต้องอยู่ในช่วง 1-50 ปี
- Monthly contribution ต้องไม่ติดลบ
- Debt interest rate ต้องไม่ติดลบ และควรกำหนด upper bound เช่น 100%
- Goal target date ต้องมากกว่าวันปัจจุบัน
- Goal target amount ต้องมากกว่า current amount ถ้ายังไม่สำเร็จ
- Emergency fund target months ควรอยู่ในช่วง 1-24 เดือน
- Portfolio allocation รวมกันต้องเท่ากับ 100%
- Scenario name ต้องไม่ว่าง
- Annual expense ต้องไม่ติดลบ
- Import JSON ต้องมี metadata และ schemaVersion
- Import JSON ต้อง validate ทุก section ก่อนบันทึก
- Bulk paste ต้องแสดง preview ก่อนสร้างหมวดหมู่จริง
- Inline calculator ต้องรับเฉพาะนิพจน์ตัวเลขที่ปลอดภัย ไม่ใช้ `eval`
- Export mode ต้องระบุชัดเจนว่าจะรวม expenses และ notes หรือไม่

## Suggested File Structure

```txt
src/
  app/
    page.tsx
  components/
    finance/
      allocation-editor.tsx
      allocation-chart.tsx
      bulk-paste-dialog.tsx
      cashflow-health.tsx
      category-suggestions.tsx
      debt-planner.tsx
      emergency-fund-planner.tsx
      export-import-dialog.tsx
      expense-tracker.tsx
      financial-goals.tsx
      guided-setup-wizard.tsx
      import-preview.tsx
      inline-calculator-input.tsx
      investment-simulator.tsx
      monthly-review.tsx
      portfolio-allocation.tsx
      recommendation-panel.tsx
      scenario-planner.tsx
      scenario-comparison-table.tsx
      summary-cards.tsx
  lib/
    calculators.ts
    debt.ts
    export-import.ts
    finance.ts
    format.ts
    default-plan.ts
    goals.ts
    import-validation.ts
    recommendations.ts
    scenarios.ts
    templates.ts
  types/
    finance.ts
    import-export.ts
```

## Implementation Steps

1. ตั้งค่า Next.js, Tailwind, shadcn/ui
2. เพิ่ม utility สำหรับ format เงินและเปอร์เซ็นต์
3. เพิ่ม finance calculation functions พร้อม unit tests
4. สร้าง templates และ default financial plan จาก Net Income 50,000 บาท
5. สร้าง guided setup wizard
6. สร้าง allocation editor พร้อม amount/percent toggle และ smart defaults
7. สร้าง summary cards และ validation alert
8. สร้าง donut chart
9. สร้าง investment simulator
10. สร้าง comparison table สำหรับ DCA 8k, 10k, 20k
11. เพิ่ม emergency fund planner
12. เพิ่ม cashflow health check
13. เพิ่ม scenario planning แบบพื้นฐาน
14. เพิ่ม rule-based recommendation panel
15. เพิ่ม export/import JSON พร้อม import preview
16. เพิ่ม localStorage persistence
17. เพิ่ม animation และ responsive polish
18. ทดสอบบน desktop และ mobile viewport

## Acceptance Criteria

- ผู้ใช้กรอกเงินเดือนและค่าใช้จ่ายได้ทั้งบาทและเปอร์เซ็นต์
- ผู้ใช้เริ่มจาก wizard หรือ template ได้โดยไม่ต้องสร้างแผนจากศูนย์
- ช่องกรอกช่วยแปลงบาท/เปอร์เซ็นต์และแสดง preview ให้เข้าใจทันที
- ผู้ใช้ paste รายการค่าใช้จ่ายหลายบรรทัดแล้ว preview ก่อนนำเข้าได้
- รวมสัดส่วนแสดงถูกต้อง
- กราฟวงกลมเปลี่ยนตามข้อมูลจริง
- จำลอง DCA ได้ที่ 1, 5, 10, 15, 20, 30 ปี
- เปรียบเทียบ DCA 8k, 10k, 20k ได้
- คำนวณเป้าหมายเงินฉุกเฉินและจำนวนเดือนที่ต้องใช้ถึงเป้าได้
- แสดง cashflow health และ savings/investment rate ได้
- สร้าง scenario อย่างน้อย 2 แบบเพื่อเปรียบเทียบได้
- แสดงคำแนะนำ rule-based จากข้อมูลที่กรอกได้
- Export ข้อมูลทั้งหมดเป็น JSON เพื่อส่งให้เพื่อนได้
- Import JSON กลับมาได้โดยเลือก replace, merge หรือ import as scenario
- Import ต้องมี preview และไม่เขียนทับข้อมูลทันทีโดยไม่ยืนยัน
- Export ต้องเลือกได้ว่าจะรวม expenses และ notes หรือไม่
- UI ใช้ shadcn/ui และ responsive
- มี animation ที่ลื่นแต่ไม่รบกวน
- refresh หน้าแล้วข้อมูลยังอยู่จาก localStorage

## หมายเหตุด้านการเงิน

เครื่องมือนี้ควรแสดง disclaimer ว่าเป็นการจำลองตามสมมติฐาน ไม่ใช่คำแนะนำการลงทุน ผลตอบแทนจริงของ กองทุนดัชนี, ETF หรือ ETF ใด ๆ มีความไม่แน่นอน และควรพิจารณาความเสี่ยง ค่าเงิน ภาษี ค่าธรรมเนียม และระยะเวลาการลงทุนก่อนตัดสินใจ
