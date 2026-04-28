# Personal Finance Planner

แดชบอร์ดวางแผนการเงินส่วนบุคคลสำหรับจัดสรรรายได้รายเดือน ติดตามงบประมาณ วางแผนเงินฉุกเฉิน หนี้ เป้าหมาย และจำลองการลงทุน เหมาะกับการทำแผนการเงินแบบใช้งานจริงและปรับตัวเลขได้เร็ว

## Features

- Budget planner สำหรับจัดสรรรายได้เป็นหมวดหมู่ พร้อมโหมดบาทและเปอร์เซ็นต์
- Dashboard สรุปรายได้ ยอดจัดสรร เงินคงเหลือ และสุขภาพ cashflow
- Emergency fund planner สำหรับประเมินเงินสำรองฉุกเฉิน
- Investment simulator สำหรับจำลอง DCA และผลตอบแทนระยะยาว
- Debt planner และ financial goals สำหรับจัดการหนี้และเป้าหมายการเงิน
- Scenario planner สำหรับเปรียบเทียบแผนหลายแบบ
- Export / Import JSON สำหรับสำรองและนำเข้าแผน
- Dark mode และ Settings page

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Vitest

## Getting Started

ติดตั้ง dependency:

```bash
npm install
```

รัน development server:

```bash
npm run dev
```

เปิดเว็บที่:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
```

รันแอปในโหมด development

```bash
npm run build
```

build production

```bash
npm run lint
```

ตรวจ lint

```bash
npm run test
```

รัน unit tests

## Data

ข้อมูลแผนสามารถ export/import เป็น JSON ได้จากเมนู `Export / Import` ในแอป และ draft จะถูกบันทึกไว้ใน browser local storage
