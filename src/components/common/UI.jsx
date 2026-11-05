import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { iconRegistry as L } from "./iconRegistry";
import { useApp } from "../../contexts/AppContext";
export function Icon({ name, size = 20, ...props }) {
  const Component = L[name] || L.Square;
  return <Component size={size} strokeWidth={1.7} {...props} />;
}
export function Favorite({ item }) {
  const { favorites, toggleFavorite } = useApp();
  const active = favorites.includes(item.id);
  return (
    <button
      className={`icon-button favorite ${active ? "active" : ""}`}
      aria-label={`${active ? "Remover dos" : "Adicionar aos"} favoritos: ${item.name}`}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(item.id);
      }}
    >
      <Icon name="Heart" size={17} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
export function Empty({
  title = "Nenhum recurso encontrado",
  detail = "Experimente outro termo ou limpe os filtros.",
  children,
}) {
  return (
    <div className="empty">
      <Icon name="SearchX" size={40} />
      <h3>{title}</h3>
      <p>{detail}</p>
      {children}
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const bodyOverflow = document.body.style.overflow;
    const app = document.querySelector(".app-shell");
    const wasInert = app?.inert;
    if (app) app.inert = true;
    document.body.style.overflow = "hidden";
    ref.current.focus();
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = [
          ...ref.current.querySelectorAll(
            'button,input,select,a[href],textarea,[tabindex="0"]',
          ),
        ].filter(
          (el) =>
            el.tabIndex >= 0 &&
            !el.matches(":disabled") &&
            el.getClientRects().length > 0 &&
            getComputedStyle(el).visibility !== "hidden",
        );
        const first = els[0],
          last = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = bodyOverflow;
      if (app) app.inert = wasInert;
      document.removeEventListener("keydown", handler);
      prev?.focus();
    };
  }, [onClose]);
  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <header>
          <div>
            <span className="eyebrow">DATAVIZ HUB · PRÉVIA</span>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Fechar prévia"
            onClick={onClose}
          >
            <Icon name="X" />
          </button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}
export function SectionTitle({ eyebrow, title, description, children }) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
