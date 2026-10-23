/**
 * Genera las ilustraciones SVG de los productos de ejemplo (seed) en
 * public/products/. Son imágenes propias con la paleta de E-Positive, para
 * que el catálogo de demo no dependa de URLs externas.
 *
 * Uso: node scripts/generate-product-images.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const AMBER = "#f5a524";
const NIGHT = "#171c26";
const NIGHT2 = "#252c38";
const OUT = join(process.cwd(), "public", "products");

/** Lienzo común: fondo cálido, sombra de piso y etiqueta de especificación. */
const canvas = (badge, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8f6f2"/><stop offset="1" stop-color="#ebe5db"/></linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9d0d9"/><stop offset=".5" stop-color="#f2f5f8"/><stop offset="1" stop-color="#b6bfcb"/></linearGradient>
    <linearGradient id="cell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#24427a"/><stop offset="1" stop-color="#0f2142"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3d6fb8"/><stop offset="1" stop-color="#1b3768"/></linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <ellipse cx="400" cy="700" rx="260" ry="26" fill="#000" opacity=".08"/>
  ${inner}
  <g font-family="Segoe UI, Arial, sans-serif" font-weight="700">
    <rect x="40" y="40" width="${badge.length * 17 + 40}" height="52" rx="26" fill="${AMBER}"/>
    <text x="60" y="75" font-size="28" fill="${NIGHT}">${badge}</text>
  </g>
</svg>`;

const bolt = (cx, cy, s = 1, fill = AMBER) =>
  `<path transform="translate(${cx} ${cy}) scale(${s})" d="M8 -46 L-30 8 h26 l-10 40 l44 -56 h-27 z" fill="${fill}"/>`;

/** Conector de carga visto de frente (Tipo 1, Tipo 2, CCS2 o GB/T). */
function connectorFace(cx, cy, r, type) {
  const pin = (x, y, pr = r * 0.13) => `<circle cx="${cx + x * r}" cy="${cy + y * r}" r="${pr}" fill="${NIGHT}"/>`;
  let shell = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e7ebf0" stroke="${NIGHT}" stroke-width="${r * 0.12}"/>`;
  if (type === "TYPE2") {
    // Tipo 2: círculo con la parte superior recortada
    shell = `<path d="M${cx - r * 0.8} ${cy - r * 0.6} H${cx + r * 0.8} A${r} ${r} 0 1 1 ${cx - r * 0.8} ${cy - r * 0.6} Z" fill="#e7ebf0" stroke="${NIGHT}" stroke-width="${r * 0.12}"/>`;
    return shell + pin(-0.32, -0.25, r * 0.08) + pin(0.32, -0.25, r * 0.08) + pin(-0.5, 0.1) + pin(0, 0.1) + pin(0.5, 0.1) + pin(-0.27, 0.5) + pin(0.27, 0.5);
  }
  if (type === "TYPE1") return shell + pin(-0.45, -0.2) + pin(0.45, -0.2) + pin(0, 0.45) + pin(-0.25, -0.62, r * 0.07) + pin(0.25, -0.62, r * 0.07);
  if (type === "GBT") return shell + pin(-0.4, -0.15, r * 0.18) + pin(0.4, -0.15, r * 0.18) + pin(-0.4, 0.45, r * 0.08) + pin(0, 0.45, r * 0.08) + pin(0.4, 0.45, r * 0.08) + pin(0, -0.6, r * 0.08);
  // CCS2: Tipo 2 arriba + dos pines DC grandes abajo
  return (
    connectorFace(cx, cy - r * 0.35, r * 0.62, "TYPE2") +
    `<rect x="${cx - r * 0.8}" y="${cy + r * 0.35}" width="${r * 1.6}" height="${r * 0.7}" rx="${r * 0.35}" fill="#e7ebf0" stroke="${NIGHT}" stroke-width="${r * 0.08}"/>` +
    pin(-0.4, 0.7, r * 0.18) + pin(0.4, 0.7, r * 0.18)
  );
}

/** Pistola de carga vista de lado, con cable saliendo del mango. */
function plug(x, y, rot, body = NIGHT2) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="-26" y="-10" width="52" height="130" rx="22" fill="${body}"/>
    <rect x="-46" y="-96" width="92" height="96" rx="30" fill="${body}"/>
    <rect x="-36" y="-112" width="72" height="26" rx="10" fill="#9aa4b2"/>
    <rect x="-12" y="20" width="24" height="60" rx="10" fill="${AMBER}" opacity=".9"/>
  </g>`;
}

const cable = (d, w = 18) => `<path d="${d}" fill="none" stroke="${NIGHT}" stroke-width="${w}" stroke-linecap="round"/>`;

/** Wallbox (cargador de pared). */
const wallbox = (dark, label) => `
  <rect x="245" y="130" width="310" height="420" rx="44" fill="${dark ? NIGHT2 : "#fdfdfd"}" stroke="${dark ? NIGHT : "#d3d8e0"}" stroke-width="5"/>
  <rect x="280" y="170" width="240" height="270" rx="26" fill="${dark ? NIGHT : NIGHT}"/>
  <circle cx="400" cy="285" r="66" fill="none" stroke="${AMBER}" stroke-width="11"/>
  ${bolt(400, 285, 1)}
  <text x="400" y="405" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="600" fill="#cbd5e1" text-anchor="middle">${label}</text>
  ${dark ? `<rect x="245" y="470" width="310" height="14" fill="${AMBER}"/>` : ""}
  ${cable("M400 550 C 400 660, 560 670, 600 590 S 640 470 610 430")}
  ${plug(610, 430, 20)}`;

/** Panel solar sobre soporte. */
const solarPanel = (bifacial) => {
  let cells = "";
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 4; c++)
      cells += `<rect x="${222 + c * 92}" y="${132 + r * 66}" width="86" height="60" fill="url(#${bifacial ? "glass" : "cell"})"/>`;
  return `
  <rect x="380" y="540" width="40" height="150" fill="#9aa4b2"/>
  <rect x="300" y="672" width="200" height="22" rx="6" fill="#7b8594"/>
  <rect x="210" y="120" width="380" height="420" rx="10" fill="url(#metal)" stroke="#8d97a6" stroke-width="4"/>
  ${cells}
  <path d="M222 132 L390 132 L222 300 Z" fill="#fff" opacity=".12"/>
  ${bifacial ? `<path d="M600 610 l60 -60 M660 550 h-34 M660 550 v34" stroke="${AMBER}" stroke-width="10" stroke-linecap="round" fill="none"/>` : ""}
  <circle cx="660" cy="160" r="46" fill="${AMBER}"/>
  ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="656" y="84" width="8" height="22" rx="4" fill="${AMBER}" transform="rotate(${a} 660 160)"/>`).join("")}`;
};

const images = {
  "wallbox-tipo-2-7-4kw": canvas("7.4 kW · Tipo 2", wallbox(false, "7.4 kW")),
  "wallbox-trifasico-22kw": canvas("22 kW · Trifásico", wallbox(true, "22 kW")),

  "cargador-portatil-tipo-1": canvas("3.5 kW · Tipo 1", `
    ${cable("M140 560 C 140 430, 260 420, 300 400")}
    <rect x="110" y="560" width="60" height="90" rx="10" fill="#e7ebf0" stroke="${NIGHT}" stroke-width="6"/>
    <rect x="124" y="530" width="10" height="40" fill="#9aa4b2"/><rect x="146" y="530" width="10" height="40" fill="#9aa4b2"/>
    <rect x="290" y="300" width="220" height="200" rx="34" fill="${NIGHT2}"/>
    <rect x="320" y="330" width="160" height="80" rx="10" fill="#0b2a1f"/>
    <text x="400" y="384" font-family="Consolas, monospace" font-size="38" font-weight="700" fill="#4ade80" text-anchor="middle">16A</text>
    <circle cx="350" cy="455" r="14" fill="${AMBER}"/><circle cx="400" cy="455" r="14" fill="#9aa4b2"/><circle cx="450" cy="455" r="14" fill="#9aa4b2"/>
    ${cable("M510 400 C 600 400, 640 520, 600 600")}
    ${connectorFace(600, 600, 70, "TYPE1")}`),

  "adaptador-tipo-1-a-tipo-2": canvas("Tipo 1 → Tipo 2", `
    <rect x="250" y="290" width="300" height="220" rx="50" fill="${NIGHT2}"/>
    <rect x="250" y="380" width="300" height="40" fill="${AMBER}"/>
    ${connectorFace(240, 400, 110, "TYPE1")}
    ${connectorFace(560, 400, 110, "TYPE2")}
    <text x="240" y="580" font-family="Segoe UI, Arial" font-size="30" font-weight="700" fill="${NIGHT}" text-anchor="middle">TIPO 1</text>
    <text x="560" y="580" font-family="Segoe UI, Arial" font-size="30" font-weight="700" fill="${NIGHT}" text-anchor="middle">TIPO 2</text>`),

  "adaptador-ccs2-a-gbt": canvas("DC · CCS2 → GB/T", `
    <rect x="240" y="270" width="320" height="260" rx="50" fill="${NIGHT2}"/>
    <rect x="240" y="380" width="320" height="40" fill="${AMBER}"/>
    ${connectorFace(230, 400, 125, "CCS2")}
    ${connectorFace(570, 400, 115, "GBT")}
    <text x="230" y="600" font-family="Segoe UI, Arial" font-size="30" font-weight="700" fill="${NIGHT}" text-anchor="middle">CCS2</text>
    <text x="570" y="600" font-family="Segoe UI, Arial" font-size="30" font-weight="700" fill="${NIGHT}" text-anchor="middle">GB/T</text>`),

  "cable-tipo-2-a-tipo-2-5m": canvas("22 kW · 5 m", `
    ${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="400" cy="${420 + i * 14}" rx="${190 - i * 6}" ry="${120 - i * 4}" fill="none" stroke="${NIGHT}" stroke-width="20"/>`).join("")}
    ${cable("M220 440 C 160 380, 160 300, 200 260")}
    ${cable("M580 460 C 650 420, 660 330, 610 270")}
    ${plug(200, 260, -15)}
    ${plug(610, 270, 15)}`),

  "soporte-pared-conector": canvas("Soporte de pared", `
    <rect x="270" y="150" width="260" height="420" rx="30" fill="url(#metal)" stroke="#8d97a6" stroke-width="4"/>
    <circle cx="310" cy="190" r="10" fill="#7b8594"/><circle cx="490" cy="190" r="10" fill="#7b8594"/>
    <circle cx="310" cy="530" r="10" fill="#7b8594"/><circle cx="490" cy="530" r="10" fill="#7b8594"/>
    <rect x="330" y="230" width="140" height="140" rx="70" fill="${NIGHT}"/>
    ${plug(400, 470, 180)}
    ${cable("M400 340 C 400 260, 560 250, 620 330 S 640 560 520 640")}`),

  "panel-solar-monocristalino-550w": canvas("550 W · Mono", solarPanel(false)),
  "panel-solar-bifacial-600w": canvas("600 W · Bifacial", solarPanel(true)),

  "inversor-hibrido-5kw": canvas("5 kW · Híbrido", `
    <rect x="230" y="120" width="340" height="480" rx="30" fill="#fdfdfd" stroke="#d3d8e0" stroke-width="5"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="570" y="${160 + i * 70}" width="22" height="46" rx="6" fill="#c3cad4"/>`).join("")}
    <rect x="270" y="170" width="260" height="150" rx="14" fill="${NIGHT}"/>
    <text x="300" y="232" font-family="Consolas, monospace" font-size="34" font-weight="700" fill="${AMBER}">5.0 kW</text>
    <text x="300" y="282" font-family="Consolas, monospace" font-size="24" fill="#94a3b8">PV ▸ BAT ▸ AC</text>
    ${bolt(400, 430, 1.2)}
    <circle cx="300" cy="540" r="11" fill="#22c55e"/><circle cx="340" cy="540" r="11" fill="${AMBER}"/><circle cx="380" cy="540" r="11" fill="#cbd5e1"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${290 + i * 60}" y="600" width="34" height="40" rx="6" fill="${NIGHT2}"/>`).join("")}`),

  "controlador-mppt-60a": canvas("MPPT · 60 A", `
    <rect x="220" y="200" width="360" height="360" rx="30" fill="${NIGHT2}"/>
    <rect x="220" y="200" width="360" height="40" rx="20" fill="${AMBER}"/>
    <rect x="270" y="270" width="260" height="120" rx="12" fill="#0b2a1f"/>
    <text x="400" y="345" font-family="Consolas, monospace" font-size="44" font-weight="700" fill="#4ade80" text-anchor="middle">48V 60A</text>
    <circle cx="300" cy="430" r="14" fill="#cbd5e1"/><circle cx="350" cy="430" r="14" fill="#cbd5e1"/>
    ${["#ef4444", NIGHT, "#ef4444", NIGHT, "#ef4444", NIGHT].map((c, i) => `<rect x="${250 + i * 52}" y="480" width="40" height="50" rx="8" fill="${c}"/><circle cx="${270 + i * 52}" cy="505" r="9" fill="#cbd5e1"/>`).join("")}
    <text x="290" y="600" font-family="Segoe UI, Arial" font-size="22" font-weight="600" fill="${NIGHT}" text-anchor="middle">PV</text>
    <text x="400" y="600" font-family="Segoe UI, Arial" font-size="22" font-weight="600" fill="${NIGHT}" text-anchor="middle">BAT</text>
    <text x="510" y="600" font-family="Segoe UI, Arial" font-size="22" font-weight="600" fill="${NIGHT}" text-anchor="middle">LOAD</text>`),

  "bateria-lifepo4-48v-100ah": canvas("48 V · 5.12 kWh", `
    <rect x="200" y="200" width="400" height="420" rx="26" fill="#fdfdfd" stroke="#d3d8e0" stroke-width="5"/>
    <rect x="170" y="230" width="34" height="90" rx="10" fill="#9aa4b2"/><rect x="596" y="230" width="34" height="90" rx="10" fill="#9aa4b2"/>
    <rect x="200" y="200" width="400" height="80" rx="26" fill="${NIGHT}"/>
    <rect x="200" y="250" width="400" height="30" fill="${NIGHT}"/>
    <text x="400" y="252" font-family="Segoe UI, Arial" font-size="32" font-weight="800" fill="#fff" text-anchor="middle" letter-spacing="3">LiFePO4</text>
    <rect x="250" y="330" width="300" height="130" rx="16" fill="none" stroke="${NIGHT}" stroke-width="10"/>
    <rect x="550" y="370" width="16" height="50" rx="4" fill="${NIGHT}"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${268 + i * 68}" y="348" width="56" height="94" rx="6" fill="${AMBER}"/>`).join("")}
    <text x="400" y="530" font-family="Segoe UI, Arial" font-size="40" font-weight="800" fill="${NIGHT}" text-anchor="middle">48V 100Ah</text>
    <rect x="200" y="565" width="400" height="14" fill="${AMBER}"/>`),
};

mkdirSync(OUT, { recursive: true });
for (const [name, svg] of Object.entries(images)) {
  writeFileSync(join(OUT, `${name}.svg`), svg);
}
console.log(`✔ ${Object.keys(images).length} imágenes en public/products/`);
