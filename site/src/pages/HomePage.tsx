import React, { useEffect } from "react";
import { AppState, StagedFile, SessionOutcome } from "../types";
import { Hero } from "../components/Hero";
import { ConverterWorkspace } from "../components/ConverterWorkspace";

interface HomePageProps {
  state: AppState;
  files: StagedFile[];
  validationError?: string;
  currentIndex: number;
  statusText: string;
  outcome: SessionOutcome | null;
  hasSampleFile?: boolean;
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

export const HomePage: React.FC<HomePageProps> = (props) => {
  useEffect(() => {
    document.title = "sdocx2obsidian — Convert Samsung Notes to Obsidian Markdown";
  }, []);

  return (
    <div className="content-container">
      <Hero />
      <ConverterWorkspace {...props} />
    </div>
  );
};
