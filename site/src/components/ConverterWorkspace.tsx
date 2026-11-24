import React from "react";
import { AppState, StagedFile, SessionOutcome } from "../types";
import { DropZone } from "./DropZone";
import { StagedFiles } from "./StagedFiles";
import { ConvertingProgress } from "./ConvertingProgress";
import { ResultsView } from "./ResultsView";
import { LargeFileModal } from "./LargeFileModal";

interface ConverterWorkspaceProps {
  state: AppState;
  files: StagedFile[];
  validationError?: string;
  currentIndex: number;
  statusText: string;
  outcome: SessionOutcome | null;
  onFilesSelected: (files: FileList | File[]) => void;
  onRemoveFile: (id: string) => void;
  onAddMoreFiles: (files: FileList | File[]) => void;
  onClearAll: () => void;
  onStartConversion: () => void;
  onModalConfirm: () => void;
  onModalCancel: () => void;
  onCancelConversion: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export const ConverterWorkspace: React.FC<ConverterWorkspaceProps> = ({
  state,
  files,
  validationError,
  currentIndex,
  statusText,
  outcome,
  onFilesSelected,
  onRemoveFile,
  onAddMoreFiles,
  onClearAll,
  onStartConversion,
  onModalConfirm,
  onModalCancel,
  onCancelConversion,
  onDownload,
  onReset,
}) => {
  return (
    <section id="converter" className="converter-section" aria-label="Converter Workspace">
      <div className="section-container">
        <div className="converter-card">
          <div className="converter-card-header">
            <h2 className="converter-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-base)" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Converter Workbench
            </h2>
            <span className="converter-status-pill">
              {state === "idle" && "Ready for files"}
              {state === "files_selected" && `${files.length} staged`}
              {(state === "loading_runtime" || state === "converting") && "Processing in browser"}
              {state === "done" && "Conversion complete"}
              {state === "error" && "Action needed"}
            </span>
          </div>

          {state === "idle" && (
            <DropZone onFilesSelected={onFilesSelected} error={validationError} />
          )}

          {state === "files_selected" && (
            <StagedFiles
              files={files}
              onRemoveFile={onRemoveFile}
              onAddMoreFiles={onAddMoreFiles}
              onClearAll={onClearAll}
              onStartConversion={onStartConversion}
              error={validationError}
            />
          )}

          {(state === "loading_runtime" || state === "converting") && (
            <ConvertingProgress
              files={files}
              currentIndex={currentIndex}
              statusText={statusText}
              onCancel={onCancelConversion}
            />
          )}

          {state === "done" && outcome && (
            <ResultsView
              files={files}
              outcome={outcome}
              onDownload={onDownload}
              onReset={onReset}
            />
          )}

          {state === "error" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <h3 style={{ color: "var(--status-error-text)", marginBottom: "12px" }}>
                Conversion Error
              </h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                {validationError || "An unexpected error occurred during conversion."}
              </p>
              <button type="button" className="btn-secondary" onClick={onReset}>
                Try Again
              </button>
            </div>
          )}
        </div>

        {state === "confirming_large_files" && (
          <LargeFileModal
            largeFiles={files.filter((f) => f.isLarge)}
            onConfirm={onModalConfirm}
            onCancel={onModalCancel}
          />
        )}
      </div>
    </section>
  );
};
