export type AppState =
  | "idle"
  | "files_selected"
  | "confirming_large_files"
  | "loading_runtime"
  | "converting"
  | "done"
  | "cancelled"
  | "error";

export type FileConversionStatus =
  | "pending"
  | "converting"
  | "converted"
  | "failed";

export interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  isLarge: boolean; // >= 25 MB
  status: FileConversionStatus;
  markdownText?: string;
  markdownName?: string;
  assetCount?: number;
  warnings?: string[];
  errorMessage?: string;
  errorCode?: string;
}

export interface SessionOutcome {
  total: number;
  succeeded: number;
  failed: number;
  zipSize: number;
  zipBlob?: Blob;
}

export type ThemeMode = "dark" | "light";

export interface NoteResultPayload {
  status: "success" | "warning" | "error";
  filename: string;
  conversion_id: string;
  markdown_name: string;
  markdown_text: string;
  asset_count: number;
  warnings: string[];
  error_code?: string;
  message?: string;
}
