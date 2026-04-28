export const categorySuggestions = [
  { name: "ค่าอาหาร", kind: "necessary", color: "#dc2626" },
  { name: "ค่าเดินทาง", kind: "necessary", color: "#ea580c" },
  { name: "ค่าเช่า/ที่พัก", kind: "fixed", color: "#7c3aed" },
  { name: "ครอบครัว", kind: "family", color: "#2563eb" },
  { name: "ประกัน", kind: "fixed", color: "#9333ea" },
  { name: "Subscription", kind: "fixed", color: "#9333ea" },
  { name: "ลงทุน", kind: "investing", color: "#16a34a" },
  { name: "เงินฉุกเฉิน", kind: "saving", color: "#f59e0b" },
  { name: "Lifestyle", kind: "lifestyle", color: "#0891b2" },
] as const;

export function CategorySuggestions() {
  return (
    <datalist id="category-suggestions">
      {categorySuggestions.map((category) => (
        <option key={category.name} value={category.name} />
      ))}
    </datalist>
  );
}
