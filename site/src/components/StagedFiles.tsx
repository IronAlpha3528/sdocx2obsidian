import React, { useRef } from "react";
import { StagedFile } from "../types";
import { formatBytes, MAX_FILES } from "../utils/validation";

interface StagedFilesProps {
  files: StagedFile[];
  onRemoveFile: (id: string) => void;
  onAddMoreFiles: (files: FileList | File[]) => void;
  onClearAll: () => void;
  onStartConversion: () => void;
  error?: string;
}

export const StagedFiles: React.FC<StagedFilesProps> = ({
  files,
  onRemoveFile,
  onAddMoreFiles,
  onClearAll,
  onStartConversion,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const canAddMore = files.length < MAX_FILES;

  return (
    <div>
      <div className="staged-summary">
        <span>
          Staged Notes: <strong>{files.length}</strong> / {MAX_FILES}
        </span>
        <span className="font-mono">
          Total: {formatBytes(totalBytes)} / 100 MB
        </span>
      </div>

      <div className="staged-list" role="list">
        {files.map((file) => (
          <div key={file.id} className="file-row" role="listitem">
            <div className="file-row-left">
              <span className="file-name" title={file.name}>
                {file.name}
              </span>
              {file.isLarge && (
                <span
                  className="status-badge partial"
                  title="Note is ≥ 25 MB. Large file memory advisory applies."
                >
                  &ge;25 MB
                </span>
              )}
            </div>

            <div className="file-row-actions">
              <span className="file-size">{formatBytes(file.size)}</span>
              <button
                type="button"
                className="btn-remove"
                onClick={() => onRemoveFile(file.id)}
                aria-label={`Remove ${file.name}`}
                title="Remove file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            marginBottom: "14px",
            padding: "8px 12px",
            borderRadius: "4px",
            background: "var(--status-unsupported-bg)",
            border: "1px solid var(--status-unsupported-border)",
            color: "var(--status-unsupported-text)",
            fontSize: "0.825rem",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="converter-action-bar">
        <div style={{ display: "flex", gap: "8px" }}>
          {canAddMore && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: "6px 12px", fontSize: "0.825rem" }}
              >
                Add more files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".sdocx"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onAddMoreFiles(e.target.files);
                  }
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                tabIndex={-1}
              />
            </>
          )}

          <button
            type="button"
            className="btn-ghost"
            onClick={onClearAll}
            style={{ padding: "6px 12px", fontSize: "0.825rem" }}
          >
            Clear all
          </button>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={onStartConversion}
        >
          Convert {files.length} {files.length === 1 ? "note" : "notes"}
        </button>
      </div>
    </div>
  );
};
