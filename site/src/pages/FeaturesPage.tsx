import React from "react";
import { Link } from "react-router-dom";

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      title: "100% In-Browser Local Privacy",
      badge: "Zero Network Egress",
      description:
        "Every note conversion runs entirely inside your web browser via WebAssembly (Pyodide v0.26.4). Your private notes, typed thoughts, meeting minutes, whiteboard photos, and voice memos never leave your computer or phone. No analytics, no tracking cookies, and no third-party APIs.",
      details: [
        "Runs completely offline once the page is cached",
        "Zero data sent to any cloud server or third-party service",
        "Strict Content Security Policy (CSP) blocking external requests",
      ],
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: "Binary Reading Order Preservation",
      badge: "Format Engine",
      description:
        "Samsung Notes (.sdocx) stores notes as binary protobuf records inside note.note. Generic unzip tools lose the document flow by dumping media into arbitrary folders. sdocx2obsidian parses binary record offsets to interleave paragraphs, photos, and recordings in their original visual reading sequence.",
      details: [
        "Preserves the exact sequential flow of your lecture or meeting notes",
        "Photos appear right under the paragraph where they were snapped",
        "Handles mixed notes containing text, audio, and multiple photos cleanly",
      ],
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
    {
      title: "Native Obsidian Wikilinks Syntax",
      badge: "Obsidian Native",
      description:
        "All media embeds are automatically formatted using Obsidian's native Wikilink syntax (![[Note_Assets/filename.ext]]). Links strictly use standard forward slashes, guaranteeing seamless link resolution across Windows, macOS, Linux, iOS, and Android.",
      details: [
        "Standard ![[Folder/File]] wikilinks syntax out of the box",
        "Guaranteed cross-platform forward slashes (no broken Windows backslashes)",
        "Collision-safe asset resolution prevents file overwrites in multi-note batches",
      ],
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      title: "Voice Memo Recording Preservation",
      badge: "Audio Extraction",
      description:
        "When notes include embedded audio recordings captured in Samsung Notes, sdocx2obsidian detects the .m4a audio stream, extracts it to the note's asset folder, and embeds an audio player link prominently at the top of the Markdown note.",
      details: [
        "Preserves uncompressed .m4a audio quality",
        "Plays directly inside Obsidian's native audio player widget",
        "Never loses lecture or interview recordings during migration",
      ],
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      ),
    },
    {
      title: "Clean Vault Standard (No Empty Folders)",
      badge: "Tidy Vault",
      description:
        "Many converters create an empty _Assets/ folder for every single note, cluttering your Obsidian vault with empty folders. sdocx2obsidian only creates asset directories when notes actually contain embedded media.",
      details: [
        "Text-only notes produce clean standalone .md files with zero clutter",
        "Media notes isolate assets inside <NoteName>_Assets/ folders",
        "Keeps your vault root neat, searchable, and minimal",
      ],
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      title: "Safe, Content-Free Error Diagnostics",
      badge: "Confidentiality First",
      description:
        "If an unsupported or corrupted note fails conversion, a pre-filled GitHub issue report link is generated. To strictly protect your privacy, the generated URL encodes only browser environment data and error codes—never filenames, note titles, or private contents.",
      details: [
        "Zero private data in GitHub issue report URLs",
        "Provides engineers with error codes and file size buckets",
        "Partial batch resilience: other notes in the batch continue successfully",
      ],
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ padding: "48px 0 88px" }}>
      <div className="section-container">
        <div className="section-header">
          <span className="section-tag">Features &amp; Architecture</span>
          <h1 className="section-title">Built for Precision, Privacy, and Obsidian</h1>
          <p className="section-subtitle">
            A comprehensive overview of sdocx2obsidian&apos;s client-side conversion engine, reading order parsing, and vault standards.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "28px", maxWidth: "920px", margin: "0 auto 48px" }}>
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="feature-card"
              style={{
                padding: "32px",
                display: "flex",
                flexDirection: "row",
                gap: "24px",
                alignItems: "flex-start",
              }}
            >
              <div className="feature-icon-wrapper" style={{ flexShrink: 0, marginTop: "4px" }}>
                {feature.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <h2 className="feature-title" style={{ margin: "0", fontSize: "1.25rem" }}>
                    {feature.title}
                  </h2>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      background: "var(--accent-tint)",
                      color: "var(--accent-base)",
                      border: "1px solid var(--border-accent)",
                    }}
                  >
                    {feature.badge}
                  </span>
                </div>
                <p className="feature-description" style={{ fontSize: "0.95rem", marginBottom: "16px" }}>
                  {feature.description}
                </p>
                <ul style={{ paddingLeft: "20px", fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {feature.details.map((detail, dIdx) => (
                    <li key={dIdx}>{detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <Link to="/" className="btn-primary" style={{ width: "auto", minWidth: "200px" }}>
            Open Converter Workbench
          </Link>
        </div>
      </div>
    </div>
  );
};
