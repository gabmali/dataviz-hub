import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { sections, catalog } from "../../data/catalog";
import { Icon } from "../common/UI";
import { useApp } from "../../contexts/AppContext";
export default function Layout() {
  const { theme, setTheme, favorites } = useApp();
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const sidebar = useRef(null);
  const menuButton = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!mobile) return;
    const viewport = window.matchMedia("(max-width: 760px)");
    const closeOnResize = () => {
      if (!viewport.matches) setMobile(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobile(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector("a")?.focus();
    viewport.addEventListener("change", closeOnResize);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      viewport.removeEventListener("change", closeOnResize);
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = overflow;
      menuButton.current?.focus();
    };
  }, [mobile]);
  const active = sections.find((s) => location.pathname === s.path);
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        tabIndex={mobile ? -1 : undefined}
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <aside
        id="site-sidebar"
        ref={sidebar}
        className={`sidebar ${mobile ? "open" : ""}`}
      >
        <Link to="/" className="brand" aria-label="DataViz Hub — início">
          <span className="brand-mark">
            <Icon name="ChartNoAxesColumnIncreasing" size={25} />
          </span>
          <span>
            DataViz<span className="brand-hub">Hub</span>
            <small>SEU PRÓXIMO INSIGHT COMEÇA AQUI</small>
          </span>
        </Link>
        <div className="workspace-badge">
          <span className="live-dot" /> Workspace de recursos{" "}
          <span className="free-tag">GRÁTIS</span>
        </div>
        <nav aria-label="Menu principal">
          <span className="nav-label">WORKSPACE</span>
          <NavLink to="/" end>
            <Icon name="House" />
            <span>Visão geral</span>
          </NavLink>
          <span className="nav-label resource-label">
            BIBLIOTECA DE RECURSOS
          </span>
          {sections.slice(0, 9).map((s) => (
            <NavLink key={s.key} to={s.path}>
              <Icon name={s.icon} />
              <span>{s.short || s.label}</span>
              <small>{catalog[s.key].length}</small>
            </NavLink>
          ))}
          <span className="nav-label resource-label">SEU ESPAÇO</span>
          <NavLink to="/builder">
            <Icon name="PanelsTopLeft" />
            <span>Dashboard Builder</span>
            <i className="new-tag">NOVO</i>
          </NavLink>
          <NavLink to="/favoritos">
            <Icon name="Heart" />
            <span>Favoritos</span>
            {favorites.length > 0 && <small>{favorites.length}</small>}
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-callout">
            <Icon name="Sparkles" size={20} />
            <strong>Da ideia ao dashboard.</strong>
            <p>Seu próximo projeto merece um bom ponto de partida.</p>
            <Link to="/builder">
              Começar a criar <Icon name="ArrowUpRight" size={15} />
            </Link>
          </div>
          <Link to="/sobre" className="about-link">
            <Icon name="Info" size={17} /> Sobre o projeto{" "}
            <Icon name="ArrowUpRight" size={14} />
          </Link>
          <div className="sidebar-footer">
            <span className="mini-logo">D</span>
            <div>
              Feito para a comunidade<small>Gratuito. Sempre acessível.</small>
            </div>
            <Icon name="Heart" size={14} />
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell" inert={mobile || undefined}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              ref={menuButton}
              onClick={() => setMobile(!mobile)}
              aria-label="Abrir menu"
              aria-expanded={mobile}
              aria-controls="site-sidebar"
            >
              <Icon name="Menu" />
            </button>
            <span className="topbar-crumb">
              Workspace <Icon name="ChevronRight" size={13} />{" "}
              <b>
                {active?.short ||
                  active?.label ||
                  (location.pathname === "/favoritos"
                    ? "Favoritos"
                    : location.pathname === "/sobre"
                      ? "Sobre o projeto"
                      : location.pathname === "/busca"
                        ? "Pesquisa"
                        : "Visão geral")}
              </b>
            </span>
          </div>
          <div className="topbar-right">
            <form
              className="topbar-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/busca?q=${encodeURIComponent(query)}`);
              }}
            >
              <Icon name="Search" size={16} />
              <input
                aria-label="Pesquisa global"
                placeholder="Pesquisar em todos os recursos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>↵</kbd>
            </form>
            <Link
              className="icon-button mobile-search"
              to="/busca"
              aria-label="Pesquisar recursos"
            >
              <Icon name="Search" size={19} />
            </Link>
            <button
              className="icon-button"
              aria-label={`Ativar tema ${theme === "light" ? "escuro" : "claro"}`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Icon name={theme === "light" ? "Moon" : "Sun"} size={19} />
            </button>
            <Link
              className="topbar-heart icon-button"
              to="/favoritos"
              aria-label="Ver favoritos"
            >
              <Icon name="Heart" size={19} />
            </Link>
            <span
              className="community-avatar"
              title="Biblioteca aberta à comunidade"
            >
              <Icon name="Users" size={18} />
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="site-footer">
          <span>
            © {new Date().getFullYear()} DataViz Hub. Feito para transformar
            ideias em insights.
          </span>
          <Link to="/sobre">
            Código aberto · MIT <Icon name="ArrowUpRight" size={13} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
