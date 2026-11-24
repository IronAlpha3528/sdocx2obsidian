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
    <section id="converter" aria-label="Converter Workspace">
      <div className="converter-container">
        <div className="converter-header">
          <span className="converter-heading">Converter Workbench</span>
          <span className="converter-pill">
            {state === "idle" && "Ready for files"}
            {state === "files_selected" && `${files.length} staged`}
            {(state === "loading_runtime" || state === "converting") && "Processing in browser"}
            {state === "done" && "Conversion complete"}
            {state === "error" && "Error"}
          </span>
        </div>

        <div className="converter-body">
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
            <div>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "4px",
                  background: "var(--status-unsupported-bg)",
                  border: "1px solid var(--status-unsupported-border)",
                  color: "var(--status-unsupported-text)",
                  fontSize: "0.875rem",
                  marginBottom: "14px",
                }}
              >
                {validationError || "A conversion error occurred."}
              </div>
              <button type="button" className="btn-secondary" onClick={onReset}>
                Reset and try again
              </button>
            </div>
          )}
        </div>
      </div>

      {state === "confirming_large_files" && (
        <LargeFileModal
          largeFiles={files.filter((f) => f.isLarge)}
          onConfirm={onModalConfirm}
          onCancel={onModalCancel}
        />
      )}
    </section>
  );
};
