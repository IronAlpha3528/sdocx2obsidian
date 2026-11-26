import React, { useState } from "react";

export const PreviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"media" | "text">("media");

  return (
    <div className="subpage-container">
      <div className="section-header">
        <h1 className="section-title">Obsidian vault preview and syntax</h1>
        <p className="section-description">
          Generated vault directory structure, Wikilink embedding rules, and raw Markdown syntax.
        </p>
      </div>

      <div className="tab-control-group">
        <button
          type="button"
          className={`tab-btn ${activeTab === "media" ? "active" : ""}`}
          onClick={() => setActiveTab("media")}
        >
          Media &amp; Audio Note
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "text" ? "active" : ""}`}
          onClick={() => setActiveTab("text")}
        >
          Text-Only Note
        </button>
      </div>

      <div className="showcase-grid">
        {/* Panel 1: Directory Tree */}
        <div className="showcase-panel">
          <div className="showcase-panel-header">
            <span className="panel-title">Generated Directory</span>
            <span className="panel-tag">Filesystem</span>
          </div>

          <div className="showcase-panel-body">
            <div className="vault-tree">
              <div className="tree-row depth-0">
                <span className="tree-icon">📁</span>
                <span className="tree-name">Obsidian_Vault/</span>
              </div>
              {activeTab === "media" ? (
                <>
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
                    <span className="tree-name">voice_01.m4a</span>
                  </div>
                  <div className="tree-row depth-2">
                    <span className="tree-icon">🖼️</span>
                    <span className="tree-name">board_photo.jpg</span>
                  </div>
                  <div className="tree-row depth-2">
                    <span className="tree-icon">🖼️</span>
                    <span className="tree-name">schematic.png</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="tree-row depth-1">
                    <span className="tree-icon">📄</span>
                    <span className="tree-name">Sprint_Planning.md</span>
                  </div>
                </>
              )}
            </div>

            <div className="showcase-note">
              {activeTab === "media" ? (
                <>
                  Notes with embedded media store files in a dedicated{" "}
                  <code>&lt;NoteName&gt;_Assets/</code> folder at vault root.
                </>
              ) : (
                <>
                  Text-only notes produce a standalone <code>.md</code> file. No empty asset directories are generated.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Panel 2: Markdown File Content */}
        <div className="showcase-panel">
          <div className="showcase-panel-header">
            <span className="panel-title font-mono">
              {activeTab === "media" ? "Physics_01.md" : "Sprint_Planning.md"}
            </span>
            <span className="panel-tag font-mono">Markdown</span>
          </div>

          <div className="showcase-panel-body p-0">
            <pre className="code-editor-block">
              <code>
                {activeTab === "media" ? (
                  <>
                    <span className="code-heading"># Physics 01</span>
                    {"\n\n"}
                    <span className="code-wikilink">![[Physics_01_Assets/voice_01.m4a]]</span>
                    {"\n\n"}
                    {"Lecture summary: electromagnetic radiation and boundary values.\n\n"}
                    {"1. Maxwell equations review\n"}
                    {"2. Free space wave impedance (Z₀ ≈ 377 Ω)\n\n"}
                    <span className="code-wikilink">![[Physics_01_Assets/board_photo.jpg]]</span>
                    {"\n\n"}
                    {"Apparatus schematic for Thursday lab:\n\n"}
                    <span className="code-wikilink">![[Physics_01_Assets/schematic.png]]</span>
                    {"\n\n"}
                    {"Assignment: Problem set 4 due next week."}
                  </>
                ) : (
                  <>
                    <span className="code-heading"># Sprint Planning</span>
                    {"\n\n"}
                    {"Discussion notes for migration milestones:\n\n"}
                    <span className="code-heading">## Goals</span>
                    {"\n"}
                    {"- Complete client-side Pyodide integration\n"}
                    {"- Validate memory limits on mobile viewports\n\n"}
                    <span className="code-heading">## Action Items</span>
                    {"\n"}
                    {"- [ ] Test 50MB note boundary condition\n"}
                    {"- [ ] Verify deterministic ZIP timestamps\n"}
                    {"- [ ] Run automated coverage checks"}
                  </>
                )}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
