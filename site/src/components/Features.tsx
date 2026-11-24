import React from "react";

export const Features: React.FC = () => {
  const featuresList = [
    {
      title: "100% In-Browser Privacy",
      description:
        "All note parsing, binary unpacking, and media extraction run locally inside browser memory via Pyodide WebAssembly. Zero bytes leave your device.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: "Reading Order Preservation",
      description:
        "Unlike basic ZIP extractors that dump images randomly, sdocx2obsidian parses binary note records to interleave typed paragraphs, diagrams, and photos in their exact visual sequence.",
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
      title: "Native Obsidian Wikilinks",
      description:
        "Embedded media is automatically linked using standard Obsidian Wikilink syntax (![[Note_Assets/image.jpg]]) with cross-platform forward slashes for Windows, macOS, Linux, and mobile.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      title: "Voice Memo Extraction",
      description:
        "Embedded lecture and meeting audio recordings (.m4a) are safely extracted and embedded right at the top of the converted Markdown note.",
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
      title: "Clean Vault Standard",
      description:
        "Text-only notes produce zero empty asset subfolders. The generated vault structure is tidy, minimal, and follows Obsidian community best practices.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      title: "One-Click Vault ZIP Export",
      description:
        "All converted notes and their media asset folders are packaged into a single obsidian_vault.zip file ready to unpack directly into your Obsidian directory.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="features-section" aria-label="Key Features">
      <div className="section-container">
        <div className="section-header">
          <span className="section-tag">Capabilities</span>
          <h2 className="section-title">Built for Obsidian Enthusiasts</h2>
          <p className="section-subtitle">
            Engineered specifically to solve the limitations of standard converters by preserving context, media, and structure.
          </p>
        </div>

        <div className="features-grid">
          {featuresList.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon-wrapper">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
