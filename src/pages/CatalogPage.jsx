import { useMemo, useState, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import JSZip from "jszip";
import {
  sections,
  catalog,
  filterResources,
  allResources,
} from "../data/catalog";
import { Icon, Favorite, Empty, Modal } from "../components/common/UI";
import DashboardPreview from "../components/charts/DashboardPreview";
import ResourceDetails, {
  iconSvg,
} from "../components/gallery/ResourceDetails";
import { backgroundSvg, downloadBlob } from "../utils/export";
import { useApp } from "../contexts/AppContext";
import lucideLicense from "../data/lucide-license.txt?raw";
export function ResourceCard({
  item,
  onOpen,
  iconColor = "#102A43",
  iconSize = 32,
  selected = false,
  onSelect,
}) {
  const kind = item.kind;
  return (
    <article className={`resource-card ${kind}-card`}>
      {kind === "dashboards" && (
        <button
          className="dashboard-thumb"
          aria-label={`Visualizar ${item.name}`}
          onClick={() => onOpen(item)}
        >
          <DashboardPreview item={item} compact />
          <span className="preview-hover">
            <Icon name="Maximize2" size={16} /> Prévia interativa
          </span>
        </button>
      )}
      {kind === "backgrounds" && (
        <button
          className="background-thumb"
          onClick={() => onOpen(item)}
          aria-label={`Visualizar ${item.name}`}
        >
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(backgroundSvg(item))}`}
            alt={`Fundo ${item.name}`}
          />
          <span className="thumb-resolution">16:9 · PNG</span>
        </button>
      )}
      {kind === "palettes" && (
        <button
          className="palette-thumb"
          onClick={() => onOpen(item)}
          aria-label={`Editar ${item.name}`}
        >
          {item.colors.map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
        </button>
      )}
      {kind === "icons" && (
        <>
          <label className="icon-select">
            <input
              type="checkbox"
              aria-label={`Selecionar ${item.name} para ZIP`}
              checked={selected}
              onChange={() => onSelect?.(item.id)}
            />
          </label>
          <button
            className="icon-thumb"
            onClick={() => onOpen(item)}
            aria-label={`Personalizar ${item.name}`}
          >
            <Icon name={item.icon} size={Number(iconSize)} color={iconColor} />
          </button>
        </>
      )}
      <div className="resource-info">
        <div className="resource-meta">
          <span className="category-tag">{item.category}</span>
          {kind === "datasets" && (
            <span className="format-label">CSV · XLSX</span>
          )}
          {item.dialect && <span className="format-label">{item.dialect}</span>}
        </div>
        <div className="card-title">
          <button onClick={() => onOpen(item)}>
            <h3>{item.name}</h3>
          </button>
          <Favorite item={item} />
        </div>
        {!["dashboards", "backgrounds", "icons", "palettes"].includes(kind) && (
          <p className="resource-description">{item.description}</p>
        )}
        {["dax", "sql", "python"].includes(kind) && (
          <pre className="code-preview">{item.code.slice(0, 170)}</pre>
        )}
        {kind === "kpis" && <div className="kpi-formula">{item.formula}</div>}
        <div className="resource-bottom">
          {item.colors ? (
            <span className="color-dots">
              {item.colors.slice(0, 5).map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </span>
          ) : kind === "datasets" ? (
            <span>
              <Icon name="Table" size={13} /> {item.rows} linhas ·{" "}
              {item.columns} colunas
            </span>
          ) : (
            <span>
              {item.difficulty ||
                (kind === "python"
                  ? "Script documentado"
                  : kind === "icons"
                    ? "SVG · PNG"
                    : kind === "kpis"
                      ? "Fórmula + exemplo"
                      : "Medida documentada")}
            </span>
          )}
          <button onClick={() => onOpen(item)}>
            {kind === "icons"
              ? "Personalizar"
              : kind === "datasets"
                ? "Explorar dados"
                : kind === "palettes"
                  ? "Abrir Studio"
                  : kind === "dashboards"
                    ? "Prévia interativa"
                    : "Ver recurso"}
            <Icon name="ArrowUpRight" size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
export default function CatalogPage({
  kind,
  favoritesPage = false,
  searchPage = false,
}) {
  const { favorites, run, savedPalettes } = useApp();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [sort, setSort] = useState("newest");
  const [color, setColor] = useState("Todas");
  const [type, setType] = useState("Todos");
  const [iconColor, setIconColor] = useState("#102A43");
  const [iconSize, setIconSize] = useState(32);
  const [selected, setSelected] = useState([]);
  const urlQuery = params.get("q") || "";
  useEffect(() => {
    if (searchPage) setQuery(urlQuery);
  }, [searchPage, urlQuery]);
  const section = sections.find((s) => s.key === kind);
  const resourceIndex = useMemo(
    () => [...allResources, ...savedPalettes],
    [savedPalettes],
  );
  const items = useMemo(
    () =>
      favoritesPage
        ? resourceIndex.filter((x) => favorites.includes(x.id))
        : searchPage
          ? resourceIndex
          : resourceIndex.filter((x) => x.kind === kind),
    [kind, favoritesPage, searchPage, favorites, resourceIndex],
  );
  const categories = [...new Set(items.map((x) => x.category))];
  const urlCategory = params.get("categoria");
  const category = categories.includes(urlCategory) ? urlCategory : "Todas";
  const results = filterResources(items, {
    query,
    category,
    color,
    type,
    sort,
  });
  const active = resourceIndex.find((x) => x.id === params.get("recurso"));
  const onClose = useCallback(() => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete("recurso");
        return p;
      },
      { replace: true },
    );
  }, [setParams]);
  const open = (item) => {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("recurso", item.id);
      return p;
    });
  };
  const clear = () => {
    setQuery("");
    setColor("Todas");
    setType("Todos");
    setSort("newest");
    setParams({});
  };
  const changeFilterParam = (key, value) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  const zip = () =>
    run(async () => {
      const zip = new JSZip();
      for (const item of items.filter((x) => selected.includes(x.id)))
        zip.file(
          `${item.icon}.svg`,
          iconSvg(item, iconColor, Number(iconSize)),
        );
      zip.file("LICENSE.txt", lucideLicense);
      downloadBlob(
        await zip.generateAsync({ type: "blob" }),
        "dataviz-icones.zip",
      );
    });
  return (
    <div className="page catalog-page">
      <div className="breadcrumbs">
        <Link to="/">Visão geral</Link>
        <Icon name="ChevronRight" size={13} />
        <span>
          {favoritesPage
            ? "Favoritos"
            : searchPage
              ? "Pesquisa global"
              : section?.label}
        </span>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {favoritesPage
              ? "SEU REPERTÓRIO, SEMPRE À MÃO"
              : searchPage
                ? "TODAS AS POSSIBILIDADES, EM UM LUGAR"
                : "BIBLIOTECA DE RECURSOS"}
          </span>
          <h1>
            {favoritesPage
              ? "Seus favoritos"
              : searchPage
                ? "Encontre seu próximo recurso"
                : section?.label}
            <span>.</span>
          </h1>
          <p>
            {favoritesPage
              ? "Uma coleção de ideias para voltar sempre. Salva neste navegador."
              : searchPage
                ? "Pesquise em dashboards, fundos, ícones, dados, códigos e indicadores."
                : section?.detail}
          </p>
        </div>
        <div className="catalog-total">
          <Icon name={section?.icon || "Layers"} size={22} />
          <b>{items.length}</b> recursos
        </div>
      </div>
      {kind === "dashboards" && (
        <div className="dashboard-callout dashboard-gallery-callout">
          <Icon name="MousePointerClick" size={22} />
          <div>
            <strong>Teste os filtros nos gráficos</strong>
            <p>
              Selecione uma região, um canal ou um mês e acompanhe os
              indicadores e a tabela em tempo real.
            </p>
          </div>
          <button
            className="button primary"
            type="button"
            onClick={() => open(catalog.dashboards[0])}
          >
            Testar dashboard interativo <Icon name="ArrowRight" size={16} />
          </button>
        </div>
      )}
      {kind === "palettes" && (
        <div className="studio-intro">
          <Icon name="Palette" size={23} />
          <div>
            <strong>Color Palette Studio</strong>
            <p>
              Abra uma paleta para editar cores, gerar combinações e exportar um
              tema Power BI.
            </p>
          </div>
        </div>
      )}
      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Icon name="Search" size={18} />
          <input
            aria-label="Pesquisar recursos"
            placeholder={`Pesquisar ${section?.short?.toLowerCase() || section?.label.toLowerCase() || "recursos"}...`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (searchPage) changeFilterParam("q", e.target.value);
            }}
          />
        </div>
        <label className="filter-select">
          <span className="sr-only">Categoria</span>
          <select
            aria-label="Filtrar categoria"
            value={category}
            onChange={(e) =>
              changeFilterParam(
                "categoria",
                e.target.value === "Todas" ? "" : e.target.value,
              )
            }
          >
            <option value="Todas">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="filter-select">
          <span className="sr-only">Ordenação</span>
          <select
            aria-label="Ordenar recursos"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Mais recentes</option>
            <option value="az">Nome: A–Z</option>
          </select>
        </label>
        <button className="button secondary small" onClick={clear}>
          <Icon name="RotateCcw" size={15} /> Limpar
        </button>
      </div>
      {kind === "dashboards" && (
        <div className="extra-filters">
          <span>
            <Icon name="SlidersHorizontal" size={15} /> Refine sua inspiração
          </span>
          <label>
            Cor{" "}
            <select
              aria-label="Filtrar cor"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option>Todas</option>
              {["Azul", "Verde", "Roxo", "Rosa"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Tipo{" "}
            <select
              aria-label="Filtrar tipo"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>Todos</option>
              {["Gerencial", "Analítico", "Estratégico"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      {kind === "icons" && (
        <div className="extra-filters">
          <label>
            Cor{" "}
            <input
              type="color"
              aria-label="Cor dos ícones"
              value={iconColor}
              onChange={(e) => setIconColor(e.target.value)}
            />
          </label>
          <label>
            Tamanho{" "}
            <select
              aria-label="Tamanho dos ícones"
              value={iconSize}
              onChange={(e) => setIconSize(Number(e.target.value))}
            >
              {[16, 24, 32, 48, 64, 128, 256].map((x) => (
                <option key={x} value={x}>
                  {x} px
                </option>
              ))}
            </select>
          </label>
          <button
            className="button secondary small"
            onClick={() => setSelected(results.map((x) => x.id))}
          >
            Selecionar resultados
          </button>
          <button
            className="button secondary small"
            onClick={() => setSelected([])}
          >
            Desmarcar
          </button>
          <button
            className="button primary small"
            disabled={!selected.length}
            onClick={zip}
          >
            <Icon name="Download" size={15} /> Exportar ZIP ({selected.length})
          </button>
        </div>
      )}
      <div className="results-label">
        <span>
          <b>{results.length}</b>{" "}
          {results.length === 1 ? "recurso encontrado" : "recursos encontrados"}
          {query && <> para “{query}”</>}
        </span>
        <span>
          <Icon name="CheckCircle2" size={14} /> Originais, gratuitos e prontos
          para explorar
        </span>
      </div>
      {results.length ? (
        <div
          className={`resource-grid ${kind === "icons" ? "icons-grid" : ""} ${["dax", "sql", "python", "kpis"].includes(kind) ? "technical-grid" : ""}`}
        >
          {results.map((item) => (
            <ResourceCard
              key={item.id}
              item={item}
              onOpen={open}
              iconColor={iconColor}
              iconSize={iconSize}
              selected={selected.includes(item.id)}
              onSelect={(id) =>
                setSelected((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id],
                )
              }
            />
          ))}
        </div>
      ) : (
        <Empty
          title={
            favoritesPage && items.length === 0
              ? "Sua coleção começa com um coração"
              : "Nenhum recurso encontrado"
          }
          detail={
            favoritesPage && items.length === 0
              ? "Toque no coração de um recurso para salvá-lo aqui."
              : "Tente buscar outro termo ou combinar menos filtros."
          }
        >
          {favoritesPage && items.length === 0 ? (
            <Link className="button primary" to="/dashboards">
              Explorar dashboards
            </Link>
          ) : (
            <button className="button secondary" onClick={clear}>
              Limpar filtros
            </button>
          )}
        </Empty>
      )}
      {active && (
        <Modal
          title={active.name}
          wide={["dashboards", "datasets", "backgrounds"].includes(active.kind)}
          onClose={onClose}
        >
          <ResourceDetails
            key={active.id}
            item={active}
            iconColor={iconColor}
            iconSize={iconSize}
          />
        </Modal>
      )}
    </div>
  );
}
