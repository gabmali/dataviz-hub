import { createId } from "./ids";

export const componentTypes = [
  "kpi",
  "bar",
  "line",
  "area",
  "pie",
  "donut",
  "table",
  "text",
  "title",
  "separator",
];
export const typeLabels = {
  kpi: "Cartão KPI",
  bar: "Barras",
  line: "Linhas",
  area: "Área",
  pie: "Pizza",
  donut: "Rosca",
  table: "Tabela",
  text: "Texto",
  title: "Título",
  separator: "Separador",
};
export const resolutions = {
  "1280 × 720": [1280, 720],
  "1600 × 900": [1600, 900],
  "1920 × 1080": [1920, 1080],
};
export function makeComponent(type, index = 0) {
  return {
    id: createId(),
    type,
    title:
      type === "kpi"
        ? "Receita total"
        : type === "text"
          ? "Adicione seu contexto e suas descobertas."
          : type === "title"
            ? "Visão de resultados"
            : typeLabels[type],
    value: "R$ 124.500",
    span: ["kpi", "text", "title", "separator"].includes(type) ? 1 : 2,
    seed: index + 1,
  };
}
export function initialProject(template = "comercial") {
  const finance = template === "financeiro",
    executive = template === "executivo";
  const labels = finance
    ? ["Receitas", "Despesas", "Saldo", "Margem"]
    : executive
      ? ["Receita total", "Resultado", "Crescimento", "Clientes"]
      : ["Receita total", "Pedidos", "Ticket médio", "Margem"];
  const values = finance
    ? ["R$ 180.000", "R$ 128.880", "R$ 51.120", "28,4%"]
    : executive
      ? ["R$ 2,4 mi", "R$ 680 mil", "18,4%", "1.284"]
      : ["R$ 124.500", "1.284", "R$ 96,96", "28,4%"];
  return {
    version: 1,
    title:
      template === "financeiro"
        ? "Visão financeira"
        : template === "executivo"
          ? "Visão executiva"
          : "Performance comercial",
    resolution: "1600 × 900",
    columns: 4,
    colors: finance
      ? ["#123B38", "#2DD4BF", "#A3E635", "#99CCC6", "#FBBF24"]
      : executive
        ? ["#312E81", "#818CF8", "#F472B6", "#C4B5FD", "#38BDF8"]
        : ["#102A43", "#F97316", "#38BDF8", "#10B981", "#CBD5E1"],
    components:
      template === "vazio"
        ? []
        : [
            "kpi",
            "kpi",
            "kpi",
            "kpi",
            finance ? "bar" : "area",
            executive ? "line" : "bar",
            "donut",
            "table",
          ].map((t, i) => ({
            ...makeComponent(t, i),
            title: t === "kpi" ? labels[i] : typeLabels[t],
            value: values[i] || "",
          })),
  };
}
export function validateProject(input) {
  const fail = () => {
    throw new Error(
      "Projeto inválido. Importe um JSON DataViz Hub versão 1, com até 24 componentes e resolução suportada.",
    );
  };
  if (
    !input ||
    typeof input !== "object" ||
    input.version !== 1 ||
    typeof input.title !== "string" ||
    input.title.length > 120 ||
    typeof input.resolution !== "string" ||
    !Object.hasOwn(resolutions, input.resolution) ||
    ![2, 3, 4].includes(input.columns) ||
    !Array.isArray(input.colors) ||
    input.colors.length < 3 ||
    input.colors.length > 8 ||
    input.colors.some(
      (c) => typeof c !== "string" || !/^#[0-9a-f]{6}$/i.test(c),
    ) ||
    !Array.isArray(input.components) ||
    input.components.length > 24
  )
    fail();
  const ids = new Set();
  const components = input.components.map((c) => {
    if (
      !c ||
      !componentTypes.includes(c.type) ||
      typeof c.id !== "string" ||
      c.id.length > 80 ||
      ids.has(c.id) ||
      typeof c.title !== "string" ||
      c.title.length > 300 ||
      typeof c.value !== "string" ||
      c.value.length > 80 ||
      ![1, 2, 3, 4].includes(c.span) ||
      !Number.isInteger(c.seed) ||
      c.seed < 0 ||
      c.seed > 10000
    )
      fail();
    ids.add(c.id);
    return {
      id: c.id,
      type: c.type,
      title: c.title,
      value: c.value,
      span: c.span,
      seed: c.seed,
    };
  });
  return {
    version: 1,
    title: input.title,
    resolution: input.resolution,
    columns: input.columns,
    colors: [...input.colors],
    components,
  };
}
