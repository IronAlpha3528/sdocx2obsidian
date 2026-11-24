import React from "react";

export const Hero: React.FC = () => {
  return (
    <section className="hero-section" aria-label="Introduction">
      <div className="section-container">
        <h1 className="hero-title">
          Convert Samsung Notes to <span className="highlight">Obsidian Markdown</span>
        </h1>

        <p className="hero-subtitle">
          Transform your Samsung Notes (<code>.sdocx</code>) into clean, standard Markdown vaults.
          Preserves visual reading order, embedded photographs, and voice memos using native Obsidian Wikilinks.
        </p>

        <div className="hero-cta-group">
          <a
            href="#converter"
            className="btn-primary"
            style={{ width: "auto", minWidth: "180px" }}
          >
            Start Converting
          </a>
          <a
            href="#features"
            className="btn-secondary"
          >
            Explore Features
          </a>
        </div>

        <div className="hero-highlights">
          <div className="hero-highlight-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>No Cloud Uploads</span>
          </div>
          <div className="hero-highlight-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Exact Reading Order</span>
          </div>
          <div className="hero-highlight-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Native Wikilinks</span>
          </div>
          <div className="hero-highlight-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Voice Memo Extraction</span>
          </div>
        </div>
      </div>
    </section>
  );
};
