import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("html-to-image", () => ({
  toPng: vi.fn(() => Promise.resolve("data:image/png;base64,AA==")),
}));
import { toPng } from "html-to-image";
import {
  powerBITheme,
  backgroundSvg,
  rgb,
  exportElement,
  downloadJSON,
  copy,
} from "../src/utils/export";
import { iconSvg } from "../src/components/gallery/ResourceDetails";
import { catalog } from "../src/data/catalog";
describe("Exportações e área de transferência", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });
  it("gera tema mínimo válido do Power BI e RGB correto", () => {
    expect(powerBITheme("Hub", ["#102A43", "#F97316"])).toEqual({
      name: "Hub",
      dataColors: ["#102A43", "#F97316"],
      background: "#FFFFFF",
      foreground: "#102A43",
      tableAccent: "#F97316",
    });
    expect(rgb("#F97316")).toBe("rgb(249, 115, 22)");
    expect(() => powerBITheme("X", ["bad"])).toThrow();
  });
  it("exporta SVG vetorial com cor e tamanho aplicados", () => {
    const svg = iconSvg(catalog.icons[0], "#F97316", 128);
    expect(svg).toContain("<svg");
    expect(svg).toContain('width="128"');
    expect(svg).toContain("#F97316");
    expect(svg).not.toContain("<script");
    expect(() => iconSvg(catalog.icons[0], "url(evil)", 64)).toThrow();
  });
  it("gera fundo SVG na resolução escolhida", () => {
    const svg = backgroundSvg(catalog.backgrounds[0], 1920, 1080);
    expect(svg).toContain('width="1920" height="1080"');
    expect(svg).toContain('viewBox="0 0 1600 900"');
  });
  it("exporta PNG com tamanho exato e remove a escala da edição", async () => {
    const node = document.createElement("div");
    Object.defineProperties(node, {
      offsetWidth: { value: 1600 },
      offsetHeight: { value: 900 },
    });
    await exportElement(node, "teste.png", 1920, 1080);
    expect(toPng).toHaveBeenCalledWith(
      node,
      expect.objectContaining({
        canvasWidth: 1920,
        canvasHeight: 1080,
        pixelRatio: 1,
        style: { transform: "none", transformOrigin: "top left" },
      }),
    );
  });
  it("relata erro se a prévia não existe ou o PNG falha", async () => {
    await expect(exportElement(null, "a.png")).rejects.toThrow("prévia");
    vi.mocked(toPng).mockRejectedValueOnce(new Error("Falha PNG"));
    await expect(
      exportElement(document.createElement("div"), "a.png"),
    ).rejects.toThrow("Falha PNG");
  });
  it("cria um download JSON e copia texto", async () => {
    downloadJSON({ colors: ["#102A43"] }, "paleta.json");
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue() },
      configurable: true,
    });
    await copy("SELECT 1");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("SELECT 1");
  });
});
