import { StateMachine } from "./js/state_machine.js";
import { buildIssueLink } from "./js/issue_link.js";
import { renderPlainText } from "./js/preview.js";

// DOM Elements
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const conversionPanel = document.getElementById("conversion-panel");
const statusLabel = document.getElementById("status-label");
const progressText = document.getElementById("progress-text");
const progressBar = document.getElementById("progress-bar");
const progressBarAria = document.getElementById("progressbar-aria");
const btnCancel = document.getElementById("btn-cancel");
const btnDownload = document.getElementById("btn-download");
const resultsCard = document.getElementById("results-card");
const resultsList = document.getElementById("results-list");
const previewModal = document.getElementById("preview-modal");
const previewText = document.getElementById("preview-text");
const modalTitle = document.getElementById("modal-title");
const btnCloseModal = document.getElementById("btn-close-modal");
const liveAnnouncer = document.getElementById("live-announcer");

let worker = null;
let currentZipUrl = null;
let activeConversionId = 0;

function announce(message) {
  if (liveAnnouncer) {
    liveAnnouncer.textContent = message;
  }
}

const sm = new StateMachine("idle", (newState) => {
  if (newState === "idle") {
    conversionPanel.style.display = "none";
    btnCancel.style.display = "inline-block";
    btnDownload.style.display = "none";
    progressBar.style.width = "0%";
    progressBarAria?.setAttribute("aria-valuenow", "0");
  } else if (newState === "loading_runtime") {
    conversionPanel.style.display = "block";
    statusLabel.textContent = "Loading WebAssembly Python runtime...";
    btnCancel.style.display = "inline-block";
    btnDownload.style.display = "none";
    announce("Loading WebAssembly Python runtime");
  } else if (newState === "converting") {
    statusLabel.textContent = "Converting notes...";
    btnCancel.style.display = "inline-block";
    btnDownload.style.display = "none";
  } else if (newState === "done") {
    statusLabel.textContent = "Conversion Complete!";
    btnCancel.style.display = "none";
    btnDownload.style.display = "inline-block";
    progressBar.style.width = "100%";
    progressBarAria?.setAttribute("aria-valuenow", "100");
    announce("Conversion complete. Download button is ready.");
  } else if (newState === "cancelled") {
    statusLabel.textContent = "Conversion cancelled.";
    btnCancel.style.display = "none";
    announce("Conversion was cancelled.");
  } else if (newState === "error") {
    statusLabel.textContent = "Error occurred during conversion.";
    btnCancel.style.display = "none";
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

function handleFiles(fileList) {
  const files = Array.from(fileList).filter((f) =>
    f.name.toLowerCase().endsWith(".sdocx")
  );

  if (files.length === 0) {
    alert("Please select or drop valid Samsung Notes (.sdocx) files.");
    return;
  }

  const thisConversionId = ++activeConversionId;
  resultsList.innerHTML = "";
  resultsCard.style.display = "block";
  sm.transition("loading_runtime");
  initWorker();

  let finishedCount = 0;
  const total = files.length;
  progressText.textContent = `0 / ${total}`;

  worker.onmessage = (e) => {
    if (thisConversionId !== activeConversionId) return;
    const { type, result, zipBytes, outcome, error } = e.data;

    if (type === "session_started") {
      sm.transition("converting");
      convertNext();
    } else if (type === "note_result") {
      finishedCount++;
      const pct = Math.round((finishedCount / total) * 100);
      progressBar.style.width = `${pct}%`;
      progressBarAria?.setAttribute("aria-valuenow", String(pct));
      progressText.textContent = `${finishedCount} / ${total}`;

      appendNoteResult(result);
      announce(`Processed ${result.filename}: ${result.status}`);

      if (finishedCount < total) {
        convertNext();
      } else {
        statusLabel.textContent = "Packaging vault ZIP...";
        worker.postMessage({ type: "finish_session" });
      }
    } else if (type === "session_finished") {
      const blob = new Blob([zipBytes], { type: "application/zip" });
      currentZipUrl = URL.createObjectURL(blob);
      btnDownload.onclick = () => {
        const a = document.createElement("a");
        a.href = currentZipUrl;
        a.download = "SamsungNotes_ObsidianVault.zip";
        a.click();
      };
      sm.transition("done");
    } else if (type === "error") {
      alert(`Runtime error: ${error}`);
      sm.transition("error");
    }
  };

  worker.onerror = (err) => {
    if (thisConversionId !== activeConversionId) return;
    alert(`Worker failed: ${err.message}`);
    sm.transition("error");
  };

  worker.postMessage({ type: "start_session" });

  let fileIndex = 0;
  async function convertNext() {
    if (fileIndex >= files.length) return;
    const file = files[fileIndex++];
    statusLabel.textContent = `Converting ${file.name}...`;
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

function appendNoteResult(result) {
  const card = document.createElement("div");
  card.className = `note-item ${result.status === "success" ? "success" : "failed"}`;

  const infoCol = document.createElement("div");
  const title = document.createElement("div");
  title.className = "note-title";
  title.textContent = result.filename;
  infoCol.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "note-meta";

  if (result.status === "success") {
    meta.textContent = `✓ Converted to ${result.markdown_name} (${result.asset_count} asset(s))`;
  } else {
    meta.textContent = `✗ ${result.message || "Failed to convert note"}`;
  }
  infoCol.appendChild(meta);
  card.appendChild(infoCol);

  const actionsCol = document.createElement("div");
  actionsCol.className = "note-actions";

  if (result.status === "success" && result.markdown_text) {
    const btnPreview = document.createElement("button");
    btnPreview.className = "btn-sm";
    btnPreview.textContent = "Preview";
    btnPreview.onclick = () => {
      modalTitle.textContent = `Preview: ${result.markdown_name}`;
      renderPlainText(previewText, result.markdown_text);
      previewModal.style.display = "flex";
    };
    actionsCol.appendChild(btnPreview);
  } else if (result.status === "failed") {
    const issueLink = document.createElement("a");
    issueLink.className = "btn-sm";
    issueLink.textContent = "Report Issue";
    issueLink.target = "_blank";
    issueLink.rel = "noopener noreferrer";
    issueLink.href = buildIssueLink({
      errorClass: result.error_code || "CONVERSION_ERROR",
      fileSizeBytes: 0,
      browserFamily: navigator.userAgent.split(" ")[0] || "Browser",
    });
    actionsCol.appendChild(issueLink);
  }

  card.appendChild(actionsCol);
  resultsList.appendChild(card);
}

// Drag & Drop Listeners
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  if (e.dataTransfer?.files) {
    handleFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target?.files) {
    handleFiles(e.target.files);
  }
});

btnCancel.addEventListener("click", () => {
  activeConversionId++;
  resetSession();
  sm.transition("cancelled");
});

btnCloseModal.addEventListener("click", () => {
  previewModal.style.display = "none";
});

previewModal.addEventListener("click", (e) => {
  if (e.target === previewModal) {
    previewModal.style.display = "none";
  }
});
