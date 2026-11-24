import React from "react";
import { Link } from "react-router-dom";

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      number: "1",
      title: "Exporting from Samsung Notes",
      subtitle: "From Galaxy Phone or Tablet to .sdocx",
      content:
        "Open the Samsung Notes app on your Galaxy device. Select one or more notes, tap 'Share' or 'Save as file', and choose 'Samsung Notes file (*.sdocx)'. Save or transfer the files to your computer or phone storage.",
      tip: "Ensure notes are unlocked. Password-protected notes must be unlocked in Samsung Notes before exporting.",
    },
    {
      number: "2",
      title: "In-Browser Staging & Limit Validation",
      subtitle: "Pre-flight Security Checks",
      content:
        "When you drop or select your .sdocx files, the client-side validation engine immediately checks the file signatures, verifies extensions, and ensures compliance with safe memory limits (max 5 notes, 50MB single note limit, 100MB cumulative batch cap).",
      tip: "If any selected note is ≥ 25 MB, a memory confirmation modal alerts you before starting, preventing out-of-memory crashes on mobile devices.",
    },
    {
      number: "3",
      title: "WebAssembly Pyodide Execution",
      subtitle: "Local Python Conversion in a Web Worker",
      content:
        "A dedicated background Web Worker boots Pyodide v0.26.4 (Python compiled to WebAssembly) and loads the sdocx2obsidian wheel. The worker unzips the .sdocx container in virtual memory and reads the binary note.note protobuf structure.",
      tip: "Everything runs in browser RAM. No temporary files are written to cloud disks, and processing is 100% offline-capable.",
    },
    {
      number: "4",
      title: "Asset Extraction & Wikilink Assembly",
      subtitle: "Preserving Reading Order & Formats",
      content:
        "The parser matches binary document records against embedded media files in media/. Typed text, voice recordings, and photographs are structured into Markdown with native Obsidian ![[Assets/photo.jpg]] Wikilinks placed at their exact visual positions.",
      tip: "Text-only notes are formatted cleanly without creating empty asset directories.",
    },
    {
      number: "5",
      title: "Vault ZIP Packaging & Direct Unpack",
      subtitle: "Instant Export to Obsidian",
      content:
        "The session compiles the converted .md files and asset directories into an obsidian_vault.zip file. Download the ZIP with a single click and extract it directly into your Obsidian vault directory.",
      tip: "Obsidian will immediately index all notes and resolve embedded images and voice memos without any broken links.",
    },
  ];

  return (
    <div style={{ padding: "48px 0 88px" }}>
      <div className="section-container">
        <div className="section-header">
          <span className="section-tag">How It Works</span>
          <h1 className="section-title">The End-to-End Migration Pipeline</h1>
          <p className="section-subtitle">
            A step-by-step breakdown of how sdocx2obsidian transforms proprietary binary Samsung Notes into an Obsidian-compatible Markdown vault.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "860px", margin: "0 auto 52px" }}>
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="workflow-step-card"
              style={{
                display: "flex",
                gap: "24px",
                alignItems: "flex-start",
                padding: "32px",
              }}
            >
              <div
                className="step-number-badge"
                style={{
                  width: "44px",
                  height: "44px",
                  fontSize: "1.1rem",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                {step.number}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent-base)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {step.subtitle}
                  </span>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                    {step.title}
                  </h2>
                </div>

                <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "14px" }}>
                  {step.content}
                </p>

                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-surface-elevated)",
                    borderLeft: "3px solid var(--accent-base)",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <strong>Tip:</strong> {step.tip}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <Link to="/" className="btn-primary" style={{ width: "auto", minWidth: "200px" }}>
            Start Converting Notes
          </Link>
        </div>
      </div>
    </div>
  );
};
