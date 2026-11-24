import React, { useState } from "react";
import { StagedFile } from "../types";
import { formatPlainTextPreview } from "../utils/preview";

interface IntegratedPreviewProps {
  files: StagedFile[];
}

export const IntegratedPreview: React.FC<IntegratedPreviewProps> = ({ files }) => {
  const convertedFiles = files.filter((f) => f.status === "converted" && f.markdownText);
  const [selectedId, setSelectedId] = useState<string>(
    convertedFiles[0]?.id || ""
  );
  const [copied, setCopied] = useState(false);

  if (convertedFiles.length === 0) return null;

  const currentFile =
    convertedFiles.find((f) => f.id === selectedId) || convertedFiles[0];

  const handleCopy = async () => {
    if (!currentFile?.markdownText) return;
    try {
      await navigator.clipboard.writeText(currentFile.markdownText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Failed to copy markdown to clipboard:", e);
    }
  };

  return (
    <div className="preview-panel">
      <div className="preview-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {convertedFiles.length > 1 ? (
            <select
              className="preview-select"
              value={currentFile.id}
              onChange={(e) => setSelectedId(e.target.value)}
              aria-label="Select converted note to inspect"
            >
              {convertedFiles.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.markdownName || `${file.name.replace(/\.sdocx$/i, "")}.md`}
                </option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              {currentFile.markdownName || `${currentFile.name.replace(/\.sdocx$/i, "")}.md`}
            </span>
          )}

          {typeof currentFile.assetCount === "number" && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                background: "var(--bg-surface-elevated)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              {currentFile.assetCount} {currentFile.assetCount === 1 ? "asset" : "assets"} preserved
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn-secondary"
          style={{ padding: "4px 10px", fontSize: "0.8rem" }}
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy Markdown"}
        </button>
      </div>

      {/* MD-3: Plain text rendered inside <pre><code> using formatPlainTextPreview */}
      <pre className="preview-content">
        <code>{formatPlainTextPreview(currentFile.markdownText)}</code>
      </pre>
    </div>
  );
};
