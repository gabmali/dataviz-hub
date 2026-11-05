import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Rectangle,
  Sector,
} from "recharts";
import { demoData } from "./dashboardData";

export function Chart({
  type = "area",
  colors = ["#102A43", "#F97316", "#38BDF8", "#10B981"],
  seed = 1,
  compact = false,
  data = demoData(seed),
  label,
  selectedCategory,
  onCategorySelect,
  categoryLabel = "região",
  selectableTicks = false,
}) {
  const selectMonth = onCategorySelect && selectableTicks;
  const accessibleChart = !compact && !onCategorySelect;
  const categoryInteraction = (name, keyboard = true) => {
    const active = name === selectedCategory;
    return {
      className: "chart-category-shape",
      fillOpacity: selectedCategory && !active ? 0.35 : 1,
      role: keyboard ? "button" : undefined,
      tabIndex: keyboard ? 0 : undefined,
      "aria-label": keyboard ? `Filtrar ${categoryLabel} ${name}` : undefined,
      "aria-pressed": keyboard ? active : undefined,
      onClick: () => onCategorySelect(name),
      onKeyDown: keyboard
        ? (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onCategorySelect(name);
          }
        : undefined,
    };
  };
  const categoryTick = selectMonth
    ? ({ x, y, payload }) => (
        <g
          {...categoryInteraction(payload.value)}
          className="chart-category-tick"
          fillOpacity={1}
        >
          <rect x={x - 15} y={y - 2} width={30} height={18} rx={4} />
          <text x={x} y={y + 11} textAnchor="middle">
            {payload.value}
          </text>
        </g>
      )
    : undefined;
  const categoryDot = selectMonth
    ? ({ cx, cy, payload }) => (
        <g
          {...categoryInteraction(payload.name, false)}
          className="chart-category-point"
        >
          <circle cx={cx} cy={cy} r={9} fill="transparent" />
          <circle
            cx={cx}
            cy={cy}
            r={payload.name === selectedCategory ? 5 : 3}
            fill={colors[1]}
            stroke="white"
            strokeWidth={1}
          />
        </g>
      )
    : false;
  const categoryBar = (keyboard) => {
    if (!onCategorySelect) return undefined;
    return ({ x, y, width, height, fill, radius, payload }) => (
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        radius={radius}
        {...categoryInteraction(payload.name, keyboard)}
      />
    );
  };
  const categorySector = onCategorySelect
    ? ({
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        fill,
        stroke,
        strokeWidth,
        name,
      }) => (
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...categoryInteraction(name)}
        />
      )
    : undefined;
  const common = {
    data,
    margin: {
      top: compact ? 2 : 8,
      right: selectMonth ? 16 : compact ? 2 : 8,
      left: compact ? -5 : -18,
      bottom: 0,
    },
  };
  const axes = (
    <>
      <CartesianGrid
        strokeDasharray="3 5"
        vertical={false}
        stroke="#64748B"
        opacity={0.13}
      />
      <XAxis
        dataKey="name"
        height={compact ? 12 : 30}
        minTickGap={compact ? 5 : 10}
        tick={categoryTick || { fontSize: compact ? 6 : 11, fill: "#52657A" }}
        interval={selectMonth ? 0 : undefined}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        width={compact ? 20 : 60}
        tick={{ fontSize: compact ? 6 : 10, fill: "#52657A" }}
        axisLine={false}
        tickLine={false}
        tickCount={compact ? 2 : 4}
      />
      {!compact && (
        <Tooltip
          contentStyle={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            color: "#102A43",
            fontSize: 12,
          }}
        />
      )}
    </>
  );
  let chart;
  if (type === "bar")
    chart = (
      <BarChart {...common} accessibilityLayer={accessibleChart}>
        {axes}
        <Bar
          dataKey="value"
          name="Atual"
          fill={colors[1]}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
          shape={categoryBar(!selectMonth)}
        />
        <Bar
          dataKey="target"
          name="Meta"
          fill={colors[2]}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
          shape={categoryBar(false)}
        />
      </BarChart>
    );
  else if (type === "pie" || type === "donut")
    chart = (
      <PieChart accessibilityLayer={accessibleChart}>
        <Pie
          data={data.slice(0, 4)}
          dataKey="value"
          nameKey="name"
          innerRadius={type === "donut" ? "58%" : 0}
          outerRadius="85%"
          strokeWidth={3}
          stroke="#FFFFFF"
          isAnimationActive={false}
          shape={categorySector}
          rootTabIndex={accessibleChart ? 0 : -1}
        >
          {data.slice(0, 4).map((x, i) => (
            <Cell key={x.name} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        {!compact && <Tooltip />}
      </PieChart>
    );
  else if (type === "line")
    chart = (
      <LineChart {...common} accessibilityLayer={accessibleChart}>
        {axes}
        <Line
          dataKey="value"
          name="Atual"
          stroke={colors[1]}
          strokeWidth={2.5}
          dot={categoryDot}
          activeDot={selectMonth ? false : undefined}
          isAnimationActive={false}
        />
        <Line
          dataKey="target"
          name="Meta"
          stroke={colors[2]}
          strokeDasharray="5 4"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    );
  else
    chart = (
      <AreaChart {...common} accessibilityLayer={accessibleChart}>
        {axes}
        <Area
          type="monotone"
          dataKey="value"
          name="Atual"
          fill={colors[1]}
          fillOpacity={0.14}
          stroke={colors[1]}
          strokeWidth={2.5}
          dot={categoryDot}
          activeDot={selectMonth ? false : undefined}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="previous"
          name="Anterior"
          fill={colors[2]}
          fillOpacity={0.06}
          stroke={colors[2]}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </AreaChart>
    );
  return (
    <div
      className={`chart ${compact ? "compact" : ""}`}
      role={onCategorySelect ? "group" : "img"}
      aria-label={
        label ||
        `Gráfico demonstrativo de ${type}, janeiro a agosto; dados fictícios.`
      }
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 360, height: 180 }}
      >
        {chart}
      </ResponsiveContainer>
    </div>
  );
}
export function DataTable({
  seed = 1,
  rows,
  colors = ["#F97316", "#38BDF8", "#10B981", "#818CF8"],
  label,
}) {
  const entries =
    rows ||
    ["Online", "Lojas", "Parceiros", "Direto"].map((name, index) => ({
      name,
      value: 12450 + (seed + index) * 1356,
      achievement: 88 + index * 5,
    }));
  return (
    <table className="demo-table" aria-label={label}>
      <thead>
        <tr>
          <th>Canal</th>
          <th>Receita</th>
          <th>Meta</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(({ name, value, achievement }, index) => (
          <tr key={name}>
            <td>
              <span
                className="table-dot"
                style={{ background: colors[index] }}
              />
              {name}
            </td>
            <td>R$ {value.toLocaleString("pt-BR")}</td>
            <td>
              <span className="positive">{achievement}%</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
