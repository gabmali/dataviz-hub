import { describe, it, expect } from "vitest";
import {
  catalog,
  allResources,
  filterResources,
  sections,
} from "../src/data/catalog";
import { iconRegistry } from "../src/components/common/iconRegistry";
describe("Catálogo local", () => {
  it("cumpre as quantidades mínimas e inclui todas as seções", () => {
    expect(catalog.dashboards.length).toBeGreaterThanOrEqual(30);
    expect(catalog.backgrounds.length).toBeGreaterThanOrEqual(20);
    expect(catalog.icons.length).toBeGreaterThanOrEqual(50);
    expect(catalog.palettes.length).toBeGreaterThanOrEqual(15);
    expect(catalog.datasets).toHaveLength(10);
    expect(sections).toHaveLength(10);
  });
  it("tem IDs únicos, metadados válidos e caminhos internos", () => {
    expect(new Set(allResources.map((x) => x.id)).size).toBe(
      allResources.length,
    );
    for (const r of allResources) {
      expect(r.name.length).toBeGreaterThan(2);
      expect(r.description.length).toBeGreaterThan(10);
      expect(r.path).toMatch(/^\//);
      expect(r.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("fornece paletas HEX e ícones existentes", () => {
    for (const r of [
      ...catalog.dashboards,
      ...catalog.backgrounds,
      ...catalog.palettes,
    ])
      expect(r.colors.every((x) => /^#[\da-f]{6}$/i.test(x))).toBe(true);
    for (const item of catalog.icons)
      expect(iconRegistry[item.icon], item.icon).toBeDefined();
  });
  it("documenta cada coluna e a qualidade dos dados", () => {
    for (const d of catalog.datasets) {
      expect(d.rows).toBeGreaterThanOrEqual(500);
      expect(d.dictionary).toHaveLength(d.columns);
      expect(Object.keys(d.preview[0])).toHaveLength(d.columns);
      expect(d.kpis.length).toBeGreaterThan(0);
    }
    expect(
      catalog.datasets.find((d) => d.slug === "atendimento").quality.length,
    ).toBeGreaterThan(0);
  });
  it("documenta modelos DAX, dialetos SQL e entradas Python", () => {
    for (const x of catalog.dax) {
      expect(x.prerequisites).toBeTruthy();
      expect(x.example).toBeTruthy();
    }
    for (const x of catalog.sql) expect(x.dialect).toMatch(/SQL/);
    for (const x of catalog.python) {
      expect(x.libraries.length).toBeGreaterThan(0);
      expect(x.input).toBeTruthy();
      expect(x.output).toBeTruthy();
    }
  });
  it("pesquisa sem acentos em todas as categorias", () => {
    const result = filterResources(allResources, { query: "logistica" });
    expect(result.some((x) => x.kind === "dashboards")).toBe(true);
    expect(result.some((x) => x.kind === "datasets")).toBe(true);
    expect(
      result.every((x) => JSON.stringify(x).toLowerCase().includes("log")),
    ).toBe(true);
  });
  it("combina categoria, cor e tipo", () => {
    const result = filterResources(catalog.dashboards, {
      category: "Vendas",
      color: "Azul",
      type: "Gerencial",
    });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (x) =>
          x.category === "Vendas" &&
          x.color === "Azul" &&
          x.type === "Gerencial",
      ),
    ).toBe(true);
  });
  it("ordena e trata resultado vazio", () => {
    const result = filterResources(catalog.dax, { sort: "az" });
    expect(result.map((x) => x.name)).toEqual(
      [...result.map((x) => x.name)].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    );
    expect(
      filterResources(allResources, { query: "zzzz inexistente" }),
    ).toEqual([]);
  });
});
