import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sections, catalog, allResources } from "../data/catalog";
import { Icon, SectionTitle, Favorite } from "../components/common/UI";
import DashboardPreview from "../components/charts/DashboardPreview";
import DashboardExplorer from "../components/charts/DashboardExplorer";
import { useApp } from "../contexts/AppContext";
export default function Home() {
  const [q, setQ] = useState("");
  const dashboardHeading = useRef(null);
  const navigate = useNavigate();
  const total = allResources.length;
  const featuredDashboard = catalog.dashboards[0];
  const { dashboardViews } = useApp();
  const mostViewed = catalog.dashboards
    .filter(({ id }) => dashboardViews[id] > 0)
    .sort((a, b) => dashboardViews[b.id] - dashboardViews[a.id])
    .slice(0, 3);
  return (
    <div className="home page">
      <div className="welcome">
        <div>
          <span className="eyebrow">
            SEU WORKSPACE DE INSPIRAÇÃO E PRODUTIVIDADE
          </span>
          <h1>
            Grandes análises começam aqui<span>.</span>
          </h1>
          <p>
            Menos tempo começando do zero. Mais tempo descobrindo o que importa.
          </p>
        </div>
        <span className="open-badge">
          <span className="live-dot" /> 100% gratuito e sem login
        </span>
      </div>
      <section className="hero">
        <div className="hero-text">
          <span className="hero-pill">
            <Icon name="Sparkles" size={14} /> CRIE. EXPLORE. TRANSFORME.
          </span>
          <h2>
            Crie dashboards incríveis.
            <br />
            <span>Economize horas</span>
            <br />
            de trabalho.
          </h2>
          <p>
            Encontre dashboards de referência, fundos profissionais, ícones,
            paletas de cores, datasets e códigos prontos para acelerar seus
            projetos de análise de dados.
          </p>
          <div className="hero-actions">
            <button
              className="button primary"
              type="button"
              onClick={() => dashboardHeading.current?.focus()}
            >
              <Icon name="MousePointerClick" size={17} /> Testar dashboard
              interativo
            </button>
            <Link className="button hero-secondary" to="/dashboards">
              Explorar recursos <Icon name="ArrowRight" size={17} />
            </Link>
            <Link className="button hero-secondary" to="/builder">
              <Icon name="PanelsTopLeft" size={17} /> Criar meu dashboard
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <Icon name="Check" size={14} /> Recursos originais
            </span>
            <span>
              <Icon name="Check" size={14} /> Downloads gratuitos
            </span>
            <span>
              <Icon name="Check" size={14} /> Pronto para usar
            </span>
          </div>
        </div>
        <section
          className="home-dashboard"
          aria-labelledby="home-dashboard-heading"
        >
          <h2 id="home-dashboard-heading" ref={dashboardHeading} tabIndex={-1}>
            <Icon name="MousePointerClick" size={19} /> Dashboard interativo
          </h2>
          <p>
            Selecione uma barra, uma fatia ou um mês para filtrar os indicadores
            e a tabela aqui mesmo.
          </p>
          <DashboardExplorer item={featuredDashboard} embedded />
        </section>
      </section>
      <div className="stats-strip">
        {[
          [total, "recursos no catálogo", "Layers"],
          [
            catalog.dashboards.length,
            "dashboards originais",
            "LayoutDashboard",
          ],
          [catalog.datasets.length, "datasets para praticar", "Database"],
          ["100%", "gratuito e aberto", "Heart"],
        ].map(([value, label, icon]) => (
          <div key={label}>
            <span className="stat-icon">
              <Icon name={icon} size={21} />
            </span>
            <div>
              <strong>{value}</strong>
              <small>{label}</small>
            </div>
          </div>
        ))}
      </div>
      <section className="explore-section" id="recursos">
        <SectionTitle
          title="O que vamos criar hoje?"
          description="Encontre o recurso certo para cada etapa do seu projeto."
        >
          <span className="subtle-count">
            10 categorias. Infinitas possibilidades.
          </span>
        </SectionTitle>
        <form
          className="main-search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/busca?q=${encodeURIComponent(q)}`);
          }}
        >
          <Icon name="Search" size={21} />
          <input
            aria-label="O que você procura?"
            placeholder="O que você procura? Dashboards, ícones, DAX, SQL, datasets..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="button dark" type="submit">
            Buscar recursos <Icon name="ArrowRight" size={16} />
          </button>
        </form>
        <div className="category-grid">
          {sections.map((s, i) => (
            <Link className={`category-card cat-${i}`} to={s.path} key={s.key}>
              <div className="category-icon">
                <Icon name={s.icon} size={24} />
              </div>
              <Icon name="ArrowUpRight" size={15} className="category-arrow" />
              <strong>{s.short || s.label}</strong>
              <span>
                {catalog[s.key]
                  ? `${catalog[s.key].length} ${s.key === "python" ? "scripts" : s.key === "dax" ? "medidas" : s.key === "sql" ? "consultas" : s.key === "kpis" ? "indicadores" : "recursos"}`
                  : "Monte do seu jeito"}
                <Icon name="ArrowRight" size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <SectionTitle
          eyebrow="CURADORIA DATAVIZ"
          title="Uma dose de inspiração"
          description="Abra um modelo e clique nos gráficos para combinar filtros de região, canal e mês."
        >
          <Link className="text-link" to="/dashboards">
            Ver todos os dashboards <Icon name="ArrowRight" size={16} />
          </Link>
        </SectionTitle>
        <div className="dashboard-grid">
          {[0, 1, 2].map((i) => {
            const d = catalog.dashboards[i];
            return (
              <article className="resource-card" key={d.id}>
                <Link
                  to={`/dashboards?recurso=${d.id}`}
                  className="dashboard-thumb"
                >
                  <DashboardPreview item={d} compact />
                  <span className="preview-hover">
                    <Icon name="Maximize2" size={17} /> Prévia interativa
                  </span>
                </Link>
                <div className="resource-info">
                  <div className="resource-meta">
                    <span className={`category-tag tag-${i}`}>
                      {d.category}
                    </span>
                    <span className="format-label">PNG · 1600 × 900</span>
                  </div>
                  <div className="card-title">
                    <Link to={`/dashboards?recurso=${d.id}`}>
                      <h3>{d.name}</h3>
                    </Link>
                    <Favorite item={d} />
                  </div>
                  <div className="resource-bottom">
                    <span className="color-dots">
                      {d.colors.slice(0, 4).map((c) => (
                        <i key={c} style={{ background: c }} />
                      ))}
                    </span>
                    <Link to={`/dashboards?recurso=${d.id}`}>
                      Prévia interativa <Icon name="ArrowUpRight" size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="builder-banner">
        <div className="banner-icon">
          <Icon name="PanelsTopLeft" size={32} />
        </div>
        <div>
          <span className="eyebrow">DO SEU JEITO. SEM COMPLICAÇÃO.</span>
          <h2>Um canvas em branco. Muitas possibilidades.</h2>
          <p>
            Escolha um layout, adicione gráficos e crie sua própria visão dos
            dados.
          </p>
        </div>
        <Link className="button dark" to="/builder">
          Abrir Dashboard Builder <Icon name="ArrowUpRight" size={17} />
        </Link>
      </section>
      <section className="home-bottom-grid">
        <div>
          <SectionTitle
            title="Novos no Hub"
            description="Recursos para sua próxima descoberta."
          />
          <div className="new-resource-list">
            {[
              { kind: "dax", item: catalog.dax[3], icon: "Sigma" },
              { kind: "datasets", item: catalog.datasets[0], icon: "Database" },
              { kind: "palettes", item: catalog.palettes[10], icon: "Palette" },
            ].map(({ kind, item, icon }) => (
              <Link
                to={`${sections.find((x) => x.key === kind).path}?recurso=${item.id}`}
                key={item.id}
              >
                <span className="list-icon">
                  <Icon name={icon} />
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {sections.find((x) => x.key === kind).label} ·{" "}
                    {item.category}
                  </small>
                </div>
                <span className="new-resource-tag">NOVO</span>
                <Icon name="ArrowUpRight" size={17} />
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle
            title="Do recurso ao resultado"
            description="Seu próximo projeto em três passos."
          />
          <div className="steps">
            {[
              [
                "01",
                "Encontre sua inspiração",
                "Explore recursos por categoria ou área de negócio.",
              ],
              [
                "02",
                "Faça do seu jeito",
                "Personalize cores, componentes e formatos.",
              ],
              [
                "03",
                "Leve para seu projeto",
                "Exporte, pratique e compartilhe suas descobertas.",
              ],
            ].map(([num, title, desc]) => (
              <div key={num}>
                <span>{num}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {mostViewed.length > 0 && (
        <section>
          <SectionTitle
            title="Seus dashboards mais vistos"
            description="Modelos que você mais abriu neste navegador."
          />
          <div className="new-resource-list">
            {mostViewed.map((item) => (
              <Link key={item.id} to={`/dashboards?recurso=${item.id}`}>
                <span className="list-icon">
                  <Icon name="LayoutDashboard" />
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.category}</small>
                </div>
                <Icon name="ArrowUpRight" size={17} />
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="business-section">
        <SectionTitle
          title="Explore pela sua área"
          description="Contextos diferentes. O mesmo poder dos dados."
        />
        <div className="business-links">
          {[
            "Vendas",
            "Financeiro",
            "Recursos Humanos",
            "Marketing",
            "Logística",
            "Indicadores Executivos",
          ].map((x) => (
            <Link to={`/dashboards?categoria=${encodeURIComponent(x)}`} key={x}>
              {x}
              <Icon name="ArrowUpRight" size={14} />
            </Link>
          ))}
        </div>
      </section>
      <div className="home-signoff">
        <Icon name="Sparkles" size={18} />
        <span>
          Tudo o que você precisa para transformar <b>dados em decisões.</b>
        </span>
      </div>
    </div>
  );
}
