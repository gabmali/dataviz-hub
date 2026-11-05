export const dashboardPeriods = [
  { id: "all", label: "Jan–Ago", start: 0, end: 8 },
  { id: "early", label: "Jan–Abr", start: 0, end: 4 },
  { id: "late", label: "Mai–Ago", start: 4, end: 8 },
];

export const defaultDashboardPeriod = dashboardPeriods[0];

export function dashboardRevenue(values, labels) {
  const index = labels.findIndex((label) =>
    ["Receita", "Receitas", "Receita total"].includes(label),
  );
  if (index < 0) return null;
  const match = /^R\$ ([\d.]+)(?:,(\d+))?(?: (mil|mi))?$/.exec(values[index]);
  if (!match) return null;
  const [, integer, decimal = "0", unit] = match;
  const number = Number(`${integer.replaceAll(".", "")}.${decimal}`);
  return {
    index,
    total: Math.round(
      number * (unit === "mi" ? 1_000_000 : unit === "mil" ? 1_000 : 1),
    ),
  };
}

function formatPeriodMetric(
  value,
  label,
  category,
  fraction,
  pace,
  scopeShare,
) {
  const parts = /^(R\$ )?([\d.]+)(?:,(\d+))?(.*)$/.exec(value);
  if (!parts) return value;

  const [, prefix = "", integer, decimal = "", unit] = parts;
  const base = Number(`${integer.replaceAll(".", "")}.${decimal || "0"}`);
  const isRate = /^[%×]|^ min$|^ \/ 10$/.test(unit);
  const isAverage = /médio|média/i.test(label);
  const isSnapshot = category === "Estoque" || label === "Colaboradores";
  // Totals follow the volume in the selected months. Rates and snapshots
  // vary around their baseline according to the selected months' average pace.
  const paceFactor = 1 + (pace - 1) * 0.12;
  const factor = isSnapshot
    ? scopeShare * paceFactor
    : isRate || isAverage
      ? paceFactor
      : fraction;
  let result = base * factor;
  if (unit === "%" && base <= 100) result = Math.min(100, result);
  if (unit === " / 10") result = Math.min(10, result);
  return `${prefix}${result.toLocaleString("pt-BR", {
    minimumFractionDigits: decimal.length,
    maximumFractionDigits: decimal.length,
  })}${unit}`;
}

export function formatPeriodMetrics(
  values,
  labels,
  category,
  fraction,
  pace,
  scopeShare,
  revenue,
) {
  const metrics = values.map((value, i) =>
    formatPeriodMetric(value, labels[i], category, fraction, pace, scopeShare),
  );
  const displayedNumber = (i) =>
    Number(metrics[i].replace(/[^\d,]/g, "").replace(",", "."));
  const percent = (value, digits) =>
    value.toLocaleString("pt-BR", {
      style: "percent",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  const money = (value) => `R$ ${value.toLocaleString("pt-BR")}`;
  if (revenue) metrics[revenue.index] = money(revenue.value);

  if (category === "Vendas") {
    metrics[2] = (displayedNumber(0) / displayedNumber(1)).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      },
    );
  } else if (category === "Financeiro") {
    metrics[2] = money(displayedNumber(0) - displayedNumber(1));
    metrics[3] = percent(displayedNumber(2) / displayedNumber(0), 1);
  } else if (category === "E-commerce") {
    metrics[2] = percent(displayedNumber(3) / displayedNumber(1), 2);
  }
  return metrics;
}
