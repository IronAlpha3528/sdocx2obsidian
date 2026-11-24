import React from "react";
import { AppState, StagedFile, SessionOutcome } from "../types";
import { Hero } from "../components/Hero";
import { ConverterWorkspace } from "../components/ConverterWorkspace";
import { Features } from "../components/Features";
import { HowItWorks } from "../components/HowItWorks";
import { PreviewShowcase } from "../components/PreviewShowcase";
import { Limitations } from "../components/Limitations";
import { FinalCTA } from "../components/FinalCTA";

interface HomePageProps {
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

export const HomePage: React.FC<HomePageProps> = (props) => {
  return (
    <>
      <Hero />
      <ConverterWorkspace {...props} />
      <Features />
      <HowItWorks />
      <PreviewShowcase />
      <Limitations />
      <FinalCTA />
    </>
  );
};
