import React, { useState } from "react";

export const InfoSection: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>("privacy");

  const toggle = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <section className="info-section" aria-label="Usage guide and technical information">
      {/* Privacy Architecture */}
      <div className="accordion-card">
        <button
          type="button"
          className="accordion-header"
          onClick={() => toggle("privacy")}
          aria-expanded={openSection === "privacy"}
        >
          <span>100% In-Browser Privacy & Local Processing</span>
          <span>{openSection === "privacy" ? "▲" : "▼"}</span>
        </button>
        {openSection === "privacy" && (
          <div className="accordion-content">
            <p>
              <code>sdocx2obsidian</code> processes all notes entirely client-side inside your
              web browser using WebAssembly (Pyodide).
            </p>
            <ul style={{ margin: "10px 0 0 20px" }}>
              <li><strong>Zero Cloud Uploads:</strong> Your notes, typed text, photos, and voice recordings never leave your machine.</li>
              <li><strong>Offline Capable:</strong> Once the page is loaded, conversions run locally without any active internet connection.</li>
              <li><strong>No Telemetry:</strong> Zero tracking cookies, analytics scripts, or third-party ad networks.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Vault Structure */}
      <div className="accordion-card">
        <button
          type="button"
          className="accordion-header"
          onClick={() => toggle("structure")}
          aria-expanded={openSection === "structure"}
        >
          <span>Obsidian Vault Structure & Wikilinks</span>
          <span>{openSection === "structure" ? "▲" : "▼"}</span>
        </button>
        {openSection === "structure" && (
          <div className="accordion-content">
            <p>
              When extracted into your Obsidian vault, notes and media are organized cleanly:
            </p>
            <pre style={{
              background: "var(--code-bg)",
              padding: "12px",
              borderRadius: "6px",
              margin: "10px 0",
              fontSize: "0.825rem",
              fontFamily: "ui-monospace, monospace"
            }}>
{`My_Vault/
├── Physics_Lecture.md
├── Physics_Lecture_Assets/
│   ├── audio_recording.m4a
│   └── whiteboard_photo.jpg
└── Meeting_Notes.md    (Notes without media create no empty asset folder)`}
            </pre>
            <p>
              All media embeds use standard Obsidian Wikilink syntax (<code>![[Physics_Lecture_Assets/whiteboard_photo.jpg]]</code>)
              with forward slashes for full cross-platform compatibility across Windows, Mac, Linux, iOS, and Android.
            </p>
          </div>
        )}
      </div>

      {/* Format Limitations */}
      <div className="accordion-card">
        <button
          type="button"
          className="accordion-header"
          onClick={() => toggle("limits")}
          aria-expanded={openSection === "limits"}
        >
          <span>Format Limitations & Vector Handwriting</span>
          <span>{openSection === "limits" ? "▲" : "▼"}</span>
        </button>
        {openSection === "limits" && (
          <div className="accordion-content">
            <p>
              <strong>Supported:</strong> Samsung Notes <code>.sdocx</code> files (ZIP container format with <code>note.note</code> binary payload).
            </p>
            <ul style={{ margin: "10px 0 0 20px" }}>
              <li><strong>Preserved:</strong> Typed text, reading order, embedded photographs, diagrams, and voice memo recordings (.m4a).</li>
              <li><strong>Handwriting/Ink:</strong> S-Pen handwritten strokes use Samsung&apos;s proprietary vector format and cannot be rendered without Samsung proprietary code libraries. Typed text and attachments are extracted completely.</li>
              <li><strong>Unsupported:</strong> Legacy S-Note <code>.snb</code> files and password-protected encrypted notes.</li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};
