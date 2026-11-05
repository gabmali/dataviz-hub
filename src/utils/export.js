import { toPng } from "html-to-image";
export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export const downloadText = (text, name, type = "application/json") =>
  downloadBlob(new Blob([text], { type }), name);
export const downloadJSON = (data, name) =>
  downloadText(JSON.stringify(data, null, 2), name);
export async function copy(text) {
  if (!navigator.clipboard)
    throw new Error("A cópia requer localhost ou uma conexão HTTPS.");
  await navigator.clipboard.writeText(text);
}
export async function exportElement(node, name, width = 1600, height) {
  if (!node) throw new Error("A prévia ainda não está disponível.");
  await document.fonts.ready;
  const url = await toPng(node, {
    cacheBust: true,
    pixelRatio: 1,
    canvasWidth: width,
    canvasHeight:
      height || Math.round((width * node.offsetHeight) / node.offsetWidth),
    backgroundColor: node.dataset.background || "#F3F6FA",
    width: node.offsetWidth,
    height: node.offsetHeight,
    style: { transform: "none", transformOrigin: "top left" },
    filter: (el) => !el.classList?.contains("no-export"),
  });
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}
export function svgToPng(svg, width, height, name) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
    );
    image.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        const ctx = c.getContext("2d");
        ctx.drawImage(image, 0, 0, width, height);
        c.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("Exportação PNG indisponível."));
            return;
          }
          downloadBlob(blob, name);
          resolve();
        }, "image/png");
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível gerar o PNG."));
    };
    image.src = url;
  });
}
export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
}
export function contrastText(hex) {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.179 ? "#000000" : "#FFFFFF";
}
export function powerBITheme(name, colors) {
  if (!colors.length || colors.some((c) => !/^#[0-9a-f]{6}$/i.test(c)))
    throw new Error("Use cores HEX válidas.");
  return {
    name,
    dataColors: colors,
    background: "#FFFFFF",
    foreground: "#102A43",
    tableAccent: colors[1] || colors[0],
  };
}
export function backgroundSvg(item, width = 1600, height = 900) {
  const [base, card, accent] = item.colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1600 900"><defs><linearGradient id="g"><stop stop-color="${base}"/><stop offset="1" stop-color="${card}"/></linearGradient></defs><rect width="1600" height="900" fill="${item.variant === 2 ? "url(#g)" : item.category === "Claro" ? "#F3F6FA" : base}"/><rect x="0" y="0" width="${item.variant === 1 ? 100 : 1600}" height="${item.variant === 1 ? 900 : 100}" fill="${card}" opacity=".6"/><circle cx="1550" cy="30" r="240" fill="${accent}" opacity=".09"/><path d="M0 900L1600 200V900Z" fill="${accent}" opacity="${item.variant === 3 ? 0.15 : 0.04}"/><g fill="${item.category === "Claro" ? "#FFFFFF" : card}" stroke="${accent}" stroke-opacity=".18">${[0, 1, 2, 3].map((i) => `<rect x="${140 + i * 350}" y="140" width="320" height="145" rx="18"/>`).join("")}<rect x="140" y="320" width="860" height="520" rx="18"/><rect x="1030" y="320" width="480" height="520" rx="18"/></g><rect x="140" y="60" width="180" height="8" rx="4" fill="${accent}"/></svg>`;
}
