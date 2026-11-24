import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../site/public");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Helper to generate valid PNG buffers
function createPng(width, height, getPixel) {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
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
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filter None
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

// 2. Favicon SVG
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="16" y1="13" x2="8" y2="13"/>
  <line x1="16" y1="17" x2="8" y2="17"/>
  <polyline points="10 9 9 9 8 9"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, "favicon.svg"), faviconSvg, "utf8");

// 3. Document Icon Pixel Generator
function generateAppIcon(size) {
  return createPng(size, size, (x, y) => {
    // Canvas background: #0f1012
    const bg = [15, 16, 18, 255];
    const teal = [20, 184, 166, 255];
    const tealBg = [18, 40, 38, 255];
    const white = [230, 232, 235, 255];
    const border = [36, 39, 46, 255];

    // Margin
    const m = Math.floor(size * 0.14);
    const w = size - 2 * m;
    const h = size - 2 * m;

    if (x >= m && x < m + w && y >= m && y < m + h) {
      // Inside card
      const cx = x - m;
      const cy = y - m;

      // 1px border
      if (cx === 0 || cx === w - 1 || cy === 0 || cy === h - 1) {
        return border;
      }

      // Folded corner on top right
      const fold = Math.floor(w * 0.35);
      if (cx >= w - fold && cy <= fold) {
        if (cx - (w - fold) > cy) {
          return bg; // cut-out corner
        }
        if (cx === w - fold || cy === fold || cx - (w - fold) === cy) {
          return teal; // fold border
        }
        return tealBg; // fold flap
      }

      // Horizontal lines (content representation)
      const lineY1 = Math.floor(h * 0.48);
      const lineY2 = Math.floor(h * 0.64);
      const lineY3 = Math.floor(h * 0.80);

      const lineStart = Math.floor(w * 0.22);
      const lineEnd1 = Math.floor(w * 0.78);
      const lineEnd2 = Math.floor(w * 0.65);
      const lineEnd3 = Math.floor(w * 0.50);

      const thickness = Math.max(1, Math.floor(size * 0.025));

      if (cy >= lineY1 && cy < lineY1 + thickness && cx >= lineStart && cx <= lineEnd1) return teal;
      if (cy >= lineY2 && cy < lineY2 + thickness && cx >= lineStart && cx <= lineEnd2) return white;
      if (cy >= lineY3 && cy < lineY3 + thickness && cx >= lineStart && cx <= lineEnd3) return white;

      return [22, 24, 27, 255]; // surface #16181b
    }

    return bg;
  });
}

// Write icons
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), generateAppIcon(180));
fs.writeFileSync(path.join(publicDir, "icon-192.png"), generateAppIcon(192));
fs.writeFileSync(path.join(publicDir, "icon-512.png"), generateAppIcon(512));

// 4. OG Image (1200 x 630) in site dark/teal theme
const ogImage = createPng(1200, 630, (x, y) => {
  // Base background #0f1012
  const bg = [15, 16, 18, 255];
  const cardBg = [22, 24, 27, 255];
  const border = [36, 39, 46, 255];
  const teal = [20, 184, 166, 255];
  const white = [230, 232, 235, 255];
  const muted = [107, 114, 128, 255];

  // Inner card bounds: 80 to 1120 (width 1040), 70 to 560 (height 490)
  if (x >= 80 && x < 1120 && y >= 70 && y < 560) {
    const cx = x - 80;
    const cy = y - 70;

    // Card border
    if (cx === 0 || cx === 1039 || cy === 0 || cy === 489) {
      return border;
    }

    // Top Teal Accent Bar (3px high)
    if (cy >= 1 && cy <= 4) {
      return teal;
    }

    // Document emblem on the left: x: 80..280, y: 120..380
    if (cx >= 80 && cx <= 260 && cy >= 140 && cy <= 360) {
      const ex = cx - 80;
      const ey = cy - 140;
      const ew = 180;
      const eh = 220;

      if (ex === 0 || ex === ew - 1 || ey === 0 || ey === eh - 1) return teal;
      const fold = 55;
      if (ex >= ew - fold && ey <= fold) {
        if (ex - (ew - fold) > ey) return cardBg;
        if (ex === ew - fold || ey === fold || ex - (ew - fold) === ey) return teal;
      }
      if (ey >= 90 && ey <= 96 && ex >= 30 && ex <= 150) return teal;
      if (ey >= 125 && ey <= 129 && ex >= 30 && ex <= 130) return white;
      if (ey >= 155 && ey <= 159 && ex >= 30 && ex <= 110) return white;
      return [31, 33, 38, 255];
    }

    // Graphical title bars and subtitle on right side: cx 320..950
    // Title bar line 1 (sdocx2obsidian text representation)
    if (cy >= 160 && cy <= 185 && cx >= 320 && cx <= 780) return teal;
    // Subtitle representation line
    if (cy >= 225 && cy <= 245 && cx >= 320 && cx <= 940) return white;
    if (cy >= 260 && cy <= 276 && cx >= 320 && cx <= 840) return muted;

    // Badge pill representation at bottom right
    if (cy >= 340 && cy <= 375 && cx >= 320 && cx <= 680) {
      if (cy === 340 || cy === 374 || cx === 320 || cx === 679) return teal;
      return [18, 40, 38, 255];
    }

    return cardBg;
  }

  return bg;
});
fs.writeFileSync(path.join(publicDir, "og-image.png"), ogImage);

// 5. site.webmanifest
const manifest = {
  name: "sdocx2obsidian",
  short_name: "sdocx2obsidian",
  description: "Convert Samsung Notes (.sdocx) to Obsidian Markdown vaults in your browser.",
  start_url: "/",
  display: "standalone",
  background_color: "#0f1012",
  theme_color: "#0f1012",
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
  JSON.stringify(manifest, null, 2),
  "utf8"
);

// 6. robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://sdocx2obsidian.pages.dev/sitemap.xml
`;
fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt, "utf8");

console.log("All branding assets generated successfully in site/public!");
