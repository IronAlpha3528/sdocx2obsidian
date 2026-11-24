import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(__dirname, "../site");
const distDir = path.resolve(siteDir, "dist");
const ssrOutDir = path.resolve(siteDir, "dist-ssr");

const SITE_URL = process.env.SITE_URL || "https://sdocx2obsidian.workers.dev";

const ROUTES = [
  {
    path: "/",
    title: "sdocx2obsidian — Convert Samsung Notes to Obsidian Markdown",
    description:
      "Convert Samsung Notes (.sdocx) into clean Obsidian Markdown vaults in your browser. Preserves reading order, photos, and voice memos using local WebAssembly.",
    changefreq: "weekly",
    priority: "1.0",
    includeInSitemap: true,
  },
  {
    path: "/features",
    title: "Features & Architecture — sdocx2obsidian",
    description:
      "In-browser WebAssembly execution, document reading order preservation, native Obsidian Wikilinks, and clean vault directory structure.",
    changefreq: "monthly",
    priority: "0.8",
    includeInSitemap: true,
  },
  {
    path: "/how-it-works",
    title: "How It Works — sdocx2obsidian",
    description:
      "Step-by-step workflow for exporting Samsung Notes (.sdocx) on Galaxy devices and converting them locally into Obsidian-compatible vaults.",
    changefreq: "monthly",
    priority: "0.8",
    includeInSitemap: true,
  },
  {
    path: "/preview",
    title: "Vault Preview & Syntax — sdocx2obsidian",
    description:
      "Inspect converted Obsidian Markdown notes, Wikilink media embeds, and the generated vault directory structure.",
    changefreq: "monthly",
    priority: "0.8",
    includeInSitemap: true,
  },
  {
    path: "/limitations",
    title: "Supported Features & Limitations — sdocx2obsidian",
    description:
      "Support matrix for typed text, attachments, voice memos, S-Pen handwriting ink strokes, and proprietary Samsung formats.",
    changefreq: "monthly",
    priority: "0.8",
    includeInSitemap: true,
  },
  {
    path: "/faq",
    title: "Frequently Asked Questions — sdocx2obsidian",
    description:
      "Export guide from Samsung Notes, vault organization, browser memory limits, and troubleshooting for sdocx2obsidian.",
    changefreq: "monthly",
    priority: "0.7",
    includeInSitemap: true,
  },
  {
    path: "/privacy",
    title: "Privacy Policy — sdocx2obsidian",
    description:
      "Privacy guarantees of sdocx2obsidian: 100% in-browser processing via WebAssembly, zero file uploads, local assets, and sanitized error reporting.",
    changefreq: "monthly",
    priority: "0.5",
    includeInSitemap: true,
  },
  {
    path: "/about",
    title: "About — sdocx2obsidian",
    description:
      "About sdocx2obsidian: open-source developer utility, version details, MIT license, GitHub links, and independent project disclaimer.",
    changefreq: "monthly",
    priority: "0.6",
    includeInSitemap: true,
  },
  {
    path: "/404",
    title: "404 Not Found — sdocx2obsidian",
    description: "The requested page could not be found.",
    includeInSitemap: false,
  },
];

async function main() {
  console.log("==> Building SSR entry for static prerendering...");
  execSync(`npx vite build --ssr src/entry-server.tsx --outDir dist-ssr`, {
    cwd: siteDir,
    stdio: "inherit",
  });

  // Vite may output entry-server.mjs or entry-server.js depending on OS, Rollup, and ESM resolution
  const candidatePaths = [
    path.resolve(ssrOutDir, "entry-server.mjs"),
    path.resolve(ssrOutDir, "entry-server.js"),
  ];
  let entryServerPath = candidatePaths.find((p) => fs.existsSync(p));
  if (!entryServerPath && fs.existsSync(ssrOutDir)) {
    const files = fs.readdirSync(ssrOutDir);
    const match = files.find(
      (f) => f.startsWith("entry-server.") && (f.endsWith(".js") || f.endsWith(".mjs"))
    );
    if (match) {
      entryServerPath = path.resolve(ssrOutDir, match);
    }
  }

  if (!entryServerPath) {
    const existing = fs.existsSync(ssrOutDir) ? fs.readdirSync(ssrOutDir) : [];
    throw new Error(
      `SSR entry bundle not found in ${ssrOutDir}. Directory contents: ${JSON.stringify(existing)}`
    );
  }

  console.log(`==> Loading SSR entry bundle from ${entryServerPath}...`);
  const { render } = await import(pathToFileURL(entryServerPath).href);

  const templatePath = path.resolve(distDir, "index.html");
  if (!fs.existsSync(templatePath)) {
    throw new Error("Client dist/index.html not found. Run client build first.");
  }
  const rawTemplate = fs.readFileSync(templatePath, "utf-8");

  console.log(`==> Prerendering ${ROUTES.length} routes with real HTML content...`);

  for (const route of ROUTES) {
    const appHtml = render(route.path);
    const canonicalUrl = `${SITE_URL}${route.path === "/" ? "" : route.path}`;

    let html = rawTemplate;

    // Ensure lang="en"
    if (!html.includes('lang="en"')) {
      html = html.replace("<html", '<html lang="en"');
    }

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`);

    // Replace or inject Meta Description
    if (html.includes('<meta name="description"')) {
      html = html.replace(
        /<meta name="description" content=".*?">/,
        `<meta name="description" content="${route.description}">`
      );
    } else {
      html = html.replace(
        "</head>",
        `  <meta name="description" content="${route.description}">\n</head>`
      );
    }

    // Construct SEO tags
    const seoTags = `
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="${route.title}">
  <meta property="og:description" content="${route.description}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="sdocx2obsidian">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${route.title}">
  <meta name="twitter:description" content="${route.description}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">`;

    // Inject SEO tags right before </head>
    html = html.replace("</head>", `${seoTags}\n</head>`);

    // Inject prerendered App HTML into root
    html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

    // Write out target HTML file
    let outFilePath;
    if (route.path === "/") {
      outFilePath = path.resolve(distDir, "index.html");
    } else if (route.path === "/404") {
      outFilePath = path.resolve(distDir, "404.html");
    } else {
      const routeDir = path.resolve(distDir, route.path.slice(1));
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
      }
      outFilePath = path.resolve(routeDir, "index.html");
    }

    fs.writeFileSync(outFilePath, html, "utf-8");
    console.log(`  ✓ Prerendered ${route.path} -> ${path.relative(siteDir, outFilePath)} (${html.length} bytes)`);
  }

  // Generate sitemap.xml
  console.log("==> Generating sitemap.xml...");
  const today = new Date().toISOString().split("T")[0];
  const sitemapUrls = ROUTES.filter((r) => r.includeInSitemap)
    .map(
      (r) => `  <url>
    <loc>${SITE_URL}${r.path === "/" ? "" : r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq || "monthly"}</changefreq>
    <priority>${r.priority || "0.8"}</priority>
  </url>`
    )
    .join("\n");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>
`;

  fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemapXml, "utf-8");
  console.log(`  ✓ Generated sitemap.xml with ${ROUTES.filter((r) => r.includeInSitemap).length} URLs`);

  // Clean up dist-ssr
  if (fs.existsSync(ssrOutDir)) {
    fs.rmSync(ssrOutDir, { recursive: true, force: true });
  }

  console.log("==> Prerendering complete!");
}

main().catch((err) => {
  console.error("Prerendering failed:", err);
  process.exit(1);
});
