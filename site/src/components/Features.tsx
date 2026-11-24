import React from "react";

export const Features: React.FC = () => {
  const points = [
    {
      title: "Local browser processing",
      desc: "Pyodide WebAssembly parses notes directly in your browser. Note text, recordings, and images are never uploaded to any server.",
    },
    {
      title: "Reading order preservation",
      desc: "Binary record offsets are parsed to place photos, diagrams, and audio memos next to their corresponding paragraphs in visual reading order.",
    },
    {
      title: "Native Obsidian Wikilinks",
      desc: "Media attachments are embedded using standard ![[Folder/file.ext]] syntax with forward slashes for cross-platform vault compatibility.",
    },
    {
      title: "Voice memo extraction",
      desc: "Recorded voice memos (.m4a) are extracted into the note's asset directory and linked at the top of the converted Markdown note.",
    },
    {
      title: "Clean vault structure",
      desc: "Notes with media isolate assets in <NoteName>_Assets/ folders. Text-only notes produce clean standalone .md files with zero empty directories.",
    },
    {
      title: "Deterministic ZIP export",
      desc: "All converted notes and asset folders are bundled into an in-memory vault ZIP with fixed timestamps ready for direct extraction.",
    },
  ];

  return (
    <section id="features" className="section-block" aria-label="Features">
      <div className="section-header">
        <h2 className="section-title">Conversion features</h2>
        <p className="section-description">
          Designed specifically for migrating Samsung Notes into standard Obsidian vaults.
        </p>
      </div>

      <div className="features-factual-grid">
        {points.map((point) => (
          <div key={point.title} className="feature-point">
            <h3 className="feature-point-title">{point.title}</h3>
            <p className="feature-point-desc">{point.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
