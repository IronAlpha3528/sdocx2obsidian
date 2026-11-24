import React from "react";

export const PreviewShowcase: React.FC = () => {
  return (
    <section id="preview" className="preview-showcase-section" aria-label="Output Preview Showcase">
      <div className="section-container">
        <div className="section-header">
          <span className="section-tag">Showcase</span>
          <h2 className="section-title">What the Vault Looks Like</h2>
          <p className="section-subtitle">
            See how notes and media are organized cleanly into standard Obsidian files and Wikilink embeds.
          </p>
        </div>

        <div className="showcase-dual-grid">
          {/* Card 1: Vault Folder Hierarchy */}
          <div className="showcase-card">
            <div className="showcase-card-header">
              <span className="showcase-header-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Obsidian Vault Structure
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Directory Hierarchy</span>
            </div>

            <div className="showcase-card-body">
              <div className="showcase-vault-tree">
                <div className="vault-tree-item">
                  <span className="vault-folder">📁 Obsidian_Vault/</span>
                </div>
                <div className="vault-tree-item" style={{ paddingLeft: "20px" }}>
                  <span className="vault-file-md">📄 Physics_Lecture_01.md</span>
                </div>
                <div className="vault-tree-item" style={{ paddingLeft: "20px" }}>
                  <span className="vault-folder">📁 Physics_Lecture_01_Assets/</span>
                </div>
                <div className="vault-tree-item" style={{ paddingLeft: "40px" }}>
                  <span className="vault-file-asset">🎵 audio_recording_1.m4a</span>
                </div>
                <div className="vault-tree-item" style={{ paddingLeft: "40px" }}>
                  <span className="vault-file-asset">🖼️ whiteboard_photo.jpg</span>
                </div>
                <div className="vault-tree-item" style={{ paddingLeft: "20px" }}>
                  <span className="vault-file-md">📄 Project_Meeting_Notes.md</span>
                </div>
                <div className="vault-tree-item" style={{ paddingLeft: "20px", color: "var(--text-muted)" }}>
                  <span>↳ (Text-only notes generate zero empty asset folders)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Markdown Content with Wikilinks */}
          <div className="showcase-card">
            <div className="showcase-card-header">
              <span className="showcase-header-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                </svg>
                Physics_Lecture_01.md
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Obsidian Markdown</span>
            </div>

            <div className="showcase-card-body" style={{ padding: "0" }}>
              <pre className="showcase-code-block" style={{ margin: "0", borderRadius: "0", border: "none" }}>
{`# Physics Lecture 01

<span class="code-wikilink">![[Physics_Lecture_01_Assets/audio_recording_1.m4a]]</span>

Today's session covered wave optics and diffraction patterns:

- Double-slit interference equation: d sin(θ) = mλ
- Intensity distribution and fringe spacing

<span class="code-wikilink">![[Physics_Lecture_01_Assets/whiteboard_photo.jpg]]</span>

Assignments for next Monday:
1. Complete problem set 4
2. Prepare lab apparatus for spectrometer test`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
