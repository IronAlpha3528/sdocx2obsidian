import React from "react";

export const Hero: React.FC = () => {
  return (
    <section className="page-intro" aria-label="Introduction">
      <h1 className="page-title">Convert Samsung Notes to Obsidian</h1>
      <p className="page-description">
        Converts modern <code>.sdocx</code> files into an Obsidian Markdown vault with embedded images and voice memos.
        Processing runs locally in your browser using WebAssembly; your files are never uploaded.
      </p>
    </section>
  );
};
