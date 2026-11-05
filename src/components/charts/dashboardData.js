export const dashboardRegions = [
  "Sul",
  "Sudeste",
  "Centro-Oeste",
  "Norte",
  "Nordeste",
];
export const dashboardChannels = ["Online", "Lojas", "Parceiros", "Direto"];
export const dashboardMonths = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
];
const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);

export function demoData(seed = 1) {
  return dashboardMonths.map((name, i) => ({
    name,
    value: Math.round(
      28 + (Math.sin(i * 1.6 + seed) + 1) * 20 + i * 6 + (seed % 13),
    ),
    target: 45 + i * 5,
    previous: 20 + i * 5,
  }));
}

function monthlyWeights(series) {
  return series[0].map((_, month) => {
    const total = series.reduce((acc, rows) => acc + rows[month].value, 0);
    return series.map((rows) => rows[month].value / total);
  });
}

function splitRevenue(total, weights) {
  let cumulative = 0;
  let allocated = 0;
  return weights.map((weight, index) => {
    cumulative += weight;
    const next =
      index === weights.length - 1 ? total : Math.round(total * cumulative);
    const value = next - allocated;
    allocated = next;
    return value;
  });
}

export function dashboardData(
  seed,
  period,
  region,
  channel,
  month,
  revenueTotal,
) {
  const national = demoData(seed);
  const channelSeries = dashboardChannels.map((_, i) =>
    demoData(seed + (i + 1) * 3),
  );
  const regionWeights = monthlyWeights(
    dashboardRegions.map((_, i) => demoData(seed + (i + 1) * 7)),
  );
  const channelWeights = monthlyWeights(channelSeries);
  // The same monthly proportions split totals by region and channel.
  const forScope = (rows, regionIndex, channelIndex = -1) => {
    if (regionIndex < 0 && channelIndex < 0) return rows;
    return rows.map(({ name, value, target, previous }, month) => {
      const weight =
        (regionWeights[month][regionIndex] ?? 1) *
        (channelWeights[month][channelIndex] ?? 1);
      return {
        name,
        value: value * weight,
        target: target * weight,
        previous: previous * weight,
      };
    });
  };
  const inPeriod = (rows) => rows.slice(period.start, period.end);
  const monthIndex = dashboardMonths.indexOf(month);
  const inDateScope = (rows) =>
    monthIndex >= period.start && monthIndex < period.end
      ? rows.slice(monthIndex, monthIndex + 1)
      : inPeriod(rows);
  const regionIndex = dashboardRegions.indexOf(region);
  const channelIndex = dashboardChannels.indexOf(channel);
  const scopedYear = forScope(national, regionIndex, channelIndex);
  const months = inPeriod(scopedYear);
  const selectedMonths = inDateScope(scopedYear);
  const volume = sum(selectedMonths, "value");
  const scopedTotal = sum(scopedYear, "value");
  const nationalTotal = sum(national, "value");
  const totalRevenue =
    revenueTotal ??
    channelSeries.reduce((total, series) => total + sum(series, "value"), 0) *
      40;
  // Allocate integer reais once per month, region and channel so all filtered sums reconcile.
  const monthlyRevenue = splitRevenue(
    totalRevenue,
    national.map(({ value }) => value / nationalTotal),
  );
  const revenueByChannel = dashboardChannels.map(() => 0);
  monthlyRevenue.forEach((revenue, index) => {
    if (
      index < period.start ||
      index >= period.end ||
      (monthIndex >= period.start &&
        monthIndex < period.end &&
        index !== monthIndex)
    )
      return;
    splitRevenue(revenue, regionWeights[index]).forEach(
      (regionalRevenue, i) => {
        if (regionIndex >= 0 && i !== regionIndex) return;
        splitRevenue(regionalRevenue, channelWeights[index]).forEach(
          (amount, j) => {
            revenueByChannel[j] += amount;
          },
        );
      },
    );
  });

  return {
    months: months.map(({ name, value, target, previous }) => ({
      name,
      value: Math.round(value),
      target: Math.round(target),
      previous: Math.round(previous),
    })),
    fraction: volume / nationalTotal,
    pace: (volume / scopedTotal) * (national.length / selectedMonths.length),
    scopeShare: scopedTotal / nationalTotal,
    channels: dashboardChannels.map((name, i) => {
      const rows = inDateScope(forScope(national, regionIndex, i));
      return {
        name,
        value: revenueByChannel[i],
        achievement: Math.round(
          (sum(rows, "value") / sum(rows, "target")) * 100,
        ),
      };
    }),
    regions: dashboardRegions.map((name, i) => {
      const rows = inDateScope(forScope(national, i, channelIndex));
      return {
        name,
        value: Math.round(sum(rows, "value")),
        target: Math.round(sum(rows, "target")),
      };
    }),
  };
}
