import React, { useState, useRef } from "react";

interface DropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  error?: string;
  hasSampleFile?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  error,
  hasSampleFile,
}) => {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div
        className={`dropzone-box ${isDragOver ? "drag-over" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
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

        <div className="dropzone-title">Drop .sdocx notes here, or click to browse</div>
        <p className="dropzone-subtext">Select files directly from your computer or phone</p>
        <div className="dropzone-limits">
          Max 5 notes per batch · 50 MB per file · 100 MB session limit · .sdocx only
        </div>

        {hasSampleFile && (
          <div style={{ marginTop: "12px" }}>
            <a
              href="/sample.sdocx"
              download="sample.sdocx"
              className="btn-ghost"
              style={{ fontSize: "0.775rem", padding: "2px 8px", textDecoration: "underline" }}
              onClick={(e) => e.stopPropagation()}
            >
              Download sample file (.sdocx)
            </a>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: "12px",
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
    </div>
  );
};
