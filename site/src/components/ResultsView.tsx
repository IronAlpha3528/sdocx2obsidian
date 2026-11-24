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
    <div className="results-container">
      <div className={`results-banner ${allSucceeded ? "success" : "partial"}`}>
        <span>
          {allSucceeded
            ? `All ${outcome.succeeded} ${outcome.succeeded === 1 ? "note" : "notes"} converted successfully.`
            : `${outcome.succeeded} converted, ${outcome.failed} failed.`}
        </span>
      </div>

      {anySucceeded && (
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onDownload}
            aria-label="Download Obsidian vault archive"
          >
            Download Obsidian Vault (.zip) — {formatBytes(outcome.zipSize)}
          </button>
        </div>
      )}

      {/* Note Outcomes List */}
      <div className="staged-list" style={{ marginBottom: "16px" }}>
        {files.map((file) => (
          <div key={file.id} className="file-row">
            <div className="file-row-left">
              <span className="file-name" title={file.name}>
                {file.name}
              </span>
              <span className="file-size">({formatBytes(file.size)})</span>
            </div>

            <div className="file-row-actions">
              <span
                className={`status-badge ${file.status === "converted" ? "supported" : "unsupported"}`}
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
                  className="btn-ghost"
                  style={{ fontSize: "0.775rem", padding: "2px 6px" }}
                >
                  Report issue
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic preview of converted files */}
      <IntegratedPreview files={files} />

      <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onReset}
          style={{ padding: "6px 14px", fontSize: "0.825rem" }}
        >
          Convert more notes
        </button>
      </div>
    </div>
  );
};
