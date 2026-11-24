import React, { useState, useRef, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppState, StagedFile, SessionOutcome } from "./types";
import { validateFiles } from "./utils/validation";
import { useTheme } from "./hooks/useTheme";
import { useConversionWorker } from "./hooks/useConversionWorker";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { HomePage } from "./pages/HomePage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { PreviewPage } from "./pages/PreviewPage";
import { LimitationsPage } from "./pages/LimitationsPage";

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const worker = useConversionWorker();

  const [state, setState] = useState<AppState>("idle");
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const isAbortedRef = useRef(false);

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
  }, []);

  const handleFilesSelected = (incoming: FileList | File[]) => {
    setValidationError(undefined);
    const { valid, error } = validateFiles(incoming, files);
    if (error) {
      setValidationError(error);
      announce(error);
    }
    if (valid.length > 0) {
      const updated = [...files, ...valid];
      setFiles(updated);
      setState("files_selected");
      announce(`${valid.length} notes staged. Ready to convert.`);
    }
  };

  const handleRemoveFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    if (updated.length === 0) {
      setState("idle");
      announce("All files cleared.");
    } else {
      announce("File removed.");
    }
  };

  const handleClearAll = () => {
    setFiles([]);
    setValidationError(undefined);
    setState("idle");
    announce("Staging cleared.");
  };

  const handleAddMoreFiles = (incoming: FileList | File[]) => {
    setValidationError(undefined);
    const { valid, error } = validateFiles(incoming, files);
    if (error) {
      setValidationError(error);
      announce(error);
    }
    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
      announce(`${valid.length} more notes added.`);
    }
  };

  const executeConversion = async () => {
    isAbortedRef.current = false;
    setState("loading_runtime");
    setStatusText("Loading Python WebAssembly runtime...");
    announce("Loading conversion engine...");

    try {
      await worker.initRuntime();
      if (isAbortedRef.current) return;

      await worker.startSession();
      if (isAbortedRef.current) return;

      setState("converting");
      announce(`Converting ${files.length} notes...`);

      const updatedFiles = [...files];

      for (let i = 0; i < updatedFiles.length; i++) {
        if (isAbortedRef.current) return;

        setCurrentIndex(i);
        const current = updatedFiles[i];
        setStatusText(`Converting note ${i + 1} of ${updatedFiles.length}: ${current.name}...`);

        current.status = "converting";
        setFiles([...updatedFiles]);

        try {
          const buf = await current.file.arrayBuffer();
          const result = await worker.convertNote(current.name, buf);

          if (result.status === "error") {
            current.status = "failed";
            current.errorMessage = result.message || "Failed to parse note";
            current.errorCode = result.error_code || "CONVERSION_ERROR";
          } else {
            current.status = "converted";
            current.markdownText = result.markdown_text;
            current.markdownName = result.markdown_name;
            current.assetCount = result.asset_count;
            current.warnings = result.warnings;
          }
        } catch (noteErr: unknown) {
          current.status = "failed";
          current.errorMessage =
            noteErr instanceof Error ? noteErr.message : "Note conversion exception";
          current.errorCode = "PROCESSING_EXCEPTION";
        }

        setFiles([...updatedFiles]);
      }

      if (isAbortedRef.current) return;

      setStatusText("Finalizing Obsidian vault (.zip)...");
      setCurrentIndex(updatedFiles.length);

      const sessionOutcome = await worker.finishSession();
      setOutcome(sessionOutcome);
      setState("done");
      announce(
        `Conversion complete. ${sessionOutcome.succeeded} notes converted, ${sessionOutcome.failed} failed. Vault is ready to download.`
      );
    } catch (sessionErr: unknown) {
      console.error("Session failure:", sessionErr);
      if (!isAbortedRef.current) {
        setState("error");
        setValidationError(
          sessionErr instanceof Error ? sessionErr.message : "Fatal conversion failure"
        );
        announce("A fatal conversion error occurred.");
      }
    }
  };

  const handleStartConversion = () => {
    const hasLarge = files.some((f) => f.isLarge);
    if (hasLarge) {
      setState("confirming_large_files");
    } else {
      executeConversion();
    }
  };

  const handleModalConfirm = () => {
    executeConversion();
  };

  const handleModalCancel = () => {
    setState("files_selected");
  };

  const handleCancelConversion = async () => {
    isAbortedRef.current = true;
    try {
      await worker.abortSession();
    } catch (e) {
      console.warn("Error aborting session:", e);
    }
    setState("files_selected");
    setStatusText("");
    announce("Conversion cancelled. Files remain staged.");
  };

  const handleDownload = () => {
    if (!outcome?.zipBlob) return;
    const url = URL.createObjectURL(outcome.zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "obsidian_vault.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    announce("Downloading obsidian_vault.zip.");
  };

  const handleReset = () => {
    setFiles([]);
    setOutcome(null);
    setValidationError(undefined);
    setCurrentIndex(0);
    setStatusText("");
    setState("idle");
    announce("Reset. Ready for new notes.");
  };

  return (
    <div className="site-wrapper">
      <ScrollToTop />

      {/* Visually hidden screen reader announcer */}
      <div id="a11y-announcer" className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                state={state}
                files={files}
                validationError={validationError}
                currentIndex={currentIndex}
                statusText={statusText}
                outcome={outcome}
                onFilesSelected={handleFilesSelected}
                onRemoveFile={handleRemoveFile}
                onAddMoreFiles={handleAddMoreFiles}
                onClearAll={handleClearAll}
                onStartConversion={handleStartConversion}
                onModalConfirm={handleModalConfirm}
                onModalCancel={handleModalCancel}
                onCancelConversion={handleCancelConversion}
                onDownload={handleDownload}
                onReset={handleReset}
              />
            }
          />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="/limitations" element={<LimitationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};
