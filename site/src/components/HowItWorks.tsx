import React from "react";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: "1",
      title: "Export .sdocx files",
      text: "In the Samsung Notes app on your phone or tablet, select notes and save them as Samsung Notes files (.sdocx).",
    },
    {
      number: "2",
      title: "Convert in your browser",
      text: "Drop your files into the workbench above. Pyodide WebAssembly parses note records and formats Wikilinks in local memory.",
    },
    {
      number: "3",
      title: "Extract into Obsidian",
      text: "Download obsidian_vault.zip and unpack it into your Obsidian vault folder. All notes, images, and audio link automatically.",
    },
  ];

  return (
    <section id="how-it-works" className="section-block" aria-label="How It Works">
      <div className="section-header">
        <h2 className="section-title">How the conversion works</h2>
        <p className="section-description">
          Three-step migration running entirely in browser memory.
        </p>
      </div>

      <div className="flow-list">
        {steps.map((step) => (
          <div key={step.number} className="flow-item">
            <span className="flow-number">{step.number}</span>
            <div className="flow-content">
              <strong>{step.title}:</strong> {step.text}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
