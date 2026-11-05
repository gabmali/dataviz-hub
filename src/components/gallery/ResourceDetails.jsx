import { useEffect, useRef, useState } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { iconRegistry as Lucide } from "../common/iconRegistry";
import Papa from "papaparse";
import Prism from "prismjs";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-python";
import { Icon, Favorite } from "../common/UI";
import { useApp } from "../../contexts/AppContext";
import DashboardExplorer from "../charts/DashboardExplorer";
import { Chart } from "../charts/Charts";
import {
  backgroundSvg,
  exportElement,
  svgToPng,
  downloadText,
  downloadJSON,
  copy,
  powerBITheme,
  rgb,
  contrastText,
} from "../../utils/export";
import { resolutions } from "../../utils/builder";
import lucideLicense from "../../data/lucide-license.txt?raw";
export function iconSvg(item, color = "#102A43", size = 64) {
  if (
    !/^#[\da-f]{6}$/i.test(color) ||
    ![16, 24, 32, 48, 64, 128, 256].includes(Number(size))
  )
    throw new Error("Cor ou tamanho de ícone inválido.");
  const svg = renderToStaticMarkup(
    createElement(Lucide[item.icon] || Lucide.Square, {
      xmlns: "http://www.w3.org/2000/svg",
      color,
      width: Number(size),
      height: Number(size),
      strokeWidth: 1.7,
    }),
  );
  return svg.replace(
    ">",
    `><metadata>${lucideLicense.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</metadata>`,
  );
}
export default function ResourceDetails({
  item,
  iconColor = "#102A43",
  iconSize = 64,
}) {
  const { run, savePalette, recordDashboardView } = useApp();
  const preview = useRef();
  const lastDashboard = useRef(null);
  const [resolution, setResolution] = useState("1600 × 900");
  const [colors, setColors] = useState(item.colors || []);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [color, setColor] = useState(iconColor);
  const [size, setSize] = useState(iconSize);
  const [generated, setGenerated] = useState(false);
  const [w, h] = resolutions[resolution];
  useEffect(() => {
    if (item.kind !== "dashboards" || lastDashboard.current === item.id) return;
    lastDashboard.current = item.id;
    recordDashboardView(item.id);
  }, [item.id, item.kind, recordDashboardView]);
  useEffect(() => {
    if (item.kind !== "datasets") return;
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}datasets/${item.slug}.csv`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error("Não foi possível carregar o CSV.");
        return r.text();
      })
      .then((text) => {
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        if (parsed.errors.length) throw new Error("CSV inválido.");
        setRows(parsed.data.slice(0, 8));
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            "Não foi possível carregar a prévia CSV. Recarregue a página.",
          );
      });
    return () => controller.abort();
  }, [item.id, item.kind, item.slug]);
  const copyValue = (text) =>
    run(() => copy(text), "Copiado para a área de transferência.");
  return (
    <div className="detail-body">
      <div className="detail-heading">
        <span className="category-tag">{item.category}</span>
        <p>{item.description}</p>
        <div className="resource-tags">
          {item.tags?.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        <Favorite item={item} />
      </div>
      {item.kind === "dashboards" && (
        <>
          <div className="dashboard-callout">
            <Icon name="MousePointerClick" size={20} />
            <div>
              <strong>Como usar a prévia interativa</strong>
              <p>
                Selecione uma barra de região, uma fatia da rosca ou um mês no
                gráfico de evolução. Os filtros se combinam e atualizam os
                indicadores e a tabela.
              </p>
            </div>
          </div>
          <DashboardExplorer item={item} previewRef={preview} />
          <div className="detail-actions">
            <button
              className="button primary"
              onClick={() =>
                run(() =>
                  exportElement(preview.current, `${item.id}.png`, 1600, 900),
                )
              }
            >
              <Icon name="Download" size={16} /> Baixar PNG 1600 × 900
            </button>
          </div>
          <div className="detail-columns">
            <div>
              <h3>Indicadores apresentados</h3>
              <ul>
                {item.metrics.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Sobre o modelo</h3>
              <p>{item.model}</p>
              <div className="swatches">
                {item.colors.map((c) => (
                  <button
                    key={c}
                    style={{ background: c }}
                    title={`Copiar ${c}`}
                    aria-label={`Copiar ${c}`}
                    onClick={() => copyValue(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {item.kind === "backgrounds" && (
        <>
          <img
            className="background-large"
            alt={`Fundo ${item.name} com áreas para quatro KPIs e dois gráficos`}
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(backgroundSvg(item))}`}
          />
          <div className="detail-actions">
            <label>
              Resolução
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              >
                {Object.keys(resolutions).map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <button
              className="button primary"
              onClick={() =>
                run(() =>
                  svgToPng(
                    backgroundSvg(item, w, h),
                    w,
                    h,
                    `${item.id}-${w}x${h}.png`,
                  ),
                )
              }
            >
              <Icon name="Download" size={16} /> Baixar PNG
            </button>
          </div>
          <div className="swatches labeled">
            {item.colors.map((c) => (
              <button key={c} onClick={() => copyValue(c)}>
                <i style={{ background: c }} />
                {c}
                <Icon name="Copy" size={13} />
              </button>
            ))}
          </div>
        </>
      )}
      {item.kind === "icons" && (
        <>
          <div className="icon-live-preview">
            <Icon name={item.icon} size={Number(size)} color={color} />
          </div>
          <div className="detail-actions">
            <label>
              Cor
              <input
                aria-label="Cor do ícone"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
            <label>
              Tamanho
              <select
                aria-label="Tamanho do ícone"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              >
                {[16, 24, 32, 48, 64, 128, 256].map((x) => (
                  <option key={x} value={x}>
                    {x} px
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button primary"
              onClick={() =>
                run(() =>
                  downloadText(
                    iconSvg(item, color, size),
                    `${item.icon}.svg`,
                    "image/svg+xml",
                  ),
                )
              }
            >
              Baixar SVG
            </button>
            <button
              className="button secondary"
              onClick={() =>
                run(() =>
                  svgToPng(
                    iconSvg(item, color, size),
                    size,
                    size,
                    `${item.icon}.png`,
                  ),
                )
              }
            >
              Baixar PNG
            </button>
            <button
              className="button secondary"
              onClick={() => copyValue(iconSvg(item, color, size))}
            >
              Copiar SVG
            </button>
            <button
              className="button secondary"
              onClick={() => copyValue(color)}
            >
              Copiar cor
            </button>
          </div>
          <p className="help-text">
            Lucide · licença ISC. PNG com fundo transparente. SVG escalável.
          </p>
        </>
      )}
      {item.kind === "palettes" && (
        <>
          <div className="palette-editor" ref={preview}>
            {colors.map((c, i) => (
              <div
                key={i}
                style={{
                  background: c,
                  color: contrastText(c),
                }}
              >
                <input
                  className="color-picker"
                  aria-label={`Editar cor ${i + 1}`}
                  type="color"
                  value={c}
                  onChange={(e) => {
                    setColors((prev) =>
                      prev.map((x, j) => (i === j ? e.target.value : x)),
                    );
                    setGenerated(true);
                  }}
                />
                <strong>{c.toUpperCase()}</strong>
                <button onClick={() => copyValue(c)}>Copiar HEX</button>
                <button onClick={() => copyValue(rgb(c))}>Copiar RGB</button>
              </div>
            ))}
          </div>
          <div className="detail-actions">
            <button
              className="button secondary"
              onClick={() => {
                const hue = Math.floor(Math.random() * 360);
                const values = Array.from({ length: 5 }, (_, i) => {
                  const h = (hue + i * 35) % 360,
                    s = 0.6,
                    l = 0.25 + i * 0.12;
                  const a = s * Math.min(l, 1 - l);
                  const f = (n) => {
                    const k = (n + h / 30) % 12;
                    return Math.round(
                      255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))),
                    )
                      .toString(16)
                      .padStart(2, "0");
                  };
                  return `#${f(0)}${f(8)}${f(4)}`;
                });
                setColors(values);
                setGenerated(true);
              }}
            >
              <Icon name="Shuffle" size={16} /> Gerar combinação
            </button>
            <button
              className="button primary"
              onClick={() =>
                run(() =>
                  downloadJSON(
                    powerBITheme(
                      generated ? `${item.name} personalizada` : item.name,
                      colors,
                    ),
                    "tema-powerbi.json",
                  ),
                )
              }
            >
              Exportar tema Power BI
            </button>
            <button
              className="button secondary"
              onClick={() =>
                run(() =>
                  downloadJSON({ name: item.name, colors }, "paleta.json"),
                )
              }
            >
              Baixar JSON
            </button>
            <button
              className="button secondary"
              onClick={() =>
                run(() => exportElement(preview.current, "paleta.png", 1600))
              }
            >
              Baixar PNG
            </button>
            <button
              className="button secondary"
              onClick={() => savePalette(item.name, colors)}
            >
              <Icon name="Heart" size={16} /> Salvar combinação nos favoritos
            </button>
          </div>
          <p className="help-text">
            Clique nas cores para editar. Salve sua combinação nos favoritos
            para voltar a ela neste navegador.
          </p>
          <div className="palette-chart">
            <h3>As cores em ação</h3>
            <Chart type="bar" colors={colors} />
          </div>
          <p className="help-text">
            Tema mínimo: name, dataColors, background, foreground e tableAccent.{" "}
            <a
              href="https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-report-themes"
              target="_blank"
              rel="noreferrer"
            >
              Formato documentado pela Microsoft ↗
            </a>
          </p>
        </>
      )}
      {item.kind === "datasets" && (
        <>
          <div className="dataset-summary">
            <span>
              <b>{item.rows}</b> linhas
            </span>
            <span>
              <b>{item.columns}</b> colunas
            </span>
            <span>
              <b>{item.difficulty}</b> nível
            </span>
            <span>
              <b>100%</b> fictício
            </span>
          </div>
          {item.quality.length > 0 && (
            <div className="quality-note">
              <Icon name="Info" />
              <div>
                <strong>Exercícios de limpeza incluídos</strong>
                {item.quality.map((x) => (
                  <p key={x}>{x}</p>
                ))}
              </div>
            </div>
          )}
          <div className="detail-actions">
            <a
              className="button primary"
              download
              href={`${import.meta.env.BASE_URL}datasets/${item.slug}.csv`}
            >
              <Icon name="Download" size={16} /> Baixar CSV
            </a>
            <a
              className="button secondary"
              download
              href={`${import.meta.env.BASE_URL}datasets/${item.slug}.xlsx`}
            >
              Baixar XLSX
            </a>
          </div>
          <h3>Prévia dos dados</h3>
          {error ? (
            <p role="alert">{error}</p>
          ) : !rows ? (
            <p role="status">Carregando prévia do CSV…</p>
          ) : (
            <div
              className="table-scroll"
              role="region"
              aria-label="Prévia dos dados"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    {item.dictionary.map((c) => (
                      <th key={c.name}>{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {item.dictionary.map((c) => (
                        <td key={c.name}>{r[c.name] || <em>ausente</em>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="detail-columns">
            <div>
              <h3>KPIs sugeridos</h3>
              <ul>
                {item.kpis.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
              <h3>Análises sugeridas</h3>
              <ul>
                {item.analyses.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Dicionário de dados</h3>
              <dl className="dictionary">
                {item.dictionary.map((c) => (
                  <div key={c.name}>
                    <dt>
                      {c.name} <small>{c.type}</small>
                    </dt>
                    <dd>{c.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </>
      )}
      {["dax", "sql", "python"].includes(item.kind) && (
        <>
          <div className="code-toolbar">
            <span>
              {item.dialect || item.libraries?.join(" · ") || "DAX · Power BI"}
            </span>
            <button
              className="button secondary small"
              onClick={() => copyValue(item.code)}
            >
              <Icon name="Copy" size={15} /> Copiar código
            </button>
          </div>
          <pre
            className="code-block"
            tabIndex={0}
            aria-label="Código do exemplo"
          >
            <code
              dangerouslySetInnerHTML={{
                __html: Prism.highlight(
                  item.code,
                  Prism.languages[
                    item.kind === "python"
                      ? "python"
                      : item.kind === "sql"
                        ? "sql"
                        : "plain"
                  ] || Prism.languages.plain,
                  item.kind,
                ),
              }}
            />
          </pre>
          <div className="detail-columns">
            <div>
              <h3>Como funciona</h3>
              <p>{item.explanation}</p>
              {item.steps && (
                <ol>
                  {item.steps.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ol>
              )}
              <h3>
                {item.kind === "python"
                  ? "Resultado esperado"
                  : "Exemplo de uso"}
              </h3>
              <p>
                {item.output ||
                  item.example ||
                  "Execute em uma tabela importada dos datasets disponíveis, no dialeto indicado."}
              </p>
            </div>
            <div>
              <h3>
                {item.kind === "python"
                  ? "Bibliotecas e entrada"
                  : "Pré-requisitos"}
              </h3>
              <p>
                {item.prerequisites ||
                  `${item.libraries.join(", ")}. Entrada: ${item.input}`}
              </p>
              <p className="help-text">
                Os exemplos são de consulta e aprendizado. Nenhum código é
                executado pela plataforma.
              </p>
            </div>
          </div>
        </>
      )}
      {item.kind === "kpis" && (
        <>
          <div className="formula-box">
            <span>FÓRMULA</span>
            <h3>{item.formula}</h3>
            <p>{item.example}</p>
          </div>
          <div className="detail-columns">
            <div>
              <h3>Interpretação</h3>
              <p>{item.interpretation}</p>
              <h3>Aplicação no dashboard</h3>
              <p>{item.usage}</p>
            </div>
            <div>
              <Chart type="line" />
              <p className="help-text">
                Tendência ilustrativa; valores fictícios sem vínculo com o
                exemplo numérico.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
