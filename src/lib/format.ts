const thbFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return thbFormatter.format(sanitizeNumber(value));
}

export function formatNumber(value: number) {
  return numberFormatter.format(sanitizeNumber(value));
}

export function formatPercent(value: number, fractionDigits = 1) {
  return `${sanitizeNumber(value).toFixed(fractionDigits)}%`;
}

export function formatDuration(years: number) {
  if (years < 1) {
    const months = Math.round(years * 12);
    return `${months} เดือน`;
  }

  return `${years} ปี`;
}

function sanitizeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}
