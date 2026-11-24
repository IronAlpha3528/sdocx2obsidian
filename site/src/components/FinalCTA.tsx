import React from "react";

export const FinalCTA: React.FC = () => {
  return (
    <section className="final-cta-section" aria-label="Get Started">
      <div className="section-container">
        <div className="final-cta-inner">
          <h2 className="final-cta-title">Ready to Convert Your Notes?</h2>
          <p className="final-cta-subtitle">
            Migrate your Samsung Notes into your Obsidian vault in seconds. Zero uploads, zero telemetry, and 100% private.
          </p>
          <div className="final-cta-actions">
            <a
              href="#converter"
              className="btn-primary"
              style={{ width: "auto", minWidth: "180px" }}
            >
              Start Converting Now
            </a>
            <a
              href="https://github.com/IronAlpha3528/sdocx2obsidian"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
