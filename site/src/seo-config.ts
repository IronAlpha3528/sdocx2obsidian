export const SITE_URL =
  (typeof process !== "undefined" && process.env?.SITE_URL) ||
  "https://sdocx2obsidian.workers.dev";

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  h1: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: string;
  includeInSitemap?: boolean;
}

export const ROUTES_META: RouteMeta[] = [
  {
    path: "/",
    title: "sdocx2obsidian — Convert Samsung Notes to Obsidian Markdown",
    description:
      "Convert Samsung Notes (.sdocx) into clean Obsidian Markdown vaults in your browser. Preserves reading order, photos, and voice memos using local WebAssembly.",
    h1: "Convert Samsung Notes to Obsidian",
    changefreq: "weekly",
    priority: "1.0",
    includeInSitemap: true,
  },
  {
    path: "/features",
    title: "Features & Architecture — sdocx2obsidian",
    description:
      "In-browser WebAssembly execution, document reading order preservation, native Obsidian Wikilinks, and clean vault directory structure.",
    h1: "Features and technical architecture",
    changefreq: "monthly",
    priority: "0.8",
    includeInSitemap: true,
  },
  {
    path: "/how-it-works",
    title: "How It Works — sdocx2obsidian",
    description:
      "Step-by-step workflow for exporting Samsung Notes (.sdocx) on Galaxy devices and converting them locally into Obsidian-compatible vaults.",
    h1: "The conversion workflow",
    changefreq: "monthly",
    priority: "0.8",
    includeInSitemap: true,
  },
  {
    path: "/preview",
    title: "Vault Preview & Syntax — sdocx2obsidian",
    description:
      "Inspect converted Obsidian Markdown notes, Wikilink media embeds, and the generated vault directory structure.",
    h1: "Obsidian vault preview and syntax",
    changefreq: "monthly",
    priority: "0.8",
    includeInSitemap: true,
  },
  {
    path: "/limitations",
    title: "Supported Features & Limitations — sdocx2obsidian",
    description:
      "Support matrix for typed text, attachments, voice memos, S-Pen handwriting ink strokes, and proprietary Samsung formats.",
    h1: "Supported content and format limitations",
    changefreq: "monthly",
    priority: "0.8",
    includeInSitemap: true,
  },
  {
    path: "/faq",
    title: "Frequently Asked Questions — sdocx2obsidian",
    description:
      "Export guide from Samsung Notes, vault organization, browser memory limits, and troubleshooting for sdocx2obsidian.",
    h1: "Frequently Asked Questions",
    changefreq: "monthly",
    priority: "0.7",
    includeInSitemap: true,
  },
  {
    path: "/privacy",
    title: "Privacy Policy — sdocx2obsidian",
    description:
      "Privacy guarantees of sdocx2obsidian: 100% in-browser processing via WebAssembly, zero file uploads, local assets, and sanitized error reporting.",
    h1: "Privacy Policy",
    changefreq: "monthly",
    priority: "0.5",
    includeInSitemap: true,
  },
  {
    path: "/about",
    title: "About — sdocx2obsidian",
    description:
      "About sdocx2obsidian: open-source developer utility, version details, MIT license, GitHub links, and independent project disclaimer.",
    h1: "About sdocx2obsidian",
    changefreq: "monthly",
    priority: "0.6",
    includeInSitemap: true,
  },
  {
    path: "/404",
    title: "404 Not Found — sdocx2obsidian",
    description: "The requested page could not be found.",
    h1: "404 — Page Not Found",
    includeInSitemap: false,
  },
];
