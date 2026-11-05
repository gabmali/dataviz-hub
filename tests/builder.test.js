import { describe, it, expect } from "vitest";
import {
  initialProject,
  validateProject,
  makeComponent,
  componentTypes,
} from "../src/utils/builder";
describe("Projetos do construtor", () => {
  it("faz round-trip JSON sem perda do projeto", () => {
    const project = initialProject();
    expect(validateProject(JSON.parse(JSON.stringify(project)))).toEqual(
      project,
    );
  });
  it("cria todos os componentes suportados com IDs distintos", () => {
    const components = componentTypes.map(makeComponent);
    expect(new Set(components.map((c) => c.id)).size).toBe(10);
    for (const c of components)
      expect(
        validateProject({ ...initialProject(), components: [c] }).components[0],
      ).toEqual(c);
  });
  it("remove propriedades não suportadas sem executá-las", () => {
    const p = { ...initialProject(), script: "alert(1)" };
    p.components[0].onclick = "alert(1)";
    const clean = validateProject(p);
    expect(clean.script).toBeUndefined();
    expect(clean.components[0].onclick).toBeUndefined();
  });
  it("rejeita um objeto vazio", () =>
    expect(() => validateProject({})).toThrow());
  it.each([
    null,
    { version: 2 },
    { title: "x".repeat(121) },
    { resolution: "__proto__" },
    { resolution: "3000x2000" },
    { resolution: ["1600 × 900"] },
    { colors: ["red", "blue", "black"] },
    { colors: ["#000000"] },
    { columns: 8 },
    { components: new Array(25).fill({}) },
  ])("rejeita projeto inválido %j", (patch) => {
    expect(() =>
      validateProject(
        patch === null ? null : { ...initialProject(), ...patch },
      ),
    ).toThrow();
  });
  it.each([
    { type: "script" },
    { span: 12 },
    { seed: -1 },
    { value: 3 },
    { title: "x".repeat(301) },
  ])("rejeita componente inválido %j", (patch) => {
    const p = initialProject();
    p.components[0] = { ...p.components[0], ...patch };
    expect(() => validateProject(p)).toThrow();
  });
  it("rejeita IDs duplicados", () => {
    const p = initialProject();
    p.components[1].id = p.components[0].id;
    expect(() => validateProject(p)).toThrow();
  });
});
