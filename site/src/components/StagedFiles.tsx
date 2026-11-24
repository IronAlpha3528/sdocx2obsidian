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
      <div className="staged-header">
        <span className="staged-count">
          Staged Notes ({files.length} / {MAX_FILES})
        </span>
        <span className="staged-total-size">
          Total: {formatBytes(totalBytes)} / 100 MB
        </span>
      </div>

      <div className="file-list" role="list">
        {files.map((file) => (
          <div key={file.id} className="file-row" role="listitem">
            <div className="file-info">
              {/* Document Icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-light)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>

              <span className="file-name" title={file.name}>
                {file.name}
              </span>

              {file.isLarge && (
                <span
                  className="status-chip"
                  style={{
                    background: "var(--status-warning-bg)",
                    color: "var(--status-warning-text)",
                    border: "1px solid var(--status-warning-border)",
                    fontSize: "0.7rem",
                    padding: "1px 6px",
                  }}
                  title="Note is ≥ 25 MB. Memory advisory will be displayed."
                >
                  Large (&ge;25MB)
                </span>
              )}
            </div>

            <div className="file-actions">
              <span className="file-size">{formatBytes(file.size)}</span>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => onRemoveFile(file.id)}
                aria-label={`Remove ${file.name} from conversion list`}
                title="Remove note"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "var(--status-error-bg)",
            border: "1px solid var(--status-error-border)",
            color: "var(--status-error-text)",
            fontSize: "0.875rem",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
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
        <button
          type="button"
          className="btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAddMore}
          title={canAddMore ? "Add more .sdocx files" : "5 notes maximum reached"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add More Notes
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={onClearAll}
          style={{ marginLeft: "auto" }}
        >
          Clear All
        </button>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={onStartConversion}
        aria-label={`Convert ${files.length} notes to Obsidian vault`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        Convert {files.length} {files.length === 1 ? "Note" : "Notes"} to Obsidian
      </button>
    </div>
  );
};
