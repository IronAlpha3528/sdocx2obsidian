import React from "react";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: "1",
      title: "Select Samsung Notes",
      description:
        "Export notes from the Samsung Notes app as .sdocx files. Drag and drop them into the workbench or choose them from your files.",
      meta: "Max 5 notes · 50MB per file",
    },
    {
      number: "2",
      title: "Local WASM Processing",
      description:
        "The Pyodide WebAssembly engine initializes in a background Web Worker, extracts binary note records, and formats Obsidian Wikilinks in memory.",
      meta: "Zero Network Requests · 100% Offline",
    },
    {
      number: "3",
      title: "Unpack into Obsidian",
      description:
        "Download obsidian_vault.zip. Extract the archive directly into your Obsidian vault folder and all notes and images will immediately link.",
      meta: "Standard Markdown · Forward Slashes",
    },
  ];

  return (
    <section id="how-it-works" className="how-it-works-section" aria-label="How It Works">
      <div className="section-container">
        <div className="section-header">
          <span className="section-tag">Workflow</span>
          <h2 className="section-title">How the Conversion Works</h2>
          <p className="section-subtitle">
            A seamless three-step migration with zero command-line tools or server dependencies required.
          </p>
        </div>

        <div className="workflow-steps-grid">
          {steps.map((step, idx) => (
            <div key={idx} className="workflow-step-card">
              <div className="step-number-badge">{step.number}</div>
              <h3 className="step-card-title">{step.title}</h3>
              <p className="step-card-description">{step.description}</p>
              <div className="step-card-meta">{step.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
