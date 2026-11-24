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
    <div className="integrated-preview-panel">
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
            <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {currentFile.markdownName || `${currentFile.name.replace(/\.sdocx$/i, "")}.md`}
            </span>
          )}

          {typeof currentFile.assetCount === "number" && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {currentFile.assetCount} {currentFile.assetCount === 1 ? "asset" : "assets"}
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "3px 8px", fontSize: "0.775rem" }}
          onClick={handleCopy}
        >
          {copied ? "Copied" : "Copy Markdown"}
        </button>
      </div>

      {/* MD-3: Plain text rendered inside <pre><code> using formatPlainTextPreview */}
      <pre className="preview-pre">
        <code>{formatPlainTextPreview(currentFile.markdownText)}</code>
      </pre>
    </div>
  );
};
