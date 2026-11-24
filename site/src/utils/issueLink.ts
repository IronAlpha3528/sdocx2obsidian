export function getCoarseSizeBucket(bytes: number): string {
  if (bytes < 1024 * 1024) return "< 1 MB";
  if (bytes <= 10 * 1024 * 1024) return "1 - 10 MB";
  if (bytes <= 50 * 1024 * 1024) return "10 - 50 MB";
  return "> 50 MB";
}

export interface IssueLinkOptions {
  repoUrl?: string;
  errorClass?: string;
  fileSizeBytes?: number;
  browserFamily?: string;
  toolVersion?: string;
  runtimeVersion?: string;
}

export function buildIssueLink({
  repoUrl = "https://github.com/IronAlpha3528/sdocx2obsidian",
  errorClass = "UNEXPECTED_ERROR",
  fileSizeBytes = 0,
  browserFamily = typeof navigator !== "undefined" ? navigator.userAgent.split(" ")[0] : "Browser",
  toolVersion = "0.1.0",
  runtimeVersion = "Pyodide 0.26.4",
}: IssueLinkOptions = {}): string {
  const bucket = getCoarseSizeBucket(fileSizeBytes);
  const title = `Web Conversion Error: ${errorClass}`;
  const body = [
    "### Conversion Error Report",
    "",
    "- **Tool Version:** " + toolVersion,
    "- **Runtime Version:** " + runtimeVersion,
    "- **Error Code:** " + errorClass,
    "- **File Size Bucket:** " + bucket,
    "- **Browser:** " + browserFamily,
    "",
    "> Note: No personal information, note titles, file names, or contents are included in this report.",
    "",
    "### Description / Context",
    "(Please describe what happened, e.g. whether the note had images, audio, or was created on a specific Samsung device.)",
  ].join("\n");

  const params = new URLSearchParams();
  params.set("title", title);
  params.set("body", body);

  return `${repoUrl.replace(/\/+$/, "")}/issues/new?${params.toString()}`;
}
