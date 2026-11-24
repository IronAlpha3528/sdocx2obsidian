import React from "react";

export const Limitations: React.FC = () => {
  const supportedItems = [
    "Samsung Notes modern .sdocx files (ZIP archive format)",
    "Typed body text, headers, and bulleted lists",
    "Embedded photos, screenshots, and diagrams (JPEG, PNG)",
    "Voice memo audio recordings (.m4a files preserved and linked)",
    "Document reading order preservation (media placed where it belongs)",
    "Clean folder structure with no empty asset folders",
  ];

  const limitationItems = [
    "S-Pen handwritten vector ink strokes (proprietary Samsung stroke format)",
    "Legacy S-Note .snb files (export as .sdocx first in Samsung Notes)",
    "Password-protected or encrypted Samsung Notes (unlock before export)",
    "Real-time sync (this tool is a migration utility, not a continuous sync daemon)",
  ];

  return (
    <section id="limitations" className="limitations-section" aria-label="Format Support and Limitations">
      <div className="section-container">
        <div className="section-header">
          <span className="section-tag">Specifications</span>
          <h2 className="section-title">Supported Content &amp; Limitations</h2>
          <p className="section-subtitle">
            Transparent breakdown of supported note contents and known format boundaries.
          </p>
        </div>

        <div className="limitations-dual-grid">
          {/* Supported */}
          <div className="limitations-card supported">
            <div className="limitations-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--status-success-border)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <h3 className="limitations-title">Supported &amp; Preserved</h3>
            </div>
            <ul className="limitations-list">
              {supportedItems.map((item, idx) => (
                <li key={idx} className="limitations-item supported">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Known Limitations */}
          <div className="limitations-card unsupported">
            <div className="limitations-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning-border)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3 className="limitations-title">Known Limitations</h3>
            </div>
            <ul className="limitations-list">
              {limitationItems.map((item, idx) => (
                <li key={idx} className="limitations-item unsupported">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
