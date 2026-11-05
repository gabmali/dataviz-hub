import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
async function download(page, button) {
  const event = page.waitForEvent("download");
  await button.click();
  const file = await event;
  const path = await file.path();
  expect(await file.failure()).toBeNull();
  return { file, bytes: await readFile(path) };
}
function pngSize(bytes) {
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}
function donutClickPosition(sector) {
  return sector.evaluate((shape) => {
    // The center of an SVG sector's bounding box can fall in the donut hole.
    const { x, y, width, height } = shape.getBBox();
    for (const dy of [0.5, 0.25, 0.75]) {
      for (const dx of [0.5, 0.25, 0.75]) {
        const point = new DOMPoint(x + width * dx, y + height * dy);
        if (shape.isPointInFill(point))
          return { x: width * dx, y: height * dy };
      }
    }
    throw new Error("Nenhum ponto clicável na fatia do gráfico");
  });
}
test("navegação completa, gráficos, busca global e 404", async ({
  page,
  isMobile,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Grandes análises/ }),
  ).toBeVisible();
  if (isMobile) {
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Menu principal" }),
    ).toBeVisible();
  }
  await page
    .getByRole("navigation", { name: "Menu principal" })
    .getByRole("link", { name: "DAX 15", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /Biblioteca DAX/ }),
  ).toBeVisible();
  for (const [url, title] of [
    ["/dashboards", "Dashboards"],
    ["/fundos", "Fundos para Power BI"],
    ["/icones", "Biblioteca de Ícones"],
    ["/paletas", "Paletas de Cores"],
    ["/datasets", "Biblioteca de Datasets"],
    ["/sql", "Biblioteca SQL"],
    ["/python", "Biblioteca Python"],
    ["/kpis", "Explorador de KPIs"],
    ["/builder", "Dashboard Builder"],
    ["/favoritos", "Seus favoritos"],
    ["/sobre", "Dados abrem possibilidades"],
  ]) {
    await page.goto(url);
    await expect(
      page.getByRole("heading", { level: 1, name: new RegExp(title) }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "O que você procura?" })
    .fill("logistica");
  await page.getByRole("button", { name: "Buscar recursos" }).click();
  await expect(
    page.getByRole("heading", { name: "Entregas e distribuição" }),
  ).toBeVisible();
  await page.goto("/nao-existe");
  await expect(
    page.getByRole("heading", { name: "Essa página saiu do radar." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("filtros combinados, ordenação e estado vazio", async ({ page }) => {
  await page.goto("/dashboards");
  await page
    .getByRole("combobox", { name: "Filtrar categoria" })
    .selectOption("Vendas");
  await page
    .getByRole("combobox", { name: "Filtrar cor" })
    .selectOption("Azul");
  await page
    .getByRole("combobox", { name: "Filtrar tipo" })
    .selectOption("Gerencial");
  await expect(page.locator(".resource-card")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Ordenar recursos" })
    .selectOption("az");
  await page
    .getByRole("textbox", { name: "Pesquisar recursos" })
    .fill("sem-correspondencia");
  await expect(page.getByText("Nenhum recurso encontrado")).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page.locator(".resource-card")).toHaveCount(36);
  await expect(page.locator(".recharts-area path").first()).toBeAttached();
});
test("favoritos e tema persistem ao recarregar", async ({ page }) => {
  await page.goto("/dax");
  await page
    .getByRole("button", {
      name: "Adicionar aos favoritos: Receita Total",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/favoritos");
  await expect(
    page.getByRole("heading", { name: "Receita Total", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Remover dos favoritos: Receita Total",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Sua coleção começa com um coração"),
  ).toBeVisible();
});
test("filtro de período atualiza o dashboard e exporta o PNG", async ({
  page,
}) => {
  await page.goto("/dashboards?recurso=dashboard-1");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const period = dialog.getByRole("button", { name: "Mai–Ago", exact: true });
  const initialKpi = dialog.getByText("R$ 124.500", { exact: true });
  await expect(initialKpi).toBeVisible();
  const channelValues = dialog.locator(".demo-table tbody tr td:nth-child(2)");
  const tableTotal = async () =>
    (await channelValues.allTextContents()).reduce(
      (sum, text) => sum + Number(text.replace(/\D/g, "")),
      0,
    );
  expect(await tableTotal()).toBe(124500);
  const onlineRevenue = dialog
    .getByRole("row", { name: /Online/ })
    .getByRole("cell")
    .nth(1);
  const initialRevenue = await onlineRevenue.innerText();
  await period.click();
  await expect(period).toHaveAttribute("aria-pressed", "true");
  await expect(initialKpi).toHaveCount(0);
  await expect(dialog.getByText(/R\$\s96,92/)).toBeVisible();
  expect(await tableTotal()).toBe(72883);
  await expect(onlineRevenue).not.toHaveText(initialRevenue);
  const lastChannel = dialog.getByRole("row", { name: /Direto/ });
  expect(
    await lastChannel.evaluate(
      (row) =>
        row.getBoundingClientRect().bottom <=
        row.closest(".dash-panel").getBoundingClientRect().bottom,
    ),
  ).toBe(true);
  const trend = dialog.getByRole("group", {
    name: "Evolução mensal, Mai–Ago de 2025",
  });
  await expect(trend.locator(".recharts-area path").first()).toBeAttached();
  await expect(trend.getByText("Mai", { exact: true })).toBeVisible();
  await expect(trend.getByText("Jan", { exact: true })).toHaveCount(0);
  const { bytes } = await download(
    page,
    page.getByRole("button", { name: "Baixar PNG 1600 × 900" }),
  );
  expect(pngSize(bytes)).toEqual([1600, 900]);
  expect(bytes.length).toBeGreaterThan(20000);
  await dialog.getByRole("button", { name: "Jan–Ago", exact: true }).click();
  await expect(initialKpi).toBeVisible();
  await expect(onlineRevenue).toHaveText(initialRevenue);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("dashboard da Home filtra pelos gráficos sem abrir a prévia", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const dashboard = page.getByRole("region", { name: "Dashboard interativo" });
  const heading = dashboard.getByRole("heading", { name: "Dashboard interativo" });
  const selectChart = (control, options) =>
    isMobile ? control.tap(options) : control.click(options);
  await expect(dashboard.getByRole("table")).toBeVisible();
  await page
    .getByRole("button", { name: "Testar dashboard interativo" })
    .click();
  await expect(heading).toBeFocused();

  const kpi = dashboard.locator(".dash-kpis strong").first();
  const rows = dashboard.getByRole("table").locator("tbody tr");
  const revenue = rows.first().getByRole("cell").nth(1);
  const reset = dashboard.getByRole("button", { name: "Limpar todos os filtros" });
  const period = dashboard.getByRole("button", { name: "Mai–Ago", exact: true });
  const activeFilters = dashboard.getByRole("group", { name: "Filtros ativos" });
  const chip = (name) =>
    activeFilters.getByRole("button", { name: `Remover filtro ${name}` });
  await expect(activeFilters.getByText("Nenhum filtro ativo")).toBeVisible();
  await expect(kpi).toHaveText("R$ 124.500");
  await expect(rows).toHaveCount(4);
  const initialRows = await rows.allTextContents();
  await period.click();
  await expect(kpi).toHaveText("R$ 72.883");
  const periodRevenue = await revenue.innerText();

  const south = dashboard.getByRole("button", { name: "Filtrar região Sul" });
  await selectChart(south);
  await expect(south).toHaveAttribute("aria-pressed", "true");
  await expect(kpi).not.toHaveText("R$ 72.883");
  await expect(revenue).not.toHaveText(periodRevenue);
  const regionalKpi = await kpi.innerText();

  const online = dashboard.getByRole("button", { name: "Filtrar canal Online" });
  const position = await donutClickPosition(online);
  await selectChart(online, { position });
  await expect(online).toHaveAttribute("aria-pressed", "true");
  await expect(kpi).not.toHaveText(regionalKpi);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Online");
  const channelRevenue = await revenue.innerText();

  const may = dashboard.getByRole("button", { name: "Filtrar mês Mai" });
  await selectChart(may);
  await expect(may).toHaveAttribute("aria-pressed", "true");
  await expect(period).toHaveAttribute("aria-pressed", "true");
  await expect(south).toHaveAttribute("aria-pressed", "true");
  await expect(online).toHaveAttribute("aria-pressed", "true");
  await expect(revenue).not.toHaveText(channelRevenue);
  await expect(kpi).toHaveText(await revenue.innerText());

  await expect(activeFilters.getByRole("button")).toHaveCount(4);
  const mayRevenue = await revenue.innerText();
  await chip("Período: Mai–Ago").press("Enter");
  await expect(activeFilters.getByRole("button")).toHaveCount(3);
  await expect(period).toHaveAttribute("aria-pressed", "false");
  await expect(may).toHaveAttribute("aria-pressed", "true");
  await expect(revenue).toHaveText(mayRevenue);

  await selectChart(chip("Mês: Mai"));
  await expect(chip("Mês: Mai")).toHaveCount(0);
  await expect(revenue).not.toHaveText(mayRevenue);
  await expect(chip("Canal: Online")).toBeVisible();
  await expect(chip("Região: Sul")).toBeVisible();
  await selectChart(chip("Canal: Online"));
  await expect(rows).toHaveCount(4);
  await expect(chip("Região: Sul")).toBeVisible();
  await expect(south).toHaveAttribute("aria-pressed", "true");
  await selectChart(chip("Região: Sul"));
  await expect(activeFilters.getByText("Nenhum filtro ativo")).toBeVisible();
  await expect(kpi).toHaveText("R$ 124.500");

  await period.click();
  await reset.click();
  await expect(activeFilters.getByRole("button")).toHaveCount(0);
  await expect(reset).toBeDisabled();
  await expect(kpi).toHaveText("R$ 124.500");
  await expect(rows).toHaveText(initialRows);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  expect(
    await dashboard.evaluate((panel) => panel.scrollWidth <= panel.clientWidth),
  ).toBe(true);
});
test("filtro de região por barra se combina com o período", async ({
  page,
}) => {
  await page.goto("/dashboards?recurso=dashboard-1");
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Como usar a prévia interativa"),
  ).toBeVisible();
  const region = dialog.getByRole("combobox", { name: "Região", exact: true });
  const clear = dialog.getByRole("button", { name: "Limpar região" });
  const kpi = dialog.locator(".dash-kpis strong").first();
  const onlineRevenue = dialog
    .getByRole("row", { name: /Online/ })
    .getByRole("cell")
    .nth(1);
  const latePeriod = dialog.getByRole("button", {
    name: "Mai–Ago",
    exact: true,
  });
  await latePeriod.click();
  await expect(kpi).toHaveText("R$ 72.883");
  const nationalRevenue = await onlineRevenue.innerText();

  const south = dialog.getByRole("button", {
    name: "Filtrar região Sul",
    exact: true,
  });
  await south.click();
  await expect(south).toHaveAttribute("aria-pressed", "true");
  await expect(region).toHaveValue("Sul");
  await expect(latePeriod).toHaveAttribute("aria-pressed", "true");
  await expect(kpi).not.toHaveText("R$ 72.883");
  await expect(onlineRevenue).not.toHaveText(nationalRevenue);
  await expect(
    dialog.getByRole("table", { name: "Desempenho dos canais · Sul" }),
  ).toBeVisible();

  const southeast = dialog.getByRole("button", {
    name: "Filtrar região Sudeste",
    exact: true,
  });
  const southRevenue = await onlineRevenue.innerText();
  await southeast.press("Enter");
  await expect(south).toHaveAttribute("aria-pressed", "false");
  await expect(region).toHaveValue("Sudeste");
  await expect(onlineRevenue).not.toHaveText(southRevenue);
  await clear.click();
  await expect(region).toHaveValue("");
  await expect(kpi).toHaveText("R$ 72.883");
  await expect(onlineRevenue).toHaveText(nationalRevenue);

  await region.selectOption("Sul");
  await expect(south).toHaveAttribute("aria-pressed", "true");
  await expect(onlineRevenue).toHaveText(southRevenue);
  await south.click();
  await expect(region).toHaveValue("");
});
test("filtro de canal pela rosca preserva região e período", async ({
  page,
}) => {
  await page.goto("/dashboards?recurso=dashboard-1");
  const dialog = page.getByRole("dialog");
  const late = dialog.getByRole("button", { name: "Mai–Ago", exact: true });
  const region = dialog.getByRole("combobox", { name: "Região", exact: true });
  const channel = dialog.getByRole("combobox", { name: "Canal", exact: true });
  const kpi = dialog.locator(".dash-kpis strong").first();
  const rows = dialog.getByRole("table").locator("tbody tr");
  const onlineRevenue = rows
    .filter({ hasText: "Online" })
    .getByRole("cell")
    .nth(1);
  await late.click();
  await region.selectOption("Sul");
  await expect(rows).toHaveCount(4);
  const regionalKpi = await kpi.innerText();
  const regionalOnlineRevenue = await onlineRevenue.innerText();

  const online = dialog.getByRole("button", {
    name: "Filtrar canal Online",
    exact: true,
  });
  const position = await donutClickPosition(online);
  await online.click({ position });
  await expect(online).toHaveAttribute("aria-pressed", "true");
  await expect(channel).toHaveValue("Online");
  await expect(region).toHaveValue("Sul");
  await expect(late).toHaveAttribute("aria-pressed", "true");
  await expect(kpi).not.toHaveText(regionalKpi);
  await expect(rows).toHaveCount(1);
  await expect(onlineRevenue).toHaveText(regionalOnlineRevenue);

  const stores = dialog.getByRole("button", {
    name: "Filtrar canal Lojas",
    exact: true,
  });
  await stores.press("Enter");
  await expect(channel).toHaveValue("Lojas");
  await expect(online).toHaveAttribute("aria-pressed", "false");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Lojas");

  const storeRevenue = await rows.first().getByRole("cell").nth(1).innerText();
  await dialog.getByRole("button", { name: "Jan–Abr", exact: true }).click();
  await expect(rows.first().getByRole("cell").nth(1)).not.toHaveText(
    storeRevenue,
  );
  await expect(channel).toHaveValue("Lojas");
  await expect(region).toHaveValue("Sul");

  await late.click();
  await dialog
    .getByRole("button", { name: "Limpar canal", exact: true })
    .click();
  await expect(channel).toHaveValue("");
  await expect(region).toHaveValue("Sul");
  await expect(late).toHaveAttribute("aria-pressed", "true");
  await expect(rows).toHaveCount(4);
  await expect(kpi).toHaveText(regionalKpi);
});
test("filtro de mês mantém região e canal e permite limpar todos os filtros", async ({
  page,
}) => {
  await page.goto("/dashboards");
  await page
    .getByRole("button", { name: "Testar dashboard interativo" })
    .click();
  const dialog = page.getByRole("dialog");
  const period = dialog.getByRole("button", { name: "Mai–Ago", exact: true });
  const region = dialog.getByRole("combobox", { name: "Região", exact: true });
  const channel = dialog.getByRole("combobox", { name: "Canal", exact: true });
  const month = dialog.getByRole("combobox", { name: "Mês", exact: true });
  const reset = dialog.getByRole("button", {
    name: "Limpar todos os filtros",
    exact: true,
  });
  const kpi = dialog.locator(".dash-kpis strong").first();
  const rows = dialog.getByRole("table").locator("tbody tr");
  const revenue = rows.first().getByRole("cell").nth(1);
  const activeFilters = dialog.getByRole("group", { name: "Filtros ativos" });
  const chip = (name) =>
    activeFilters.getByRole("button", { name: `Remover filtro ${name}` });
  await expect(activeFilters.getByText("Nenhum filtro ativo")).toBeVisible();
  await expect(reset).toBeDisabled();
  await expect(rows).toHaveCount(4);
  const initialKpi = await kpi.innerText();
  const initialRows = await rows.allTextContents();
  await period.click();
  await expect(reset).toBeEnabled();
  await region.selectOption("Sul");
  await channel.selectOption("Online");
  const trend = dialog.getByRole("group", {
    name: "Evolução mensal, Mai–Ago de 2025 · Sul · Online",
  });
  const periodKpi = await kpi.innerText();
  const periodRevenue = await revenue.innerText();
  const may = trend.getByRole("button", {
    name: "Filtrar mês Mai",
    exact: true,
  });
  const july = trend.getByRole("button", {
    name: "Filtrar mês Jul",
    exact: true,
  });
  await may.click();
  await expect(may).toHaveAttribute("aria-pressed", "true");
  await expect(month).toHaveValue("Mai");
  await expect(kpi).not.toHaveText(periodKpi);
  await expect(revenue).not.toHaveText(periodRevenue);
  await expect(kpi).toHaveText(await revenue.innerText());
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Online");
  await expect(trend.getByRole("button", { name: /^Filtrar mês/ })).toHaveCount(
    4,
  );

  const mayRevenue = await revenue.innerText();
  await july.press("Enter");
  await expect(july).toHaveAttribute("aria-pressed", "true");
  await expect(may).toHaveAttribute("aria-pressed", "false");
  await expect(revenue).not.toHaveText(mayRevenue);
  await expect(month).toHaveValue("Jul");
  await expect(activeFilters.getByRole("button")).toHaveCount(4);
  await chip("Mês: Jul").click();
  await expect(chip("Mês: Jul")).toHaveCount(0);
  await expect(month).toHaveValue("");
  await expect(kpi).toHaveText(periodKpi);
  await expect(revenue).toHaveText(periodRevenue);
  await expect(period).toHaveAttribute("aria-pressed", "true");
  await expect(region).toHaveValue("Sul");
  await expect(channel).toHaveValue("Online");

  await may.click();
  await chip("Período: Mai–Ago").click();
  await expect(month).toHaveValue("Mai");
  await expect(region).toHaveValue("Sul");
  await expect(channel).toHaveValue("Online");
  await expect(revenue).toHaveText(mayRevenue);
  await dialog.getByRole("button", { name: "Jan–Abr", exact: true }).click();
  await expect(month).toHaveValue("");
  await expect(region).toHaveValue("Sul");
  await expect(channel).toHaveValue("Online");

  await month.selectOption("Fev");
  await reset.click();
  await expect(activeFilters.getByText("Nenhum filtro ativo")).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Jan–Ago", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(region).toHaveValue("");
  await expect(channel).toHaveValue("");
  await expect(month).toHaveValue("");
  await expect(kpi).toHaveText(initialKpi);
  await expect(rows).toHaveText(initialRows);
  await expect(
    dialog.getByRole("button", {
      name: /^Filtrar (região|canal|mês) /,
      pressed: true,
    }),
  ).toHaveCount(0);
  await expect(reset).toBeDisabled();
});
test("fundo PNG na resolução escolhida", async ({ page }) => {
  await page.goto("/fundos?recurso=background-1");
  await page
    .getByRole("dialog")
    .getByRole("combobox")
    .selectOption("1920 × 1080");
  const { bytes } = await download(
    page,
    page.getByRole("button", { name: "Baixar PNG", exact: true }),
  );
  expect(pngSize(bytes)).toEqual([1920, 1080]);
});
test("ícone SVG, PNG transparente e pacote ZIP", async ({ page }) => {
  await page.goto("/icones?recurso=icon-Wallet");
  await page.getByLabel("Cor do ícone", { exact: true }).fill("#F97316");
  await page
    .getByLabel("Tamanho do ícone", { exact: true })
    .selectOption("128");
  const svg = await download(
    page,
    page.getByRole("button", { name: "Baixar SVG", exact: true }),
  );
  expect(svg.bytes.toString()).toContain('width="128"');
  expect(svg.bytes.toString().toLowerCase()).toContain("#f97316");
  const png = await download(
    page,
    page.getByRole("button", { name: "Baixar PNG", exact: true }),
  );
  expect(pngSize(png.bytes)).toEqual([128, 128]);
  await page.getByRole("button", { name: "Fechar prévia" }).click();
  await page
    .getByRole("textbox", { name: "Pesquisar recursos" })
    .fill("Wallet");
  await page.getByRole("button", { name: "Selecionar resultados" }).click();
  const zipped = await download(
    page,
    page.getByRole("button", { name: "Exportar ZIP (1)", exact: true }),
  );
  const archive = await JSZip.loadAsync(zipped.bytes);
  expect(archive.file("Wallet.svg")).not.toBeNull();
  expect(archive.file("LICENSE.txt")).not.toBeNull();
});
test("paleta editável, geração e exportações", async ({ page }) => {
  await page.goto("/paletas?recurso=palette-1");
  await page.getByLabel("Editar cor 1", { exact: true }).fill("#123456");
  const theme = await download(
    page,
    page.getByRole("button", { name: "Exportar tema Power BI" }),
  );
  const json = JSON.parse(theme.bytes.toString());
  expect(json.dataColors[0]).toBe("#123456");
  expect(json.name).toContain("personalizada");
  const palette = await download(
    page,
    page.getByRole("button", { name: "Baixar JSON", exact: true }),
  );
  expect(JSON.parse(palette.bytes.toString()).colors).toHaveLength(5);
  const png = await download(
    page,
    page.getByRole("button", { name: "Baixar PNG", exact: true }),
  );
  expect(pngSize(png.bytes)[0]).toBe(1600);
  await page.getByRole("button", { name: "Gerar combinação" }).click();
  await expect(page.locator(".palette-editor")).not.toContainText("#123456");
});
test("dataset CSV/XLSX e dicionário reais", async ({ page }) => {
  await page.goto("/datasets?recurso=dataset-vendas");
  await expect(
    page.getByRole("heading", { name: "Dicionário de dados" }),
  ).toBeVisible();
  await expect(page.locator(".table-scroll tbody tr")).toHaveCount(8);
  const csv = await download(
    page,
    page.getByRole("link", { name: "Baixar CSV" }),
  );
  expect(csv.bytes.toString().trim().split(/\r?\n/)).toHaveLength(601);
  const xlsx = await download(
    page,
    page.getByRole("link", { name: "Baixar XLSX" }),
  );
  const archive = await JSZip.loadAsync(xlsx.bytes);
  expect(archive.file("xl/worksheets/sheet1.xml")).not.toBeNull();
});
test("copia DAX, SQL e Python", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const [path, id, expected] of [
    ["dax", "dax-1", "SUM(vendas[receita])"],
    ["sql", "sql-1", "SELECT pedido_id"],
    ["python", "python-1", "import pandas as pd"],
  ]) {
    await page.goto(`/${path}?recurso=${id}`);
    await page
      .getByRole("button", { name: "Copiar código", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText(/Copiado/);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      expected,
    );
  }
});
test("builder adiciona, edita, move, remove e desfaz", async ({ page }) => {
  await page.goto("/builder");
  await page
    .getByRole("button", { name: "Adicionar Cartão KPI", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Título do componente", exact: true })
    .fill("Receita de teste");
  await page
    .getByRole("textbox", { name: "Valor do KPI", exact: true })
    .fill("R$ 999");
  await expect(
    page.getByRole("button", {
      name: "Selecionar Receita de teste",
      exact: true,
    }),
  ).toContainText("R$ 999");
  await page.getByRole("button", { name: "Antes", exact: true }).click();
  const titles = await page.locator(".builder-widget").allTextContents();
  expect(titles.at(-2)).toContain("Receita de teste");
  await page.getByRole("button", { name: "Remover componente" }).click();
  await expect(
    page.getByRole("button", { name: "Selecionar Receita de teste" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(
    page.getByRole("button", { name: "Selecionar Receita de teste" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Selecionar Receita de teste" }),
  ).toBeVisible();
});
test("builder exporta PNG completo e faz round-trip JSON", async ({ page }) => {
  await page.goto("/builder");
  await page
    .getByRole("textbox", { name: "Título do dashboard", exact: true })
    .fill("Meu projeto portátil");
  await page
    .getByRole("combobox", { name: "Resolução do dashboard" })
    .selectOption("1920 × 1080");
  await page.getByRole("button", { name: "Visualizar", exact: true }).click();
  const png = await download(
    page,
    page.getByRole("button", { name: "Exportar PNG", exact: true }),
  );
  expect(pngSize(png.bytes)).toEqual([1920, 1080]);
  expect(png.bytes.length).toBeGreaterThan(20000);
  const saved = await download(
    page,
    page.getByRole("button", { name: "Salvar JSON" }),
  );
  const project = JSON.parse(saved.bytes.toString());
  expect(project.components).toHaveLength(8);
  expect(project.title).toBe("Meu projeto portátil");
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Escolher template" })
    .selectOption("vazio");
  await expect(page.locator(".builder-widget")).toHaveCount(0);
  await page
    .getByLabel("Importar projeto JSON", { exact: true })
    .setInputFiles({
      name: "projeto.json",
      mimeType: "application/json",
      buffer: saved.bytes,
    });
  await expect(page.locator(".builder-widget")).toHaveCount(8);
  await expect(
    page.getByRole("textbox", { name: "Título do dashboard", exact: true }),
  ).toHaveValue("Meu projeto portátil");
});
test("builder exporta a tabela inteira em 1280 × 720 e detecta conteúdo cortado", async ({
  page,
}) => {
  // An HTTP address on the local network can lack randomUUID.
  await page.addInitScript(() =>
    Object.defineProperty(crypto, "randomUUID", { value: undefined }),
  );
  await page.goto("/builder");
  await page
    .getByRole("combobox", { name: "Resolução do dashboard" })
    .selectOption("1280 × 720");
  const table = page.locator(".widget-table");
  expect(
    await table.evaluate(
      (widget) => widget.scrollHeight <= widget.clientHeight + 1,
    ),
  ).toBe(true);
  const exportPng = page.getByRole("button", {
    name: "Exportar PNG",
    exact: true,
  });
  const { bytes } = await download(page, exportPng);
  expect(pngSize(bytes)).toEqual([1280, 720]);

  const dense = await page.evaluate(() => {
    const project = JSON.parse(localStorage.getItem("dv-builder"));
    const table = project.components.find(
      (component) => component.type === "table",
    );
    return {
      ...project,
      columns: 2,
      components: Array.from({ length: 24 }, (_, i) => ({
        ...table,
        id: `table-${i}`,
        span: 2,
      })),
    };
  });
  await page.getByLabel("Importar projeto JSON").setInputFiles({
    name: "denso.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(dense)),
  });
  await expect(page.locator(".builder-widget")).toHaveCount(24);
  await exportPng.click();
  await expect(page.getByRole("alert")).toContainText(
    "O componente 1 não cabe no canvas",
  );
});
test("importação inválida e rede com erro preservam uma interface utilizável", async ({
  page,
}) => {
  await page.goto("/builder");
  await page
    .getByLabel("Importar projeto JSON", { exact: true })
    .setInputFiles({
      name: "ruim.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":1,"components":[{"type":"script"}]}'),
    });
  await expect(page.getByRole("alert")).toContainText("Projeto inválido");
  await expect(page.locator(".builder-widget")).toHaveCount(8);
  await page.route("**/datasets/vendas.csv", (route) => route.abort());
  await page.goto("/datasets?recurso=dataset-vendas");
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível carregar a prévia CSV",
  );
});

test("paleta pessoal persiste e fica disponível no builder", async ({
  page,
}) => {
  await page.goto("/paletas?recurso=palette-1");
  await page.getByLabel("Editar cor 1", { exact: true }).fill("#123456");
  await page
    .getByRole("button", { name: "Salvar combinação nos favoritos" })
    .click();
  await page.getByRole("button", { name: "Fechar prévia" }).click();
  await page.goto("/favoritos");
  await expect(
    page.getByRole("heading", {
      name: "Hub Original · Minha paleta",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Hub Original · Minha paleta", exact: true })
    .click();
  await expect(page.locator(".palette-editor")).toContainText("#123456");
  await page.goto("/builder");
  await page
    .getByRole("combobox", { name: "Paleta do dashboard" })
    .selectOption({ label: "Hub Original · Minha paleta" });
  await expect(
    page.getByLabel("Cor 1 do dashboard", { exact: true }),
  ).toHaveValue("#123456");
});

test("pesquisa global atualiza os resultados sem sair da página", async ({
  page,
  isMobile,
}) => {
  if (isMobile) {
    await page.goto("/dax");
    await page
      .getByRole("link", { name: "Pesquisar recursos", exact: true })
      .click();
  } else {
    await page.goto("/busca?q=receita");
  }
  const input = page.getByRole("textbox", {
    name: isMobile ? "Pesquisar recursos" : "Pesquisa global",
    exact: true,
  });
  await input.fill("logistica");
  await input.press("Enter");
  await expect(
    page.getByRole("textbox", { name: "Pesquisar recursos", exact: true }),
  ).toHaveValue("logistica");
  await expect(
    page.getByRole("heading", { name: "Entregas e distribuição", exact: true }),
  ).toBeVisible();
});
