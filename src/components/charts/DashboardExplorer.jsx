import { useId, useRef, useState } from "react";
import { Icon } from "../common/UI";
import DashboardPreview from "./DashboardPreview";
import {
  dashboardChannels,
  dashboardMonths,
  dashboardRegions,
} from "./dashboardData";
import {
  dashboardPeriods,
  defaultDashboardPeriod,
} from "./dashboardPeriods";

export default function DashboardExplorer({
  item,
  previewRef,
  embedded = false,
}) {
  const periodLabelId = useId();
  const activeFiltersHeading = useRef(null);
  const [period, setPeriod] = useState(defaultDashboardPeriod);
  const [region, setRegion] = useState("");
  const [channel, setChannel] = useState("");
  const [month, setMonth] = useState("");
  const categoryFilters = [
    {
      label: "Região",
      all: "Todas as regiões",
      options: dashboardRegions,
      value: region,
      change: setRegion,
    },
    {
      label: "Canal",
      all: "Todos os canais",
      options: dashboardChannels,
      value: channel,
      change: setChannel,
    },
    {
      label: "Mês",
      all: "Todos os meses",
      options: dashboardMonths.slice(period.start, period.end),
      value: month,
      change: setMonth,
    },
  ];
  const activeFilters = [
    {
      label: "Período",
      value: period.id === defaultDashboardPeriod.id ? "" : period.label,
      remove: () => setPeriod(defaultDashboardPeriod),
    },
    ...categoryFilters.map(({ label, value, change }) => ({
      label,
      value,
      remove: () => change(""),
    })),
  ].filter(({ value }) => value);
  return (
    <>
      <div className="dashboard-controls">
        <div className="dashboard-controls-label" id={periodLabelId}>
          <Icon name="Calendar" size={16} /> Período de análise
        </div>
        <div
          className="dashboard-period-options"
          role="group"
          aria-labelledby={periodLabelId}
        >
          {dashboardPeriods.map((option) => (
            <button
              key={option.id}
              className="dashboard-period-option"
              type="button"
              aria-pressed={period.id === option.id}
              onClick={() => {
                setPeriod(option);
                const months = dashboardMonths.slice(
                  option.start,
                  option.end,
                );
                setMonth((current) =>
                  months.includes(current) ? current : "",
                );
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="dashboard-period-year">2025</span>
        <button
          className="button secondary small dashboard-reset-filters"
          type="button"
          disabled={activeFilters.length === 0}
          onClick={() => {
            setPeriod(defaultDashboardPeriod);
            setRegion("");
            setChannel("");
            setMonth("");
          }}
        >
          <Icon name="RotateCcw" size={14} aria-hidden="true" />
          Limpar todos os filtros
        </button>
      </div>
      <div className="dashboard-controls">
        {categoryFilters.map(({ label, all, options, value, change }) => (
          <div className="dashboard-category-control" key={label}>
            <label className="dashboard-controls-label">
              {label}
              <select
                className="dashboard-category-select"
                value={value}
                onChange={(event) => change(event.target.value)}
              >
                <option value="">{all}</option>
                {options.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <button
              className="button secondary small"
              type="button"
              disabled={!value}
              onClick={() => change("")}
            >
              Limpar {label.toLowerCase()}
            </button>
          </div>
        ))}
        <span className="sr-only" aria-live="polite">
          Resultados para {region || "todas as regiões"},{" "}
          {channel || "todos os canais"}, {month || period.label} de 2025.
        </span>
      </div>
      <div
        className="dashboard-active-filters"
        role="group"
        aria-label="Filtros ativos"
      >
        <strong ref={activeFiltersHeading} tabIndex={-1}>
          Filtros ativos
        </strong>
        {activeFilters.length === 0 && <span>Nenhum filtro ativo</span>}
        {activeFilters.map(({ label, value, remove }) => (
          <button
            key={label}
            className="dashboard-filter-chip"
            type="button"
            aria-label={`Remover filtro ${label}: ${value}`}
            onClick={() => {
              remove();
              activeFiltersHeading.current?.focus({ preventScroll: true });
            }}
          >
            {label}: {value} <Icon name="X" size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div
        className={embedded ? "embedded-dashboard" : "export-dashboard"}
        role={embedded ? undefined : "region"}
        aria-label={embedded ? undefined : "Prévia do dashboard"}
        tabIndex={embedded ? undefined : 0}
      >
        <div
          ref={previewRef}
          className={embedded ? undefined : "dashboard-export-surface"}
        >
          <DashboardPreview
            item={item}
            period={period}
            region={region}
            channel={channel}
            month={month}
            onRegionSelect={(name) =>
              setRegion((current) => (current === name ? "" : name))
            }
            onChannelSelect={(name) =>
              setChannel((current) => (current === name ? "" : name))
            }
            onMonthSelect={(name) =>
              setMonth((current) => (current === name ? "" : name))
            }
          />
        </div>
      </div>
      {!embedded && (
        <p className="help-text">
          Em telas pequenas, deslize a prévia horizontalmente para explorar
          todos os detalhes.
        </p>
      )}
    </>
  );
}
