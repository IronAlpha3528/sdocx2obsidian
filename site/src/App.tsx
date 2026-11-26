import React, { useState, useRef, useCallback, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AppState, StagedFile, SessionOutcome } from "./types";
import { SITE_URL, getRouteMeta } from "./seo-config";
import { validateFiles } from "./utils/validation";
import { useTheme } from "./hooks/useTheme";
import { useConversionWorker } from "./hooks/useConversionWorker";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./pages/HomePage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { PreviewPage } from "./pages/PreviewPage";
import { LimitationsPage } from "./pages/LimitationsPage";
import { FAQPage } from "./pages/FAQPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { AboutPage } from "./pages/AboutPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const App: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const worker = useConversionWorker();

  const [state, setState] = useState<AppState>("idle");
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [isUnsupportedBrowser, setIsUnsupportedBrowser] = useState(false);

  const isAbortedRef = useRef(false);

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
  }, []);

  useEffect(() => {
    document.title = getRouteMeta(location.pathname).title;
  }, [location.pathname]);

  // Environment checks on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const unsupported = !window.WebAssembly || typeof Worker === "undefined";
      setIsUnsupportedBrowser(unsupported);

      // Optional Cloudflare Web Analytics beacon
      const cfToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN;
      if (cfToken && !document.getElementById("cf-analytics-beacon")) {
        const script = document.createElement("script");
        script.id = "cf-analytics-beacon";
        script.defer = true;
        script.src = "https://static.cloudflareinsights.com/beacon.min.js";
        script.setAttribute("data-cf-beacon", JSON.stringify({ token: cfToken }));
        document.head.appendChild(script);
      }
    }
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

          if (result.status === "failed") {
            current.status = "failed";
            let rawMsg = result.message || "Failed to parse note";
            const lowerMsg = rawMsg.toLowerCase();
            if (lowerMsg.includes("encrypt") || lowerMsg.includes("password") || lowerMsg.includes("locked")) {
              rawMsg = "Note appears password-protected or Knox-encrypted. Next step: Unlock note in Samsung Notes before re-exporting.";
            } else if (lowerMsg.includes("corrupt") || lowerMsg.includes("bad zip") || lowerMsg.includes("invalid header")) {
              rawMsg = "Archive appears corrupted or truncated. Next step: Re-export the note from Samsung Notes.";
            }
            current.errorMessage = rawMsg;
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
          const errText = noteErr instanceof Error ? noteErr.message : "Note conversion exception";
          current.errorMessage = `${errText}. Next step: Verify file is undamaged or report an issue on GitHub.`;
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
        const rawErr = sessionErr instanceof Error ? sessionErr.message : "Runtime failure";
        setValidationError(
          `Failed to initialize or execute WebAssembly runtime (${rawErr}). Next step: Ensure your browser allows WebAssembly and Web Workers, disable conflicting content blockers, and reload the page.`
        );
        announce("A runtime conversion error occurred.");
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

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "sdocx2obsidian",
    url: `${SITE_URL}/`,
    description: "Convert Samsung Notes (.sdocx) to Obsidian Markdown vaults with Wikilink embeds and local in-browser WebAssembly processing.",
    applicationCategory: "UtilityApplication",
    operatingSystem: "All modern web browsers",
    browserRequirements: "Requires WebAssembly and Web Worker support",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <ErrorBoundary>
      <div className="site-wrapper">
        <ScrollToTop />

        {/* Home JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />

        {/* Visually hidden screen reader announcer */}
        <div id="a11y-announcer" className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        <Navbar theme={theme} onToggleTheme={toggleTheme} />

        {isUnsupportedBrowser && (
          <div
            style={{
              padding: "10px 16px",
              background: "var(--status-unsupported-bg)",
              borderBottom: "1px solid var(--status-unsupported-border)",
              color: "var(--status-unsupported-text)",
              fontSize: "0.85rem",
              textAlign: "center",
            }}
            role="alert"
          >
            Notice: Your browser does not support WebAssembly or background Web Workers. A modern browser (Chrome, Edge, Firefox, or Safari) is required for in-browser conversion.
          </div>
        )}

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
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};
