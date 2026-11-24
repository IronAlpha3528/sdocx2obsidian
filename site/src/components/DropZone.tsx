import React, { useState, useRef } from "react";

interface DropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  error?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, error }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
    // Reset so same file can be chosen again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div
        className={`dropzone-container ${isDragOver ? "drag-over" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
        aria-label="Select or drop Samsung Notes (.sdocx) files"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".sdocx"
          multiple
          className="sr-only"
          onChange={handleInputChange}
          tabIndex={-1}
        />

        <svg
          className="dropzone-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <div>
          <h2 className="dropzone-title">Select Samsung Notes (.sdocx) files</h2>
          <p className="dropzone-subtext" style={{ marginTop: "4px" }}>
            or drag & drop them directly into this area
          </p>
        </div>

        <p className="dropzone-subtext">
          Max 5 notes per batch · Up to 50 MB each · 100 MB session limit
        </p>
      </div>

      {error && (
        <div
          style={{
            marginTop: "16px",
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
    </div>
  );
};
