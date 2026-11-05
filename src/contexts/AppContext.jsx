import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createId } from "../utils/ids";
const Context = createContext();
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function validPalette(p) {
  return (
    p &&
    typeof p.id === "string" &&
    p.id.startsWith("custom-palette-") &&
    typeof p.name === "string" &&
    p.name.length <= 120 &&
    Array.isArray(p.colors) &&
    p.colors.length === 5 &&
    p.colors.every((c) => typeof c === "string" && /^#[\da-f]{6}$/i.test(c))
  );
}
function localPalette(p) {
  return {
    id: p.id,
    name: p.name,
    colors: [...p.colors],
    kind: "palettes",
    path: "/paletas",
    category: "Personalizada",
    description: "Sua combinação de cores criada no Color Palette Studio.",
    tags: ["Personalizada", "Power BI"],
    createdAt: "2026-11-04",
  };
}
export function AppProvider({ children }) {
  const [dashboardViews, setDashboardViews] = useState(() =>
    Object.fromEntries(
      Object.entries(read("dv-dashboard-views", {})).filter(
        ([id, count]) =>
          /^dashboard-\d+$/.test(id) &&
          Number.isSafeInteger(count) &&
          count > 0,
      ),
    ),
  );
  const recordDashboardView = useCallback((id) => {
    setDashboardViews((previous) => ({
      ...previous,
      [id]: (previous[id] ?? 0) + 1,
    }));
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        "dv-dashboard-views",
        JSON.stringify(dashboardViews),
      );
    } catch {
      // The ranking remains available until the page is closed.
    }
  }, [dashboardViews]);
  const [savedPalettes, setSavedPalettes] = useState(() => {
    const value = read("dv-palettes", []);
    return Array.isArray(value)
      ? value.filter(validPalette).slice(0, 100).map(localPalette)
      : [];
  });
  const [favorites, setFavorites] = useState(() => {
    const value = read("dv-favorites", []);
    return Array.isArray(value)
      ? value.filter((x) => typeof x === "string")
      : [];
  });
  const [theme, setTheme] = useState(() =>
    read("dv-theme", "light") === "dark" ? "dark" : "light",
  );
  const [notice, setNotice] = useState(null);
  const notify = useCallback(
    (message, error = false) => setNotice({ message, error, id: Date.now() }),
    [],
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("dv-theme", JSON.stringify(theme));
    } catch {
      notify("Seu navegador não permite salvar o tema.", true);
    }
  }, [theme, notify]);
  useEffect(() => {
    try {
      localStorage.setItem("dv-favorites", JSON.stringify(favorites));
    } catch {
      notify("Não foi possível persistir favoritos neste navegador.", true);
    }
  }, [favorites, notify]);
  useEffect(() => {
    try {
      localStorage.setItem("dv-palettes", JSON.stringify(savedPalettes));
    } catch {
      notify(
        "Não foi possível persistir suas paletas neste navegador. Exporte o JSON.",
        true,
      );
    }
  }, [savedPalettes, notify]);
  useEffect(() => {
    if (notice) {
      const id = setTimeout(() => setNotice(null), 5000);
      return () => clearTimeout(id);
    }
  }, [notice]);
  const toggleFavorite = (id) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  function savePalette(name, colors) {
    const existing = savedPalettes.find(
      (p) => JSON.stringify(p.colors) === JSON.stringify(colors),
    );
    if (!existing && savedPalettes.length >= 100) {
      notify(
        "Limite de 100 paletas locais atingido. Exporte suas cores em JSON.",
        true,
      );
      return;
    }
    const item =
      existing ||
      localPalette({
        id: `custom-palette-${createId()}`,
        name: `${name.slice(0, 95)} · Minha paleta`,
        colors,
      });
    if (!validPalette(item)) {
      notify("Não foi possível salvar essa combinação.", true);
      return;
    }
    if (!existing) setSavedPalettes((prev) => [...prev, item]);
    setFavorites((prev) =>
      prev.includes(item.id) ? prev : [...prev, item.id],
    );
    notify("Sua combinação foi salva nos favoritos.");
  }
  const run = async (fn, message = "Arquivo pronto para download.") => {
    try {
      await fn();
      if (message) notify(message);
    } catch (err) {
      console.error(err);
      notify(
        err.message || "Não foi possível concluir a ação. Tente novamente.",
        true,
      );
    }
  };
  return (
    <Context.Provider
      value={{
        favorites,
        toggleFavorite,
        theme,
        setTheme,
        notify,
        run,
        savedPalettes,
        savePalette,
        dashboardViews,
        recordDashboardView,
      }}
    >
      {children}
      {notice && (
        <div
          role={notice.error ? "alert" : "status"}
          className={`toast ${notice.error ? "error" : ""}`}
        >
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} aria-label="Fechar mensagem">
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
