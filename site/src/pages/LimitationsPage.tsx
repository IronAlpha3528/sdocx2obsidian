import React from "react";
import { Link } from "react-router-dom";

export const LimitationsPage: React.FC = () => {
  const supportedDetails = [
    {
      name: "Modern .sdocx Format",
      desc: "Samsung Notes exported as .sdocx (ZIP archive containing binary note.note payload).",
    },
    {
      name: "Typed Text & Rich Formats",
      desc: "Paragraphs, headings, bulleted lists, numbered lists, and inline text blocks.",
    },
    {
      name: "Photographs & Diagrams",
      desc: "Embedded JPEG and PNG images placed in visual document reading order.",
    },
    {
      name: "Voice Memos (.m4a)",
      desc: "Audio recordings extracted to asset folders and linked at the top of the note.",
    },
    {
      name: "Clean Vault Structure",
      desc: "Zero empty folders created for text-only notes. Forward-slash Obsidian Wikilinks.",
    },
  ];

  const limitationsDetails = [
    {
      name: "S-Pen Handwritten Vector Strokes",
      desc: "Proprietary Samsung vector strokes cannot be rendered as editable text or vector SVG without Samsung's closed-source rendering libraries. Typed text and photos in the note are converted cleanly.",
    },
    {
      name: "Password-Encrypted Notes",
      desc: "Notes locked with Samsung Knox or passwords must be unlocked in Samsung Notes before exporting to .sdocx.",
    },
    {
      name: "Legacy S-Note (.snb) Format",
      desc: "Pre-2018 Samsung S-Note files (.snb) are not supported. Import them into Samsung Notes and re-export as .sdocx first.",
    },
    {
      name: "Continuous Real-Time Sync",
      desc: "sdocx2obsidian is a batch migration tool, not a background sync daemon. It does not connect to Samsung Cloud APIs.",
    },
  ];

  return (
    <div style={{ padding: "48px 0 88px" }}>
      <div className="section-container">
        <div className="section-header">
          <span className="section-tag">Specifications</span>
          <h1 className="section-title">Supported Content &amp; Limitations</h1>
          <p className="section-subtitle">
            An open, transparent guide on what sdocx2obsidian converts and the technical constraints of Samsung&apos;s proprietary format.
          </p>
        </div>

        <div className="limitations-dual-grid" style={{ maxWidth: "1000px", margin: "0 auto 52px" }}>
          {/* Supported */}
          <div className="limitations-card supported">
            <div className="limitations-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--status-success-border)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <h2 className="limitations-title" style={{ fontSize: "1.25rem" }}>Supported &amp; Preserved</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {supportedDetails.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-success-border)" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: "2px" }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Limitations */}
          <div className="limitations-card unsupported">
            <div className="limitations-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning-border)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h2 className="limitations-title" style={{ fontSize: "1.25rem" }}>Known Format Boundaries</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {limitationsDetails.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning-border)" strokeWidth="2" style={{ flexShrink: 0, marginTop: "2px" }}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Advice Card */}
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto 52px",
            padding: "24px 28px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "12px",
          }}
        >
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            Recommended Best Practices Before Exporting:
          </h3>
          <ul style={{ paddingLeft: "20px", fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>If you have handwriting you wish to preserve as editable text, use Samsung Notes&apos; built-in &quot;Convert to text&quot; feature before exporting.</li>
            <li>Unlock any password-protected notes in Samsung Notes before selecting them for export.</li>
            <li>For notes containing large lecture recordings (&gt;25MB), convert them individually to ensure fast memory processing on mobile devices.</li>
          </ul>
        </div>

        <div style={{ textAlign: "center" }}>
          <Link to="/" className="btn-primary" style={{ width: "auto", minWidth: "200px" }}>
            Go to Converter
          </Link>
        </div>
      </div>
    </div>
  );
};
