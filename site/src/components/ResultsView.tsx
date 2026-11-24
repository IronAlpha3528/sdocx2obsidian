import React from "react";
import { StagedFile, SessionOutcome } from "../types";
import { formatBytes } from "../utils/validation";
import { buildIssueLink } from "../utils/issueLink";
import { IntegratedPreview } from "./IntegratedPreview";

interface ResultsViewProps {
  files: StagedFile[];
  outcome: SessionOutcome;
  onDownload: () => void;
  onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  files,
  outcome,
  onDownload,
  onReset,
}) => {
  const allSucceeded = outcome.failed === 0;
  const anySucceeded = outcome.succeeded > 0;

  return (
    <div>
      <div
        className="results-summary"
        style={{
          background: allSucceeded ? "var(--status-success-bg)" : "var(--status-warning-bg)",
          borderColor: allSucceeded ? "var(--status-success-border)" : "var(--status-warning-border)",
          color: allSucceeded ? "var(--status-success-text)" : "var(--status-warning-text)",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {allSucceeded ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          )}
        </svg>
        <span>
          {allSucceeded
            ? `All ${outcome.succeeded} ${outcome.succeeded === 1 ? "note" : "notes"} converted successfully!`
            : `${outcome.succeeded} converted, ${outcome.failed} failed. Review details below.`}
        </span>
      </div>

      {anySucceeded && (
        <div style={{ marginBottom: "20px" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onDownload}
            aria-label="Download generated Obsidian vault ZIP file"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Obsidian Vault (.zip) — {formatBytes(outcome.zipSize)}
          </button>
        </div>
      )}

      {/* Note Outcomes Table */}
      <div className="file-list" style={{ marginBottom: "20px" }}>
        {files.map((file) => (
          <div key={file.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div className="file-row">
              <div className="file-info">
                <span className="file-name" title={file.name}>
                  {file.name}
                </span>
                <span className="file-size">({formatBytes(file.size)})</span>
              </div>

              <div className="file-actions">
                <span
                  className={`status-chip ${file.status === "converted" ? "converted" : "failed"}`}
                >
                  {file.status === "converted" ? "Converted" : "Failed"}
                </span>

                {file.status === "failed" && (
                  <a
                    href={buildIssueLink({
                      errorClass: file.errorCode || "CONVERSION_ERROR",
                      fileSizeBytes: file.size,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{
                      padding: "2px 8px",
                      fontSize: "0.75rem",
                      color: "var(--status-error-text)",
                      borderColor: "var(--status-error-border)",
                      textDecoration: "none",
                    }}
                  >
                    Report Issue
                  </a>
                )}
              </div>
            </div>

            {file.errorMessage && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--status-error-text)",
                  padding: "0 8px 4px",
                }}
              >
                Error: {file.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button type="button" className="btn-secondary" onClick={onReset}>
          Convert More Notes
        </button>
      </div>

      {/* Integrated Markdown Inspection Panel */}
      {anySucceeded && <IntegratedPreview files={files} />}
    </div>
  );
};
