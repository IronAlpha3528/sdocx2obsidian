import React from "react";
import { StagedFile } from "../types";
import { formatBytes } from "../utils/validation";

interface ConvertingProgressProps {
  files: StagedFile[];
  currentIndex: number;
  statusText: string;
  onCancel: () => void;
}

export const ConvertingProgress: React.FC<ConvertingProgressProps> = ({
  files,
  currentIndex,
  statusText,
  onCancel,
}) => {
  const total = files.length;
  const progressPercent = total === 0 ? 0 : Math.round((currentIndex / total) * 100);

  return (
    <div className="progress-container">
      <div className="progress-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.825rem" }}>
            {statusText}
          </span>
        </div>
        <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>
          {progressPercent}%
        </span>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="staged-list" style={{ marginTop: "12px", marginBottom: "16px" }}>
        {files.map((file, idx) => {
          let statusLabel = "Waiting";
          let badgeClass = "planned";

          if (file.status === "converting" || idx === currentIndex) {
            statusLabel = "Converting...";
            badgeClass = "partial";
          } else if (file.status === "converted") {
            statusLabel = "Converted";
            badgeClass = "supported";
          } else if (file.status === "failed") {
            statusLabel = "Failed";
            badgeClass = "unsupported";
          }

          return (
            <div key={file.id} className="file-row">
              <div className="file-row-left">
                <span className="file-name" title={file.name}>
                  {file.name}
                </span>
                <span className="file-size">({formatBytes(file.size)})</span>
              </div>
              <span className={`status-badge ${badgeClass}`}>{statusLabel}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          style={{ padding: "6px 14px", fontSize: "0.825rem" }}
        >
          Cancel conversion
        </button>
      </div>
    </div>
  );
};
