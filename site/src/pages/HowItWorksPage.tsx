import React from "react";
import { Link } from "react-router-dom";

export const HowItWorksPage: React.FC = () => {

  const steps = [
    {
      number: "1",
      title: "Export .sdocx from Samsung Notes",
      summary: "Save notes from Galaxy device as standard .sdocx archive files.",
      details:
        "Open the Samsung Notes app on your Galaxy phone or tablet. Long-press to select notes, tap 'Save as file', and select 'Samsung Notes file (*.sdocx)'. Copy the files to your computer or phone storage. Password-protected notes must be unlocked before export.",
    },
    {
      number: "2",
      title: "In-browser staging & validation",
      summary: "Security and size limits checked before running conversion.",
      details:
        "Drag and drop files into the converter. Client-side validation checks that files have the .sdocx extension and adhere to safe memory bounds: maximum 5 files per batch, 50 MB per file, and 100 MB cumulative session size. An advisory prompt appears for notes ≥ 25 MB to protect mobile devices with limited RAM.",
    },
    {
      number: "3",
      title: "Local WebAssembly extraction",
      summary: "Pyodide Web Worker unpacks protobuf and media in memory.",
      details:
        "A background Web Worker boots Pyodide v0.26.4 (Python compiled to WebAssembly) and imports the local sdocx2obsidian Python package. The worker unzips the .sdocx container in memory and parses binary note.note records.",
    },
    {
      number: "4",
      title: "Sequential Wikilink formatting",
      summary: "Text and media assembled in original document reading order.",
      details:
        "Document paragraphs, headings, bullet lists, voice recordings (.m4a), and photos are formatted into standard Markdown. Media references use native Obsidian Wikilinks (![[Note_Assets/file.ext]]) with forward slashes for cross-platform link resolution.",
    },
    {
      number: "5",
      title: "Direct vault ZIP download",
      summary: "Unpack obsidian_vault.zip straight into your Obsidian folder.",
      details:
        "The session compiles the converted notes and asset directories into an obsidian_vault.zip archive. Extract the ZIP into your Obsidian vault; all notes and embedded media resolve instantly with zero broken links.",
    },
  ];

  return (
    <div className="subpage-container">
      <div className="section-header">
        <h1 className="section-title">The conversion workflow</h1>
        <p className="section-description">
          End-to-end breakdown of how sdocx2obsidian transforms proprietary Samsung Notes archives into an Obsidian vault.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
        {steps.map((step) => (
          <div
            key={step.number}
            style={{
              padding: "16px 18px",
              border: "1px solid var(--border-default)",
              borderRadius: "6px",
              background: "var(--bg-surface)",
              display: "flex",
              gap: "16px",
              alignItems: "flex-start",
            }}
          >
            <span className="flow-number">{step.number}</span>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                {step.title}
              </h2>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 500 }}>
                {step.summary}
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.55" }}>
                {step.details}
              </p>
            </div>
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
