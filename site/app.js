import { StateMachine } from "./js/state_machine.js";
import { buildIssueLink } from "./js/issue_link.js";
import { renderPlainText } from "./js/preview.js";
import {
  filterSdocxFiles,
  checkLargeFiles,
  formatBytes,
  MAX_SESSION_FILES,
  MAX_FILE_SIZE_BYTES,
} from "./js/file_utils.js";

// DOM Elements
const viewIdle = document.getElementById("view-idle");
const viewFilesChosen = document.getElementById("view-files-chosen");
const viewConverting = document.getElementById("view-converting");
const viewDone = document.getElementById("view-done");

const dropZone = document.getElementById("drop-zone");
const dropHintText = document.getElementById("drop-hint-text");
const fileInput = document.getElementById("file-input");
const fileInputMore = document.getElementById("file-input-more");
const runtimeLoadingNote = document.getElementById("runtime-loading-note");

const chosenFilesList = document.getElementById("chosen-files-list");
const filesSummaryCount = document.getElementById("files-summary-count");
const filesTotalSize = document.getElementById("files-total-size");
const btnStartConvert = document.getElementById("btn-start-convert");

const progressTrack = document.getElementById("progressbar-track");
const progressBarFill = document.getElementById("progress-bar-fill");
const progressPercent = document.getElementById("progress-percent");
const convertingFilesList = document.getElementById("converting-files-list");
const btnCancel = document.getElementById("btn-cancel");

const btnDownloadZip = document.getElementById("btn-download-zip");
const doneSummaryText = document.getElementById("done-summary-text");
const doneFilesList = document.getElementById("done-files-list");
const btnStartOver = document.getElementById("btn-start-over");

const advisoryModal = document.getElementById("advisory-modal");
const advisoryFilesList = document.getElementById("advisory-files-list");
const btnAdvisoryCancel = document.getElementById("btn-advisory-cancel");
const btnAdvisoryContinue = document.getElementById("btn-advisory-continue");

const previewModal = document.getElementById("preview-modal");
const previewTextBlock = document.getElementById("preview-text-block");
const previewModalTitle = document.getElementById("preview-modal-title");
const btnClosePreview = document.getElementById("btn-close-preview");
const btnCopyPreview = document.getElementById("btn-copy-preview");

const mobileStickyBar = document.getElementById("mobile-sticky-bar");
const btnMobileAction = document.getElementById("btn-mobile-action");
const liveAnnouncer = document.getElementById("live-announcer");

// State
let selectedFiles = [];
let worker = null;
let currentZipUrl = null;
let activeConversionId = 0;
let currentPreviewContent = "";

function announce(message) {
  if (liveAnnouncer) {
    liveAnnouncer.textContent = message;
  }
}

// State Machine & Screen Transitions
const sm = new StateMachine("idle", (newState) => {
  viewIdle.style.display = "none";
  viewFilesChosen.style.display = "none";
  viewConverting.style.display = "none";
  viewDone.style.display = "none";
  mobileStickyBar.style.display = "none";

  if (newState === "idle") {
    viewIdle.style.display = "block";
    selectedFiles = [];
    if (fileInput) fileInput.value = "";
    if (fileInputMore) fileInputMore.value = "";
    announce("Ready to select notes.");
  } else if (newState === "files_selected") {
    viewFilesChosen.style.display = "block";
    renderChosenFiles();
    updateMobileStickyBar("Convert to Markdown", () => onStartConvertClicked());
    announce(`${selectedFiles.length} note(s) selected.`);
  } else if (newState === "loading_runtime" || newState === "converting") {
    viewConverting.style.display = "block";
    renderConvertingFiles();
    announce(newState === "loading_runtime" ? "Preparing converter runtime." : "Converting notes.");
  } else if (newState === "done") {
    viewDone.style.display = "block";
    updateMobileStickyBar("Download ZIP", () => onDownloadZipClicked());
    announce("Conversion complete. Download ZIP is ready.");
  } else if (newState === "cancelled") {
    // Return to files_selected with files kept
    sm.transition("files_selected");
  } else if (newState === "error") {
    viewFilesChosen.style.display = "block";
    updateMobileStickyBar("Convert to Markdown", () => onStartConvertClicked());
  }
});

function updateMobileStickyBar(label, onClick) {
  if (window.innerWidth <= 640) {
    mobileStickyBar.style.display = "block";
    btnMobileAction.textContent = label;
    btnMobileAction.onclick = onClick;
  }
}

window.addEventListener("resize", () => {
  if (sm.state === "files_selected") {
    updateMobileStickyBar("Convert to Markdown", () => onStartConvertClicked());
  } else if (sm.state === "done") {
    updateMobileStickyBar("Download ZIP", () => onDownloadZipClicked());
  } else {
    mobileStickyBar.style.display = "none";
  }
});

function resetSession() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  if (currentZipUrl) {
    URL.revokeObjectURL(currentZipUrl);
    currentZipUrl = null;
  }
}

function initWorker() {
  resetSession();
  worker = new Worker("worker.js");
}

// File Selection & S2 List Management
function addFiles(fileList) {
  const newFiles = filterSdocxFiles(fileList);

  if (newFiles.length === 0) {
    alert("Please select valid Samsung Notes (.sdocx) files.");
    return;
  }

  const combined = [...selectedFiles, ...newFiles];
  if (combined.length > MAX_SESSION_FILES) {
    alert(`Only up to ${MAX_SESSION_FILES} files can be converted at once. The first ${MAX_SESSION_FILES} were kept.`);
    selectedFiles = combined.slice(0, MAX_SESSION_FILES);
  } else {
    selectedFiles = combined;
  }

  sm.transition("files_selected");
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  if (selectedFiles.length === 0) {
    sm.transition("idle");
  } else {
    renderChosenFiles();
  }
}

function renderChosenFiles() {
  chosenFilesList.innerHTML = "";
  let totalBytes = 0;

  selectedFiles.forEach((file, idx) => {
    totalBytes += file.size || 0;
    const row = document.createElement("div");
    row.className = "file-row";
    row.setAttribute("role", "listitem");

    const info = document.createElement("div");
    info.className = "file-info";
    info.innerHTML = `
      <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <span class="file-name" title="${file.name}">${file.name}</span>
      <span class="file-size">${formatBytes(file.size || 0)}</span>
    `;

    const btnRemove = document.createElement("button");
    btnRemove.className = "btn-remove-file";
    btnRemove.setAttribute("aria-label", `Remove ${file.name}`);
    btnRemove.innerHTML = "&times;";
    btnRemove.onclick = () => removeFile(idx);

    row.appendChild(info);
    row.appendChild(btnRemove);
    chosenFilesList.appendChild(row);
  });

  filesSummaryCount.textContent = `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}`;
  filesTotalSize.textContent = `${formatBytes(totalBytes)} total`;
}

// Large File Advisory Confirmation
function onStartConvertClicked() {
  if (selectedFiles.length === 0) return;

  const oversize = selectedFiles.find((f) => (f.size || 0) > MAX_FILE_SIZE_BYTES);
  if (oversize) {
    alert(`File "${oversize.name}" is over 50 MB, which is the limit for this tool.`);
    return;
  }

  const largeCheck = checkLargeFiles(selectedFiles);
  if (largeCheck.hasLarge) {
    showAdvisoryModal(largeCheck.largeFiles);
  } else {
    startConversionProcess();
  }
}

function showAdvisoryModal(largeFiles) {
  advisoryFilesList.innerHTML = "";
  const list = largeFiles.length > 0 ? largeFiles : selectedFiles.map((f) => ({
    name: f.name,
    formattedSize: formatBytes(f.size || 0),
  }));

  for (const item of list) {
    const row = document.createElement("div");
    row.className = "advisory-item";
    row.innerHTML = `
      <span>${item.name}</span>
      <strong>${item.formattedSize}</strong>
    `;
    advisoryFilesList.appendChild(row);
  }

  advisoryModal.style.display = "flex";
}

function hideAdvisoryModal() {
  advisoryModal.style.display = "none";
}

btnAdvisoryCancel?.addEventListener("click", () => {
  hideAdvisoryModal();
  announce("Conversion cancelled.");
});

btnAdvisoryContinue?.addEventListener("click", () => {
  hideAdvisoryModal();
  startConversionProcess();
});

btnStartConvert?.addEventListener("click", onStartConvertClicked);

// S3: Conversion Process
function renderConvertingFiles() {
  convertingFilesList.innerHTML = "";
  progressBarFill.style.width = "0%";
  progressTrack?.setAttribute("aria-valuenow", "0");
  progressPercent.textContent = "0%";

  selectedFiles.forEach((file, idx) => {
    const row = document.createElement("div");
    row.className = "file-row";
    row.id = `converting-row-${idx}`;
    row.setAttribute("role", "listitem");

    row.innerHTML = `
      <div class="file-info">
        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span class="file-name" title="${file.name}">${file.name}</span>
      </div>
      <span class="status-chip waiting" id="status-chip-${idx}">Waiting</span>
    `;
    convertingFilesList.appendChild(row);
  });
}

function startConversionProcess() {
  const thisConversionId = ++activeConversionId;
  sm.transition("loading_runtime");
  initWorker();

  const files = [...selectedFiles];
  const total = files.length;
  let finishedCount = 0;
  let currentFileIdx = 0;
  const results = [];

  worker.onmessage = (e) => {
    if (thisConversionId !== activeConversionId) return;
    const { type, result, zipBytes, error } = e.data;

    if (type === "session_started") {
      sm.transition("converting");
      convertNext();
    } else if (type === "note_result") {
      results.push(result);
      const chip = document.getElementById(`status-chip-${currentFileIdx - 1}`);
      if (chip) {
        if (result.status === "success") {
          chip.className = "status-chip converted";
          chip.textContent = "Converted";
        } else {
          chip.className = "status-chip failed";
          chip.textContent = "Could not convert";
        }
      }

      finishedCount++;
      const pct = Math.round((finishedCount / total) * 100);
      progressBarFill.style.width = `${pct}%`;
      progressTrack?.setAttribute("aria-valuenow", String(pct));
      progressPercent.textContent = `${pct}%`;
      announce(`Processed ${result.filename}: ${result.status}`);

      if (finishedCount < total) {
        convertNext();
      } else {
        worker.postMessage({ type: "finish_session" });
      }
    } else if (type === "session_finished") {
      const blob = new Blob([zipBytes], { type: "application/zip" });
      currentZipUrl = URL.createObjectURL(blob);
      renderDoneResults(results);
      sm.transition("done");
    } else if (type === "error") {
      alert(`Error: ${error}`);
      sm.transition("error");
    }
  };

  worker.onerror = (err) => {
    if (thisConversionId !== activeConversionId) return;
    alert(`Conversion error: ${err.message}`);
    sm.transition("error");
  };

  worker.postMessage({ type: "start_session" });

  async function convertNext() {
    if (currentFileIdx >= files.length) return;
    const idx = currentFileIdx++;
    const file = files[idx];

    const chip = document.getElementById(`status-chip-${idx}`);
    if (chip) {
      chip.className = "status-chip converting";
      chip.textContent = "Converting...";
    }

    const buf = await file.arrayBuffer();
    worker.postMessage(
      {
        type: "convert_note",
        payload: { filename: file.name, data: buf },
      },
      [buf]
    );
  }
}

// S4: Done View Rendering
function renderDoneResults(results) {
  doneFilesList.innerHTML = "";
  const succeeded = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status !== "success").length;

  if (failed === 0) {
    doneSummaryText.textContent = `${succeeded} note${succeeded === 1 ? "" : "s"} converted.`;
  } else {
    doneSummaryText.textContent = `${succeeded} converted, ${failed} failed.`;
  }

  results.forEach((res) => {
    const item = document.createElement("div");
    item.className = "result-item";
    item.setAttribute("role", "listitem");

    const main = document.createElement("div");
    main.className = "result-main";

    const info = document.createElement("div");
    info.className = "file-info";
    info.innerHTML = `
      <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <span class="file-name" title="${res.filename}">${res.filename}</span>
    `;

    const actions = document.createElement("div");
    actions.className = "result-actions";

    const isSuccess = res.status === "success";
    const chip = document.createElement("span");
    chip.className = `status-chip ${isSuccess ? (res.warnings?.length > 0 ? "warning" : "converted") : "failed"}`;
    chip.textContent = isSuccess
      ? (res.warnings?.length > 0 ? "Converted with notes" : "Converted")
      : "Could not convert";
    actions.appendChild(chip);

    if (isSuccess && res.markdown_text) {
      const btnPreview = document.createElement("button");
      btnPreview.className = "btn-text btn-sm";
      btnPreview.textContent = "Preview text";
      btnPreview.onclick = () => openPreviewModal(res.markdown_name, res.markdown_text);
      actions.appendChild(btnPreview);
    } else if (!isSuccess) {
      const issueLink = document.createElement("a");
      issueLink.className = "btn-text btn-sm";
      issueLink.textContent = "Report this problem";
      issueLink.target = "_blank";
      issueLink.rel = "noopener noreferrer";
      issueLink.href = buildIssueLink({
        errorClass: res.error_code || "CONVERSION_ERROR",
        fileSizeBytes: 0,
        browserFamily: navigator.userAgent.split(" ")[0] || "Browser",
      });
      actions.appendChild(issueLink);
    }

    main.appendChild(info);
    main.appendChild(actions);
    item.appendChild(main);

    // Expandable warnings/notes if present
    if (res.warnings && res.warnings.length > 0) {
      const details = document.createElement("details");
      details.className = "result-details";
      details.innerHTML = `
        <summary>View ${res.warnings.length} note details</summary>
        <div class="result-details-content">
          ${res.warnings.map((w) => `<div>&bull; ${w}</div>`).join("")}
        </div>
      `;
      item.appendChild(details);
    } else if (!isSuccess && res.message) {
      const details = document.createElement("div");
      details.className = "result-details";
      details.innerHTML = `<div>${res.message}</div>`;
      item.appendChild(details);
    }

    doneFilesList.appendChild(item);
  });
}

function onDownloadZipClicked() {
  if (!currentZipUrl) return;
  const a = document.createElement("a");
  a.href = currentZipUrl;
  a.download = "SamsungNotes_ObsidianVault.zip";
  a.click();
}

btnDownloadZip?.addEventListener("click", onDownloadZipClicked);

btnStartOver?.addEventListener("click", () => {
  resetSession();
  sm.transition("idle");
});

// Preview Modal
function openPreviewModal(title, text) {
  previewModalTitle.textContent = `Preview: ${title}`;
  currentPreviewContent = text;
  renderPlainText(previewTextBlock, text);
  previewModal.style.display = "flex";
  if (btnCopyPreview) btnCopyPreview.textContent = "Copy text";
}

function closePreviewModal() {
  previewModal.style.display = "none";
  currentPreviewContent = "";
}

btnClosePreview?.addEventListener("click", closePreviewModal);

btnCopyPreview?.addEventListener("click", async () => {
  if (currentPreviewContent) {
    try {
      await navigator.clipboard.writeText(currentPreviewContent);
      btnCopyPreview.textContent = "Copied!";
      setTimeout(() => {
        btnCopyPreview.textContent = "Copy text";
      }, 2000);
    } catch {
      btnCopyPreview.textContent = "Selected";
    }
  }
});

// Drag and Drop
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
  if (dropHintText) dropHintText.textContent = "Release to add files";
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
  if (dropHintText) dropHintText.textContent = "or drop them here";
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  if (dropHintText) dropHintText.textContent = "or drop them here";
  if (e.dataTransfer?.files) {
    addFiles(e.dataTransfer.files);
  }
});

fileInput?.addEventListener("change", (e) => {
  if (e.target?.files) {
    addFiles(e.target.files);
  }
});

fileInputMore?.addEventListener("change", (e) => {
  if (e.target?.files) {
    addFiles(e.target.files);
  }
});

btnCancel?.addEventListener("click", () => {
  activeConversionId++;
  resetSession();
  sm.transition("cancelled");
});

// Keyboard Accessibility & Dismissals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (previewModal && previewModal.style.display !== "none") {
      closePreviewModal();
    }
    if (advisoryModal && advisoryModal.style.display !== "none") {
      hideAdvisoryModal();
    }
  }
});

previewModal?.addEventListener("click", (e) => {
  if (e.target === previewModal) closePreviewModal();
});

advisoryModal?.addEventListener("click", (e) => {
  if (e.target === advisoryModal) hideAdvisoryModal();
});
