// Reproducible visual QA artifacts. Run with the dev server on port 5173.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
mkdirSync("docs/screenshots", { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.getByRole("heading", { name: /Grandes análises/ }).waitFor();
  await page
    .locator(".recharts-area path")
    .first()
    .waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "docs/screenshots/home-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
  await page.screenshot({ path: "docs/screenshots/home-dark.png", animations: "disabled" });
  await page.getByRole("button", { name: "Ativar tema claro" }).click();
  await page.goto("http://127.0.0.1:5173/dashboards");
  await page
    .locator(".recharts-area path")
    .first()
    .waitFor({ state: "attached" });
  await page.screenshot({ path: "docs/screenshots/gallery-desktop.png" });
  await page.goto("http://127.0.0.1:5173/builder");
  await page
    .locator(".builder-widget .recharts-area path")
    .first()
    .waitFor({ state: "attached" });
  await page.screenshot({
    path: "docs/screenshots/builder-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("combobox", { name: "Resolução do dashboard" })
    .selectOption("1920 × 1080");
  const exportEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar PNG", exact: true }).click();
  await (await exportEvent).saveAs("docs/screenshots/builder-export.png");
  await page.goto("http://127.0.0.1:5173/dashboards?recurso=dashboard-1");
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Mai–Ago", exact: true }).click();
  await dialog
    .getByRole("group", { name: "Evolução mensal, Mai–Ago de 2025" })
    .locator(".recharts-area path")
    .first()
    .waitFor({ state: "attached" });
  await page.screenshot({ path: "docs/screenshots/dashboard-interativo.png" });
  const dashboardEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PNG 1600 × 900" }).click();
  await (await dashboardEvent).saveAs("docs/screenshots/dashboard-export.png");
  await page.goto("http://127.0.0.1:5173/");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("heading", { name: /Grandes análises/ }).waitFor();
  await page
    .locator(".recharts-area path")
    .first()
    .waitFor({ state: "attached" });
  await page.screenshot({
    path: "docs/screenshots/home-mobile.png",
    fullPage: true,
  });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "8 capturas/exportações geradas sem erros de execução no navegador.",
  );
} finally {
  await browser.close();
}
