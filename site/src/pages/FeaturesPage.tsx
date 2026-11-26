import React from "react";
import { Link } from "react-router-dom";

export const FeaturesPage: React.FC = () => {

  const features = [
    {
      title: "In-browser WebAssembly execution",
      badge: "Architecture",
      description:
        "Conversion runs in a dedicated background Web Worker executing Python 3.12 compiled to WebAssembly via Pyodide v0.26.4. Notes are unpacked and parsed entirely within browser memory.",
      details: [
        "Zero network uploads; notes and media never leave your device",
        "Strict Content Security Policy (CSP) blocking external outbound requests",
        "Runs offline once the application assets and Pyodide runtime are cached",
      ],
    },
    {
      title: "Binary reading order preservation",
      badge: "Format Engine",
      description:
        "Samsung Notes (.sdocx) stores note content as binary protobuf records inside note.note. The parser matches record offsets to ensure typed paragraphs, photos, and voice recordings appear in their original visual sequence.",
      details: [
        "Avoids disorganized media dumps common to generic archive extractors",
        "Preserves mixed notes containing text, audio, and multiple photos in order",
        "Supports sequential placement for JPEG, PNG, GIF, and WebP attachments",
      ],
    },
    {
      title: "Obsidian Wikilink syntax",
      badge: "Output Format",
      description:
        "Media attachments are embedded using native Obsidian Wikilinks formatted as ![[Note_Assets/filename.ext]]. Paths use forward slashes for universal compatibility.",
      details: [
        "Consistent forward-slash syntax across Windows, macOS, Linux, iOS, and Android",
        "Collision-safe media naming prevents overwriting identically named assets",
        "Audio voice recordings (.m4a) are linked prominently at note top",
      ],
    },
    {
      title: "Clean vault output",
      badge: "Filesystem",
      description:
        "Text-only notes produce standalone .md files without generating empty asset directories. Media notes isolate assets within dedicated <NoteName>_Assets/ subfolders.",
      details: [
        "Prevents empty folder clutter across your vault root",
        "Generated vault ZIP unpacks directly into your Obsidian directory",
        "Deterministic archive packaging with zero uncompressed media bloat",
      ],
    },
    {
      title: "Sanitized error diagnostics",
      badge: "Confidentiality",
      description:
        "If an unsupported or corrupted note fails conversion, a pre-filled issue report link is generated containing strictly environment metadata and error codes.",
      details: [
        "Never includes note titles, filenames, or note text in issue links",
        "Encodes only tool version, error class, coarse size bucket, and browser family",
        "Follows project confidentiality standard MD-6",
      ],
    },
  ];

  return (
    <div className="subpage-container">
      <div className="section-header">
        <h1 className="section-title">Features and technical architecture</h1>
        <p className="section-description">
          How sdocx2obsidian converts binary Samsung Notes into Obsidian Markdown vaults using client-side WebAssembly.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "24px" }}>
        {features.map((item) => (
          <div
            key={item.title}
            style={{
              padding: "18px 20px",
              border: "1px solid var(--border-default)",
              borderRadius: "6px",
              background: "var(--bg-surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {item.title}
              </h2>
              <span className="status-badge planned">{item.badge}</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: "1.55" }}>
              {item.description}
            </p>
            <ul style={{ paddingLeft: "18px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
              {item.details.map((detail, idx) => (
                <li key={idx}>{detail}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "32px" }}>
        <Link to="/" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
          &larr; Return to Converter
        </Link>
      </div>
    </div>
  );
};
