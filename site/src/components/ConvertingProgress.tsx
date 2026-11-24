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
    <div className="progress-card">
      <div className="progress-header">
        <span className="progress-ticker">{statusText}</span>
        <span className="progress-percent">{progressPercent}%</span>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="file-list" style={{ marginTop: "16px" }}>
        {files.map((file, idx) => {
          let chipClass = "waiting";
          let chipLabel = "Waiting";

          if (file.status === "converting" || idx === currentIndex) {
            chipClass = "converting";
            chipLabel = "Converting...";
          } else if (file.status === "converted") {
            chipClass = "converted";
            chipLabel = "Converted";
          } else if (file.status === "failed") {
            chipClass = "failed";
            chipLabel = "Failed";
          }

          return (
            <div key={file.id} className="file-row">
              <div className="file-info">
                <span className="file-name" title={file.name}>
                  {file.name}
                </span>
                <span className="file-size">({formatBytes(file.size)})</span>
              </div>
              <span className={`status-chip ${chipClass}`}>{chipLabel}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          style={{ width: "auto", minWidth: "180px" }}
        >
          Cancel Conversion
        </button>
      </div>
    </div>
  );
};
