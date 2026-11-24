import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = "About — sdocx2obsidian";
  }, []);

  const version = "0.1.0";

  return (
    <div className="subpage-container">
      <div className="section-header">
        <h1 className="section-title">About sdocx2obsidian</h1>
        <p className="section-description">
          Open-source developer utility converting Samsung Notes (.sdocx) to Obsidian Markdown vaults.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "28px" }}>
        <div
          style={{
            padding: "18px 20px",
            border: "1px solid var(--border-default)",
            borderRadius: "6px",
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Project Information
            </h2>
            <span className="status-badge planned">v{version}</span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "12px" }}>
            sdocx2obsidian is designed as a focused, client-side utility and portfolio project.
            It provides both a Python command-line interface (CLI) for desktop batch processing and a client-side WebAssembly interface for instant browser conversions.
          </p>
          <div style={{ display: "flex", gap: "14px", fontSize: "0.85rem" }}>
            <a
              href="https://github.com/IronAlpha3528/sdocx2obsidian"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Repository &rarr;
            </a>
            <a
              href="https://github.com/IronAlpha3528/sdocx2obsidian/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              Release Notes &rarr;
            </a>
            <a
              href="https://github.com/IronAlpha3528/sdocx2obsidian/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Issue Tracker &rarr;
            </a>
          </div>
        </div>

        <div
          style={{
            padding: "18px 20px",
            border: "1px solid var(--border-default)",
            borderRadius: "6px",
            background: "var(--bg-surface)",
          }}
        >
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
            Open Source License
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            This software is licensed under the <strong>MIT License</strong>. You are free to use, modify, distribute, and integrate this software in accordance with the terms of the MIT license.
          </p>
        </div>

        <div
          style={{
            padding: "18px 20px",
            border: "1px solid var(--border-default)",
            borderRadius: "6px",
            background: "var(--bg-surface)",
          }}
        >
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
            Disclaimer
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            sdocx2obsidian is an independent open-source project. It is not affiliated with, endorsed by, sponsored by, or associated with Samsung Electronics Co., Ltd. or Dynalist Inc. (Obsidian). All trademarks, service marks, and trade names are the property of their respective owners.
          </p>
        </div>
      </div>

      <div style={{ marginTop: "32px" }}>
        <Link to="/" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
          &larr; Return to Converter
        </Link>
      </div>
    </div>
  );
};
