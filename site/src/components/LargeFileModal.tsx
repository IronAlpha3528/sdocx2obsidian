import React, { useEffect, useRef } from "react";
import { StagedFile } from "../types";
import { formatBytes } from "../utils/validation";

interface LargeFileModalProps {
  largeFiles: StagedFile[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const LargeFileModal: React.FC<LargeFileModalProps> = ({
  largeFiles,
  onConfirm,
  onCancel,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus confirmation button on mount
    confirmButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="large-file-modal-title"
    >
      <div className="modal-box">
        <div className="modal-header">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--status-partial-text)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2 id="large-file-modal-title" className="modal-title">
            Memory Advisory: Large Notes
          </h2>
        </div>

        <div className="modal-body">
          <p>
            You have selected <strong>{largeFiles.length} note(s)</strong> larger
            than 25 MB:
          </p>
          <ul style={{ margin: "10px 0 10px 20px" }}>
            {largeFiles.map((file) => (
              <li key={file.id}>
                <code>{file.name}</code> ({formatBytes(file.size)})
              </li>
            ))}
          </ul>
          <p>
            Decompressing and parsing large notes with embedded audio or photos
            runs 100% inside your browser memory. On mobile devices with limited RAM,
            this may cause high memory usage or tab crashes.
          </p>
          <p style={{ marginTop: "8px" }}>
            Do you want to proceed with conversion or review your files?
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel / Review Files
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className="btn-primary"
            style={{ width: "auto" }}
            onClick={onConfirm}
          >
            Continue Conversion
          </button>
        </div>
      </div>
    </div>
  );
};
