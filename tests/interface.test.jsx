import { Suspense } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../src/App";
import { AppProvider } from "../src/contexts/AppContext";
import { BuilderComponent } from "../src/pages/Builder";
import { makeComponent } from "../src/utils/builder";
import { Chart } from "../src/components/charts/Charts";
function renderRoute(path = "/") {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[path]}>
        <Suspense fallback={<p>Carregando</p>}>
          <AppRoutes />
        </Suspense>
      </MemoryRouter>
    </AppProvider>,
  );
}
describe("Interface integrada", () => {
  it("navega da home para a biblioteca DAX", async () => {
    renderRoute();
    await userEvent.click(screen.getByRole("link", { name: "DAX 15" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: /Biblioteca DAX/ }),
    ).toBeVisible();
  });
  it("pesquisa, filtra e limpa recursos", async () => {
    renderRoute("/dax");
    await screen.findByRole("heading", { level: 1, name: /Biblioteca DAX/ });
    await userEvent.type(
      screen.getByRole("textbox", { name: "Pesquisar recursos" }),
      "receita",
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Filtrar categoria" }),
      "Acumulados",
    );
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Receita Acumulada" }),
    ).toBeVisible();
    await userEvent.clear(
      screen.getByRole("textbox", { name: "Pesquisar recursos" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Pesquisar recursos" }),
      "inexistente",
    );
    expect(screen.getByText("Nenhum recurso encontrado")).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Limpar filtros" }),
    );
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(15);
  });
  it("persiste e remove favoritos", async () => {
    const view = renderRoute("/dax");
    const button = await screen.findByRole("button", {
      name: "Adicionar aos favoritos: Receita Total",
    });
    await userEvent.click(button);
    expect(JSON.parse(localStorage.getItem("dv-favorites"))).toContain("dax-1");
    view.unmount();
    renderRoute("/favoritos");
    expect(
      await screen.findByRole("heading", { name: "Receita Total" }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Remover dos favoritos: Receita Total",
      }),
    );
    expect(screen.getByText("Sua coleção começa com um coração")).toBeVisible();
  });
  it("abre e fecha o modal pelo teclado", async () => {
    renderRoute("/sql?recurso=sql-1");
    expect(
      await screen.findByRole("dialog", { name: "Selecionar pedidos" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("mostra 404 e alterna o tema", async () => {
    renderRoute("/pagina-inexistente");
    expect(
      screen.getByRole("heading", { name: "Essa página saiu do radar." }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Ativar tema escuro" }),
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(JSON.parse(localStorage.getItem("dv-theme"))).toBe("dark");
  });
  it("edita e remove um KPI no builder", async () => {
    renderRoute("/builder");
    await screen.findByRole("heading", { level: 1, name: /Dashboard Builder/ });
    await userEvent.click(
      screen.getByRole("button", { name: "Adicionar Cartão KPI" }),
    );
    const title = screen.getByRole("textbox", { name: "Título do componente" });
    await userEvent.clear(title);
    await userEvent.type(title, "Receita teste");
    expect(
      screen.getByRole("button", { name: "Selecionar Receita teste" }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Remover componente" }),
    );
    expect(
      screen.queryByRole("button", { name: "Selecionar Receita teste" }),
    ).not.toBeInTheDocument();
  });
  it("renderiza gráficos reais e todos os tipos de bloco", () => {
    render(<Chart type="bar" />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("bar"),
    );
    expect(
      document.querySelector(".recharts-responsive-container"),
    ).toBeInTheDocument();
    for (const type of ["kpi", "text", "title", "separator", "table", "pie"]) {
      const v = render(
        <BuilderComponent
          component={makeComponent(type)}
          colors={["#102A43", "#F97316", "#38BDF8"]}
        />,
      );
      expect(v.container.firstChild).toBeTruthy();
      v.unmount();
    }
  });
  it("mostra erro de rede na prévia de dataset", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    renderRoute("/datasets?recurso=dataset-vendas");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar a prévia CSV",
    );
    vi.unstubAllGlobals();
  });
});
