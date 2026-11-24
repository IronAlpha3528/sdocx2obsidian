import React from "react";

export const PreviewShowcase: React.FC = () => {
  return (
    <section id="preview" className="showcase-section" aria-label="Output Vault Preview">
      <div className="section-header">
        <h2 className="section-title">Output vault structure and syntax</h2>
        <p className="section-description">
          Notes and media are organized into standard Markdown and Wikilink embeds. Text-only notes create no asset folders.
        </p>
      </div>

      <div className="showcase-grid">
        {/* Panel 1: Vault Folder Hierarchy */}
        <div className="showcase-panel">
          <div className="showcase-panel-header">
            <span className="panel-title">Obsidian Vault Directory</span>
            <span className="panel-tag">Filesystem Layout</span>
          </div>

          <div className="showcase-panel-body">
            <div className="vault-tree">
              <div className="tree-row depth-0">
                <span className="tree-icon">📁</span>
                <span className="tree-name">Obsidian_Vault/</span>
              </div>
              <div className="tree-row depth-1">
                <span className="tree-icon">📄</span>
                <span className="tree-name">Physics_01.md</span>
              </div>
              <div className="tree-row depth-1">
                <span className="tree-icon">📁</span>
                <span className="tree-name">Physics_01_Assets/</span>
              </div>
              <div className="tree-row depth-2">
                <span className="tree-icon">🎵</span>
                <span className="tree-name">audio_01.m4a</span>
              </div>
              <div className="tree-row depth-2">
                <span className="tree-icon">🖼️</span>
                <span className="tree-name">board_photo.jpg</span>
              </div>
              <div className="tree-row depth-1">
                <span className="tree-icon">📄</span>
                <span className="tree-name">Meeting_Notes.md</span>
              </div>
            </div>
            <div className="showcase-note">
              Text-only notes (like <code>Meeting_Notes.md</code>) generate zero empty asset directories.
            </div>
          </div>
        </div>

        {/* Panel 2: Markdown File Content with Highlighted Wikilinks */}
        <div className="showcase-panel">
          <div className="showcase-panel-header">
            <span className="panel-title font-mono">Physics_01.md</span>
            <span className="panel-tag font-mono">Obsidian Markdown</span>
          </div>

          <div className="showcase-panel-body p-0">
            <pre className="code-editor-block">
              <code>
                <span className="code-heading"># Physics 01</span>
                {"\n\n"}
                <span className="code-wikilink">![[Physics_01_Assets/audio_01.m4a]]</span>
                {"\n\n"}
                {"Today's lecture on wave interference:\n"}
                {"- Double-slit equation: d sin(θ) = mλ\n"}
                {"- Fringe spacing distribution on screen\n\n"}
                <span className="code-wikilink">![[Physics_01_Assets/board_photo.jpg]]</span>
                {"\n\n"}
                {"Lab homework:\n"}
                {"1. Calculate wavelength variance\n"}
                {"2. Submit spectrometer data table"}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
