import { memo } from "react";
import { Chart, DataTable } from "./Charts";
import { dashboardChannels, dashboardData } from "./dashboardData";
import {
  defaultDashboardPeriod,
  dashboardRevenue,
  formatPeriodMetrics,
} from "./dashboardPeriods";

export default memo(function DashboardPreview({
  item,
  compact = false,
  period = defaultDashboardPeriod,
  region = "",
  channel = "",
  month = "",
  onRegionSelect,
  onChannelSelect,
  onMonthSelect,
}) {
  const labels = item.metrics || [
    "Receita total",
    "Pedidos",
    "Ticket médio",
    "Margem",
  ];
  const values = item.values || ["R$ 124.500", "1.284", "R$ 96,96", "28,4%"];
  const seed = item.seed ?? 1;
  const revenue = dashboardRevenue(values, labels);
  const { months, fraction, pace, scopeShare, channels, regions } =
    dashboardData(seed, period, region, channel, month, revenue?.total);
  const tableRows = channel
    ? channels.filter(({ name }) => name === channel)
    : channels;
  const filteredRevenue = tableRows.reduce(
    (total, row) => total + row.value,
    0,
  );
  const metrics =
    period.id === "all" && !region && !channel && !month
      ? values
      : formatPeriodMetrics(
          values,
          labels,
          item.category,
          fraction,
          pace,
          scopeShare,
          revenue && { index: revenue.index, value: filteredRevenue },
        );
  const periodLabel = `${period.label} de 2025`;
  const dateLabel = month ? `${month} de 2025` : periodLabel;
  const regionalLabel = [dateLabel, region].filter(Boolean).join(" · ");
  const scopeLabel = [regionalLabel, channel].filter(Boolean).join(" · ");
  const trendLabel = [periodLabel, region, channel].filter(Boolean).join(" · ");
  return (
    <div
      className={`dashboard-preview ${compact ? "compact" : ""}`}
      style={{ "--dashboard-accent": item.colors[1] }}
      data-background="#F3F6FA"
    >
      <div className="dash-top">
        <div>
          <span className="dash-brand">
            <i /> INSIGHT / {item.category?.toUpperCase() || "COMERCIAL"}
          </span>
          <h3>{item.name || "Performance comercial"}</h3>
          <small>Visão geral dos resultados · Dados fictícios</small>
        </div>
        <span className="dash-period">{scopeLabel}</span>
      </div>
      <div className="dash-kpis">
        {labels.map((label, i) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{metrics[i]}</strong>
            <small>{regionalLabel} · Simulação</small>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="dash-panel">
          <h4>
            {item.layout === 1
              ? "Comparativo mensal"
              : "Evolução dos resultados"}
            {onMonthSelect ? (
              <span className="no-export">Selecione um mês</span>
            ) : (
              <span>
                Atual <b>●</b>
              </span>
            )}
          </h4>
          <Chart
            type={
              item.layout === 1 ? "bar" : item.layout === 2 ? "line" : "area"
            }
            colors={item.colors}
            data={months}
            label={`Evolução mensal, ${trendLabel}`}
            compact={compact}
            selectedCategory={month}
            onCategorySelect={onMonthSelect}
            categoryLabel="mês"
            selectableTicks
          />
        </div>
        <div className="dash-panel">
          <h4>
            Participação por canal
            {onChannelSelect && (
              <span className="no-export">Selecione uma fatia</span>
            )}
          </h4>
          <Chart
            type="donut"
            colors={item.colors}
            data={channels}
            label={`Participação por canal, ${regionalLabel}`}
            compact={compact}
            selectedCategory={channel}
            onCategorySelect={onChannelSelect}
            categoryLabel="canal"
          />
          <div className="chart-legend">
            {channels.map(({ name }, i) => (
              <span key={name}>
                <i style={{ background: item.colors[i] }} />
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="dash-panel">
          <h4>
            Resultados por região
            {onRegionSelect && (
              <span className="no-export">Selecione uma barra</span>
            )}
          </h4>
          <Chart
            type="bar"
            colors={item.colors}
            data={regions}
            label={`Resultados por região, ${[dateLabel, channel].filter(Boolean).join(" · ")}`}
            compact={compact}
            selectedCategory={region}
            onCategorySelect={onRegionSelect}
          />
        </div>
        <div className="dash-panel">
          <h4>Desempenho dos canais</h4>
          <DataTable
            rows={tableRows}
            colors={tableRows.map(
              ({ name }) => item.colors[dashboardChannels.indexOf(name)],
            )}
            label={[
              "Desempenho dos canais",
              region || "Todas as regiões",
              channel,
              month && dateLabel,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        </div>
      </div>
      <div className="dash-foot">
        DATAVIZ HUB <span>Modelo original · Dados demonstrativos</span>
      </div>
    </div>
  );
});
