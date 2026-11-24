import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export const PrivacyPage: React.FC = () => {
  useEffect(() => {
    document.title = "Privacy Policy — sdocx2obsidian";
  }, []);

  return (
    <div className="subpage-container">
      <div className="section-header">
        <h1 className="section-title">Privacy Policy</h1>
        <p className="section-description">
          How sdocx2obsidian handles your notes, runtime assets, and local data.
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
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
            100% In-Browser Local Processing
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            Your Samsung Notes (<code>.sdocx</code>) files, embedded photos, voice recordings, and generated Markdown
            notes are processed entirely in your web browser using WebAssembly (Pyodide v0.26.4 running in a background Web Worker).
            <strong> Your files are never uploaded to any remote server or cloud API.</strong> Closing or refreshing the tab clears all conversion memory immediately.
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
            Local Runtime Assets (No CDN)
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            The WebAssembly binary, Python standard library, and conversion wheel are self-hosted on the same origin under <code>/vendor/</code>.
            The application does not depend on third-party runtime CDNs to execute conversions.
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
            Content-Free Issue Diagnostics (MD-6 Standard)
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            If a corrupted or unsupported file fails conversion, an optional &quot;Report issue&quot; link can be opened.
            To protect your privacy, generated issue URLs encode only anonymous technical metadata: tool version, error class code, coarse file-size bucket (e.g. <code>10-25MB</code>), and browser user agent.
            <strong> Note titles, filenames, and note contents are never included in error links.</strong>
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
            Analytics &amp; Cookies
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            This site uses no tracking cookies or advertising pixels. If Cloudflare Web Analytics is enabled by the site operator,
            it collects only privacy-preserving, cookie-less pageview metrics without personal identifiers.
            Local storage is used strictly to remember your preferred visual theme (dark or light mode).
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
