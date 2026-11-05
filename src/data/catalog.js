import dashboards from "./dashboards.json";
import backgrounds from "./backgrounds.json";
import icons from "./icons.json";
import palettes from "./palettes.json";
import datasets from "./datasets.json";
import dax from "./dax.json";
import sql from "./sql.json";
import python from "./python.json";
import kpis from "./kpis.json";
export const catalog = {
  dashboards,
  backgrounds,
  icons,
  palettes,
  datasets,
  dax,
  sql,
  python,
  kpis,
};
export const sections = [
  {
    key: "dashboards",
    label: "Dashboards",
    icon: "LayoutDashboard",
    path: "/dashboards",
    description: "Inspiração que vira resultado",
    detail:
      "Explore modelos originais e encontre a próxima referência para seu projeto.",
  },
  {
    key: "backgrounds",
    label: "Fundos para Power BI",
    short: "Fundos",
    icon: "Wallpaper",
    path: "/fundos",
    description: "Uma base para grandes ideias",
    detail:
      "Fundos originais em alta resolução, prontos para o seu próximo relatório.",
  },
  {
    key: "icons",
    label: "Biblioteca de Ícones",
    short: "Ícones",
    icon: "Shapes",
    path: "/icones",
    description: "Pequenos detalhes. Grandes histórias.",
    detail:
      "Personalize e exporte ícones vetoriais para dar clareza aos seus indicadores.",
  },
  {
    key: "palettes",
    label: "Paletas de Cores",
    short: "Paletas",
    icon: "Palette",
    path: "/paletas",
    description: "Dê cor à sua próxima descoberta",
    detail:
      "Explore combinações, crie uma paleta e exporte seu tema para Power BI.",
  },
  {
    key: "datasets",
    label: "Biblioteca de Datasets",
    short: "Datasets",
    icon: "Database",
    path: "/datasets",
    description: "Dados para colocar a mão na massa",
    detail:
      "Bases fictícias, documentadas e gratuitas para praticar suas análises.",
  },
  {
    key: "dax",
    label: "Biblioteca DAX",
    short: "DAX",
    icon: "Sigma",
    path: "/dax",
    description: "Medidas que resolvem",
    detail:
      "Fórmulas explicadas e prontas para adaptar ao seu modelo de dados.",
  },
  {
    key: "sql",
    label: "Biblioteca SQL",
    short: "SQL",
    icon: "Terminal",
    path: "/sql",
    description: "Da pergunta à consulta",
    detail:
      "Consultas documentadas para explorar dados com SQL Server e MySQL.",
  },
  {
    key: "python",
    label: "Biblioteca Python",
    short: "Python",
    icon: "Code",
    path: "/python",
    description: "Menos repetição. Mais análise.",
    detail: "Scripts para limpar, transformar e visualizar seus dados.",
  },
  {
    key: "kpis",
    label: "Explorador de KPIs",
    short: "KPIs",
    icon: "Gauge",
    path: "/kpis",
    description: "Encontre o indicador certo",
    detail:
      "Entenda fórmulas, interpretações e aplicações de indicadores de negócio.",
  },
  {
    key: "builder",
    label: "Dashboard Builder",
    short: "Builder",
    icon: "PanelsTopLeft",
    path: "/builder",
    description: "Suas ideias, no seu dashboard",
    detail:
      "Monte, personalize e exporte uma composição visual com dados demonstrativos.",
  },
];
export const allResources = Object.entries(catalog).flatMap(([kind, items]) =>
  items.map((item) => ({
    ...item,
    kind,
    path: sections.find((s) => s.key === kind).path,
  })),
);
export const normalize = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function filterResources(
  items,
  {
    query = "",
    category = "Todas",
    color = "Todas",
    type = "Todos",
    sort = "newest",
  } = {},
) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return items
    .filter((item) => {
      if (
        (category !== "Todas" && item.category !== category) ||
        (color !== "Todas" && item.color !== color) ||
        (type !== "Todos" && item.type !== type)
      )
        return false;
      if (!terms.length) return true;
      const searchable = normalize(
        [item.name, item.description, item.category, ...(item.tags || [])].join(
          " ",
        ),
      );
      return terms.every((term) => searchable.includes(term));
    })
    .sort((a, b) =>
      sort === "az"
        ? a.name.localeCompare(b.name, "pt-BR")
        : b.createdAt.localeCompare(a.createdAt) ||
          a.name.localeCompare(b.name, "pt-BR"),
    );
}
