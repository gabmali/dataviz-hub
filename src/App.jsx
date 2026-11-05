import { Component, lazy, Suspense } from "react";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import { sections } from "./data/catalog";
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const Builder = lazy(() => import("./pages/Builder"));
const About = lazy(() => import("./pages/About"));
class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="page empty" role="alert">
        <h1>Não foi possível abrir esta página.</h1>
        <p>Atualize o navegador para tentar novamente.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Recarregar
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        {sections
          .filter((s) => s.key !== "builder")
          .map((s) => (
            <Route
              path={s.path}
              element={<CatalogPage key={s.key} kind={s.key} />}
              key={s.key}
            />
          ))}
        <Route path="/builder" element={<Builder />} />
        <Route
          path="/favoritos"
          element={<CatalogPage key="favorites" favoritesPage />}
        />
        <Route
          path="/busca"
          element={<CatalogPage key="search" searchPage />}
        />
        <Route path="/sobre" element={<About />} />
        <Route
          path="*"
          element={
            <div className="page empty">
              <span className="eyebrow">ERRO 404</span>
              <h1>Essa página saiu do radar.</h1>
              <p>Mas sua próxima descoberta está logo ali.</p>
              <Link to="/" className="button primary">
                Voltar ao início
              </Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
export default function App() {
  const Router =
    import.meta.env.VITE_ROUTER_MODE === "hash" ? HashRouter : BrowserRouter;
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router
          basename={
            import.meta.env.VITE_ROUTER_MODE === "hash"
              ? undefined
              : import.meta.env.BASE_URL
          }
        >
          <Suspense
            fallback={
              <div className="page loading" role="status">
                <div className="spinner" />
                Carregando recursos…
              </div>
            }
          >
            <AppRoutes />
          </Suspense>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}
