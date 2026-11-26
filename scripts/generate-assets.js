import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../site/public");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Helper to generate valid RGBA PNG buffers
function createPng(width, height, getPixel) {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
    }
    return (c ^ 0xffffffff) >>> 0;
  }
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", idat),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

// Geometry helpers for anti-aliased rendering (in 32x32 normalized coordinate space)
function sdRoundedBox(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r;
  const qy = Math.abs(py - cy) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const lenSq = vx * vx + vy * vy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / lenSq));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

function blend(bg, fg, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  return [
    bg[0] + (fg[0] - bg[0]) * a,
    bg[1] + (fg[1] - bg[1]) * a,
    bg[2] + (fg[2] - bg[2]) * a,
  ];
}

// Emblem polygons in 32x32 design space: folded Samsung Note sheet + faceted Obsidian crystal
const NOTE_OUTLINE = [
  [7.5, 6.0],
  [18.8, 6.0],
  [24.5, 11.7],
  [24.5, 25.5],
  [7.5, 25.5],
];
const NOTE_FOLD_FLAP = [
  [18.8, 6.0],
  [24.5, 11.7],
  [18.8, 11.7],
];
const CRYSTAL_LEFT = [
  [15.4, 12.1],
  [10.9, 16.9],
  [12.9, 23.0],
  [15.4, 23.8],
];
const CRYSTAL_RIGHT = [
  [15.4, 12.1],
  [20.1, 16.6],
  [18.1, 23.0],
  [15.4, 23.8],
];
const CRYSTAL_TOP = [
  [15.4, 12.1],
  [10.9, 16.9],
  [15.4, 18.2],
  [20.1, 16.6],
];

function sampleEmblem(u, v, outerBg = [13, 17, 23]) {
  let col = outerBg;

  // Outer tile gradient (#1c2331 -> #10151e) with border (#30394a)
  const tileD = sdRoundedBox(u, v, 16, 16, 15, 15, 7);
  if (tileD <= 0) {
    const t = Math.max(0, Math.min(1, (u + v) / 64));
    col = [28 - t * 12, 35 - t * 14, 49 - t * 19];
    if (tileD > -1.05) {
      col = [48, 57, 74];
    }
  } else {
    return [col[0], col[1], col[2], 255];
  }

  // Folded Note Sheet (#18202c fill with #58a6ff border)
  if (pointInPoly(u, v, NOTE_OUTLINE)) {
    col = [24, 32, 44];
    if (pointInPoly(u, v, NOTE_FOLD_FLAP)) {
      col = [42, 74, 118];
    }
  }

  // Note outline stroke (#58a6ff)
  const noteEdges = [
    [7.5, 6.0, 18.8, 6.0],
    [18.8, 6.0, 24.5, 11.7],
    [24.5, 11.7, 24.5, 25.5],
    [24.5, 25.5, 7.5, 25.5],
    [7.5, 25.5, 7.5, 6.0],
    [18.8, 6.0, 18.8, 11.7],
    [18.8, 11.7, 24.5, 11.7],
  ];
  let minNoteEdge = 99;
  for (const [ax, ay, bx, by] of noteEdges) {
    minNoteEdge = Math.min(minNoteEdge, distToSegment(u, v, ax, ay, bx, by));
  }
  if (minNoteEdge < 0.72) {
    col = blend(col, [88, 166, 255], 0.95);
  }

  // Faceted Obsidian Crystal (#a882ff / #7c3aed / #c4b5fd)
  const inLeft = pointInPoly(u, v, CRYSTAL_LEFT);
  const inRight = pointInPoly(u, v, CRYSTAL_RIGHT);
  const inTop = pointInPoly(u, v, CRYSTAL_TOP);
  if (inLeft) col = [168, 130, 255]; // #a882ff
  if (inRight) col = [124, 58, 237]; // #7c3aed
  if (inTop) col = [196, 181, 253]; // #c4b5fd

  // Crisp crystal ridge highlight clipped strictly inside crystal bounds
  if (inLeft || inRight || inTop) {
    const ridgeD = Math.min(
      distToSegment(u, v, 15.4, 12.1, 15.4, 18.2),
      distToSegment(u, v, 10.9, 16.9, 15.4, 18.2),
      distToSegment(u, v, 15.4, 18.2, 20.1, 16.6)
    );
    if (ridgeD < 0.25) {
      col = blend(col, [245, 243, 255], 0.28);
    }
  }

  return [col[0], col[1], col[2], 255];
}

// 2. Favicon SVG (matches exact emblem geometry)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="bg" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1c2331"/>
      <stop offset="100%" stop-color="#10151e"/>
    </linearGradient>
    <linearGradient id="crystalLeft" x1="11" y1="12" x2="15.5" y2="24" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#b794ff"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="crystalRight" x1="15.4" y1="12" x2="20" y2="24" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#5b21b6"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="30" height="30" rx="7" fill="url(#bg)" stroke="#30394a" stroke-width="1"/>
  <path d="M8.5 6H18.8L24.5 11.7V24.5C24.5 25.05 24.05 25.5 23.5 25.5H8.5C7.95 25.5 7.5 25.05 7.5 24.5V7C7.5 6.45 7.95 6 8.5 6Z" fill="#18202c" stroke="#58a6ff" stroke-width="1.35" stroke-linejoin="round"/>
  <path d="M18.8 6V11.7H24.5L18.8 6Z" fill="#58a6ff" fill-opacity="0.28" stroke="#58a6ff" stroke-width="1.2" stroke-linejoin="round"/>
  <polygon points="15.4,12.1 10.9,16.9 12.9,23 15.4,23.8" fill="url(#crystalLeft)"/>
  <polygon points="15.4,12.1 20.1,16.6 18.1,23 15.4,23.8" fill="url(#crystalRight)"/>
  <polygon points="15.4,12.1 10.9,16.9 15.4,18.2 20.1,16.6" fill="#c4b5fd"/>
  <path d="M15.4 12.1V18.2M10.9 16.9L15.4 18.2L20.1 16.6" stroke="#f5f3ff" stroke-opacity="0.45" stroke-width="0.6" stroke-linejoin="round"/>
</svg>
`;
fs.writeFileSync(path.join(publicDir, "favicon.svg"), faviconSvg, "utf8");

// 3. Anti-aliased PNG App Icons (4x4 supersampled)
function generateAppIcon(size) {
  const ss = 4;
  return createPng(size, size, (x, y) => {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let sy = 0; sy < ss; sy++) {
      for (let sx = 0; sx < ss; sx++) {
        const u = ((x + (sx + 0.5) / ss) / size) * 32;
        const v = ((y + (sy + 0.5) / ss) / size) * 32;
        const [sr, sg, sb] = sampleEmblem(u, v);
        r += sr;
        g += sg;
        b += sb;
      }
    }
    const samples = ss * ss;
    return [Math.round(r / samples), Math.round(g / samples), Math.round(b / samples), 255];
  });
}

fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), generateAppIcon(180));
fs.writeFileSync(path.join(publicDir, "icon-192.png"), generateAppIcon(192));
fs.writeFileSync(path.join(publicDir, "icon-512.png"), generateAppIcon(512));

// 4. OG Image (1200 x 630) in dark #0d1117 / #191e26 / #58a6ff + Obsidian purple #a882ff
const ogImage = createPng(1200, 630, (x, y) => {
  const bg = [13, 17, 23, 255];
  const cardBg = [25, 30, 38, 255];
  const border = [48, 57, 74, 255];
  const blue = [88, 166, 255, 255];
  const purple = [168, 130, 255, 255];
  const white = [240, 244, 248, 255];
  const muted = [139, 148, 158, 255];

  // Subtle dot-grid background outside card
  const inCard = x >= 80 && x < 1120 && y >= 70 && y < 560;
  if (!inCard) {
    if (x % 24 >= 0 && x % 24 <= 1 && y % 24 >= 0 && y % 24 <= 1) {
      return [34, 41, 54, 255];
    }
    return bg;
  }

  const cx = x - 80;
  const cy = y - 70;

  if (cx === 0 || cx === 1039 || cy === 0 || cy === 489) {
    return border;
  }
  if (cy >= 1 && cy <= 4) {
    return cx < 520 ? blue : purple;
  }

  // Emblem on left: 224x224 centered at (cx=190, cy=245) -> cx: 78..302, cy: 133..357
  if (cx >= 78 && cx < 302 && cy >= 133 && cy < 357) {
    const u = ((cx - 78) / 224) * 32;
    const v = ((cy - 133) / 224) * 32;
    return sampleEmblem(u, v, cardBg);
  }

  // Graphical layout bars on right side representing heading, Obsidian purple accent, subtitle, and badge
  if (cy >= 158 && cy <= 184 && cx >= 348 && cx <= 690) return white;
  if (cy >= 158 && cy <= 184 && cx >= 708 && cx <= 875) return purple;
  if (cy >= 224 && cy <= 242 && cx >= 348 && cx <= 935) return muted;
  if (cy >= 258 && cy <= 274 && cx >= 348 && cx <= 810) return muted;

  // Pill badge at bottom right
  if (cy >= 334 && cy <= 372 && cx >= 348 && cx <= 690) {
    if (cy === 334 || cy === 371 || cx === 348 || cx === 689) return blue;
    return [24, 42, 68, 255];
  }

  return cardBg;
});
fs.writeFileSync(path.join(publicDir, "og-image.png"), ogImage);

// 5. site.webmanifest
const manifest = {
  name: "sdocx2obsidian",
  short_name: "sdocx2obsidian",
  description: "Convert Samsung Notes (.sdocx) to Obsidian Markdown vaults in your browser.",
  start_url: "/",
  display: "standalone",
  background_color: "#0d1117",
  theme_color: "#0d1117",
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/favicon.svg",
      sizes: "any",
      type: "image/svg+xml",
    },
  ],
};
fs.writeFileSync(
  path.join(publicDir, "site.webmanifest"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8"
);

// 6. robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://sdocx2obsidian.abhay-gugale153.workers.dev/sitemap.xml
`;
fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt, "utf8");

console.log("All branding assets generated successfully in site/public!");
