import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/common/UI";
import { Chart, DataTable } from "../components/charts/Charts";
import {
  componentTypes,
  typeLabels,
  resolutions,
  initialProject,
  makeComponent,
  validateProject,
} from "../utils/builder";
import { downloadJSON, exportElement } from "../utils/export";
import { catalog } from "../data/catalog";
import { useApp } from "../contexts/AppContext";
const typeIcons = {
  kpi: "SquareActivity",
  bar: "ChartColumn",
  line: "ChartLine",
  area: "ChartArea",
  pie: "ChartPie",
  donut: "Donut",
  table: "Table",
  text: "AlignLeft",
  title: "Type",
  separator: "Minus",
};
export function BuilderComponent({ component, colors, dense = false }) {
  const c = component;
  if (c.type === "separator")
    return (
      <div className="builder-separator" style={{ background: colors[1] }} />
    );
  if (c.type === "title")
    return <h2 className="builder-title-block">{c.title}</h2>;
  if (c.type === "text") return <p className="builder-text-block">{c.title}</p>;
  if (c.type === "kpi")
    return (
      <>
        <span className="builder-widget-label">{c.title}</span>
        <strong className="builder-widget-value">{c.value}</strong>
        <span className="builder-widget-change">
          ↗ 12,5% <small>vs. período anterior · fictício</small>
        </span>
      </>
    );
  return (
    <>
      <h3>{c.title}</h3>
      <div className="builder-widget-chart">
        {c.type === "table" ? (
          <DataTable seed={c.seed} />
        ) : (
          <Chart type={c.type} colors={colors} seed={c.seed} compact={dense} />
        )}
      </div>
    </>
  );
}
function storedProject() {
  try {
    const raw = localStorage.getItem("dv-builder");
    return raw ? validateProject(JSON.parse(raw)) : initialProject();
  } catch {
    return initialProject();
  }
}
export default function Builder() {
  const { notify, run, savedPalettes } = useApp();
  const availablePalettes = [...catalog.palettes, ...savedPalettes];
  const [project, setProject] = useState(storedProject);
  const [selected, setSelected] = useState(null);
  const [template, setTemplate] = useState("comercial");
  const [scale, setScale] = useState(0.5);
  const [history, setHistory] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const wrapper = useRef();
  const canvas = useRef();
  const file = useRef();
  const [w, h] = resolutions[project.resolution];
  const active = project.components.find((c) => c.id === selected);
  const [saveState, setSaveState] = useState("Salvo neste navegador");
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setScale(Math.min(entries[0].contentRect.width / w, 1)),
    );
    if (wrapper.current) observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, [w]);
  useEffect(() => {
    try {
      localStorage.setItem("dv-builder", JSON.stringify(project));
      setSaveState("Salvo neste navegador");
    } catch {
      setSaveState("Salvamento local indisponível. Exporte o JSON.");
    }
  }, [project]);
  function update(next) {
    setHistory((prev) => [...prev.slice(-19), project]);
    setProject(typeof next === "function" ? next(project) : next);
  }
  function updateComponent(patch) {
    update((p) => ({
      ...p,
      components: p.components.map((c) =>
        c.id === selected ? { ...c, ...patch } : c,
      ),
    }));
  }
  function add(type) {
    if (project.components.length >= 24) {
      notify("O limite deste canvas é 24 componentes.", true);
      return;
    }
    const c = makeComponent(type, project.components.length);
    update((p) => ({ ...p, components: [...p.components, c] }));
    setSelected(c.id);
  }
  function move(delta) {
    const i = project.components.findIndex((c) => c.id === selected);
    const next = i + delta;
    if (i < 0 || next < 0 || next >= project.components.length) return;
    const components = [...project.components];
    [components[i], components[next]] = [components[next], components[i]];
    update({ ...project, components });
  }
  async function importFile(e) {
    const input = e.target;
    const f = input.files[0];
    if (!f) return;
    try {
      if (f.size > 1024 * 1024)
        throw new Error("O arquivo deve ter no máximo 1 MB.");
      const next = validateProject(JSON.parse(await f.text()));
      update(next);
      setSelected(null);
      notify("Projeto importado com sucesso.");
    } catch (err) {
      notify(
        err instanceof SyntaxError
          ? "O arquivo não contém um JSON válido."
          : err.message,
        true,
      );
    } finally {
      input.value = "";
    }
  }
  async function exportPNG() {
    const clipped = [
      ...canvas.current.querySelectorAll(".builder-widget"),
    ].findIndex((widget) => {
      const label = widget.querySelector(".builder-widget-label");
      const chart = widget.querySelector(".chart");
      return (
        widget.scrollHeight > widget.clientHeight + 1 ||
        widget.scrollWidth > widget.clientWidth + 1 ||
        (label && label.scrollWidth > label.clientWidth + 1) ||
        (chart && chart.clientHeight < 32)
      );
    });
    if (clipped >= 0) {
      throw new Error(
        `O componente ${clipped + 1} não cabe no canvas. Aumente a resolução, ajuste o layout ou reduza o conteúdo antes de exportar.`,
      );
    }
    canvas.current.classList.add("exporting");
    try {
      await exportElement(canvas.current, "meu-dashboard.png", w, h);
    } finally {
      canvas.current?.classList.remove("exporting");
    }
  }
  return (
    <div className={`page builder-page ${previewMode ? "preview-mode" : ""}`}>
      <div className="breadcrumbs">
        <Link to="/">Visão geral</Link>
        <Icon name="ChevronRight" size={13} />
        <span>Dashboard Builder</span>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">UM ESPAÇO PARA SUAS IDEIAS</span>
          <h1>
            Dashboard Builder<span>.</span>
          </h1>
          <p>
            Monte sua visão. Escolha os detalhes. Exporte sua próxima ideia.
          </p>
        </div>
        <span className="builder-save-state">
          <span className="live-dot" />
          {saveState}
        </span>
      </div>
      <div className="builder-actions">
        <div>
          <button
            className="button secondary small"
            disabled={!history.length}
            onClick={() => {
              setProject(history.at(-1));
              setHistory((prev) => prev.slice(0, -1));
              setSelected(null);
            }}
          >
            <Icon name="Undo2" size={15} /> Desfazer
          </button>
          <button
            className="button secondary small"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Icon name={previewMode ? "Pencil" : "Eye"} size={15} />
            {previewMode ? "Editar" : "Visualizar"}
          </button>
        </div>
        <div>
          <input
            ref={file}
            className="sr-only"
            aria-label="Importar projeto JSON"
            type="file"
            accept=".json,application/json"
            onChange={importFile}
          />
          <button
            className="button secondary small"
            onClick={() => file.current.click()}
          >
            <Icon name="Upload" size={15} /> Importar JSON
          </button>
          <button
            className="button secondary small"
            onClick={() =>
              run(() =>
                downloadJSON(validateProject(project), "dataviz-projeto.json"),
              )
            }
          >
            <Icon name="Save" size={15} /> Salvar JSON
          </button>
          <button
            className="button primary small"
            onClick={() => run(exportPNG)}
          >
            <Icon name="Download" size={15} /> Exportar PNG
          </button>
        </div>
      </div>
      <div className="builder-workspace">
        <aside className="builder-left">
          <div className="panel-heading">
            <Icon name="SlidersHorizontal" size={17} /> Configuração
          </div>
          <label>
            Template
            <select
              aria-label="Escolher template"
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                update(initialProject(e.target.value));
                setSelected(null);
              }}
            >
              <option value="comercial">Performance comercial</option>
              <option value="financeiro">Visão financeira</option>
              <option value="executivo">Visão executiva</option>
              <option value="vazio">Canvas em branco</option>
            </select>
          </label>
          <label>
            Resolução
            <select
              aria-label="Resolução do dashboard"
              value={project.resolution}
              onChange={(e) =>
                update({ ...project, resolution: e.target.value })
              }
            >
              {Object.keys(resolutions).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Layout
            <select
              aria-label="Colunas do layout"
              value={project.columns}
              onChange={(e) =>
                update({ ...project, columns: Number(e.target.value) })
              }
            >
              {[2, 3, 4].map((x) => (
                <option value={x} key={x}>
                  {x} colunas
                </option>
              ))}
            </select>
          </label>
          <label>
            Paleta
            <select
              aria-label="Paleta do dashboard"
              value={
                availablePalettes.find(
                  (x) =>
                    JSON.stringify(x.colors) === JSON.stringify(project.colors),
                )?.id || "custom"
              }
              onChange={(e) =>
                update({
                  ...project,
                  colors:
                    availablePalettes.find((x) => x.id === e.target.value)
                      ?.colors || project.colors,
                })
              }
            >
              <option value="custom">Personalizada</option>
              {availablePalettes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="builder-color-row">
            {project.colors.map((c, i) => (
              <input
                key={i}
                type="color"
                aria-label={`Cor ${i + 1} do dashboard`}
                value={c}
                onChange={(e) =>
                  update({
                    ...project,
                    colors: project.colors.map((x, j) =>
                      i === j ? e.target.value : x,
                    ),
                  })
                }
              />
            ))}
          </div>
          <div className="panel-heading components-heading">
            <Icon name="Blocks" size={17} /> Componentes{" "}
            <small>{project.components.length}/24</small>
          </div>
          <div className="component-picker">
            {componentTypes.map((type) => (
              <button
                key={type}
                onClick={() => add(type)}
                aria-label={`Adicionar ${typeLabels[type]}`}
              >
                <Icon name={typeIcons[type]} size={19} />
                <span>{typeLabels[type]}</span>
                <Icon name="Plus" size={13} />
              </button>
            ))}
          </div>
        </aside>
        <div className="builder-center">
          <div className="canvas-toolbar">
            <span>
              <span className="live-dot" /> {project.title}
            </span>
            <small>
              {w} × {h} px · {Math.round(scale * 100)}%
            </small>
          </div>
          <div className="canvas-surround" ref={wrapper}>
            <div className="canvas-viewport" style={{ height: h * scale }}>
              <div
                ref={canvas}
                className={`builder-canvas ${project.components.length > 12 ? "dense" : ""}`}
                data-testid="builder-canvas"
                data-background="#F3F6FA"
                style={{
                  width: w,
                  height: h,
                  transform: `scale(${scale})`,
                  "--builder-accent": project.colors[1],
                }}
              >
                <div className="builder-canvas-header">
                  <div>
                    <span className="dash-brand">
                      <i style={{ background: project.colors[1] }} />
                      DATAVIZ / STUDIO
                    </span>
                    <h2>{project.title}</h2>
                    <p>Visão dos resultados · Dados demonstrativos</p>
                  </div>
                  <span>JAN – AGO 2025</span>
                </div>
                <div
                  className="canvas-grid"
                  style={{
                    gridTemplateColumns: `repeat(${project.columns}, minmax(0,1fr))`,
                  }}
                >
                  {project.components.length ? (
                    project.components.map((c) => (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={previewMode ? -1 : 0}
                        aria-label={`Selecionar ${c.title}`}
                        aria-pressed={selected === c.id}
                        className={`builder-widget ${selected === c.id ? "selected" : ""} widget-${c.type}`}
                        style={{
                          gridColumn: `span ${Math.min(c.span, project.columns)}`,
                        }}
                        onClick={() => !previewMode && setSelected(c.id)}
                        onKeyDown={(e) => {
                          if (["Enter", " "].includes(e.key)) {
                            e.preventDefault();
                            setSelected(c.id);
                          }
                        }}
                      >
                        <BuilderComponent
                          component={c}
                          colors={project.colors}
                          dense={project.components.length > 12}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="canvas-empty">
                      <Icon name="PanelsTopLeft" size={60} />
                      <h3>Uma nova perspectiva começa aqui.</h3>
                      <p>Adicione componentes pelo painel lateral.</p>
                    </div>
                  )}
                </div>
                <div className="builder-canvas-footer">
                  DATAVIZ HUB <span>Composição original · Dados fictícios</span>
                </div>
              </div>
            </div>
          </div>
          <p className="canvas-help">
            <Icon name="Info" size={14} /> Selecione um componente para editar.
            Reorganize com os controles de posição. O PNG usa a resolução
            escolhida.
          </p>
        </div>
        <aside className="builder-right">
          <div className="panel-heading">
            <Icon name="Settings2" size={17} /> Propriedades
          </div>
          <label>
            Título do dashboard
            <input
              aria-label="Título do dashboard"
              value={project.title}
              maxLength={120}
              onChange={(e) => update({ ...project, title: e.target.value })}
            />
          </label>
          {active ? (
            <>
              <div className="selected-type">
                <Icon name={typeIcons[active.type]} size={18} />
                {typeLabels[active.type]}
              </div>
              <label>
                {active.type === "text" ? "Conteúdo" : "Título do componente"}
                <textarea
                  aria-label="Título do componente"
                  maxLength={300}
                  value={active.title}
                  onChange={(e) => updateComponent({ title: e.target.value })}
                />
              </label>
              {active.type === "kpi" && (
                <label>
                  Valor
                  <input
                    aria-label="Valor do KPI"
                    maxLength={80}
                    value={active.value}
                    onChange={(e) => updateComponent({ value: e.target.value })}
                  />
                </label>
              )}
              <label>
                Largura
                <select
                  aria-label="Largura do componente"
                  value={active.span}
                  onChange={(e) =>
                    updateComponent({ span: Number(e.target.value) })
                  }
                >
                  {[1, 2, 3, 4].map((x) => (
                    <option key={x} value={x}>
                      {x} {x === 1 ? "coluna" : "colunas"}
                    </option>
                  ))}
                </select>
              </label>
              <span className="property-label">Posição no layout</span>
              <div className="position-controls">
                <button
                  className="button secondary small"
                  disabled={project.components[0].id === selected}
                  onClick={() => move(-1)}
                >
                  <Icon name="ArrowUp" size={15} /> Antes
                </button>
                <button
                  className="button secondary small"
                  disabled={project.components.at(-1).id === selected}
                  onClick={() => move(1)}
                >
                  <Icon name="ArrowDown" size={15} /> Depois
                </button>
              </div>
              <button
                className="button danger small"
                onClick={() => {
                  update({
                    ...project,
                    components: project.components.filter(
                      (c) => c.id !== selected,
                    ),
                  });
                  setSelected(null);
                }}
              >
                <Icon name="Trash2" size={15} /> Remover componente
              </button>
            </>
          ) : (
            <div className="property-empty">
              <Icon name="MousePointer2" size={28} />
              <strong>Cuide dos detalhes</strong>
              <p>
                Selecione um componente no canvas para editar suas propriedades.
              </p>
            </div>
          )}
          <div className="builder-note">
            <Icon name="Info" size={16} />
            <p>
              Gráficos usam dados fictícios locais. JSON salva o projeto
              editável. PNG exporta a composição visual; não gera PBIX.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
