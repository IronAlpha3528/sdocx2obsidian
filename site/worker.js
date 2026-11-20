/**
 * Web Worker for sdocx2obsidian in-browser conversion.
 * Runs Pyodide v0.26.4 and sdocx2obsidian wheel entirely client-side.
 */

/* global importScripts, loadPyodide */

let pyodide = null;
let session = null;

async function initRuntime() {
  if (pyodide) return;
  importScripts("vendor/pyodide/pyodide.js");
  pyodide = await loadPyodide({
    indexURL: "vendor/pyodide/",
  });

  // Fetch local wheel and extract directly into site-packages
  const wheelResp = await fetch("vendor/sdocx2obsidian-0.1.0-py3-none-any.whl");
  if (!wheelResp.ok) {
    throw new Error(`Failed to load wheel: ${wheelResp.statusText}`);
  }
  const wheelBuf = await wheelResp.arrayBuffer();
  pyodide.FS.writeFile("/sdocx2obsidian.whl", new Uint8Array(wheelBuf));

  await pyodide.runPythonAsync(`
    import sys
    import zipfile
    with zipfile.ZipFile("/sdocx2obsidian.whl", "r") as zf:
        zf.extractall("/lib/python3.12/site-packages")
    import sdocx2obsidian.web.adapter as adapter
    from sdocx2obsidian.web.adapter import ConversionSession
  `);
}

self.onmessage = async (e) => {
  const { type, id, payload } = e.data;

  try {
    if (type === "init") {
      await initRuntime();
      self.postMessage({ type: "init_done", id });
    } else if (type === "start_session") {
      await initRuntime();
      await pyodide.runPythonAsync(`session = ConversionSession()`);
      self.postMessage({ type: "session_started", id });
    } else if (type === "convert_note") {
      const { filename, data } = payload;
      pyodide.FS.writeFile("/current_note.sdocx", new Uint8Array(data));

      const resJson = await pyodide.runPythonAsync(`
        import json
        from pathlib import Path
        note_data = Path("/current_note.sdocx").read_bytes()
        res = session.convert_note(${JSON.stringify(filename)}, note_data)
        Path("/current_note.sdocx").unlink(missing_ok=True)

        json.dumps({
            "status": res.status,
            "filename": res.filename,
            "conversion_id": res.conversion_id,
            "markdown_name": res.markdown_name,
            "markdown_text": res.markdown_text,
            "asset_count": res.asset_count,
            "warnings": list(res.warnings),
            "error_code": res.error_code,
            "message": res.message,
        })
      `);

      const result = JSON.parse(resJson);
      self.postMessage({ type: "note_result", id, result });
    } else if (type === "finish_session") {
      const finishJson = await pyodide.runPythonAsync(`
        import json
        zip_bytes, outcome = session.finish()
        pyodide_zip_bytes = zip_bytes

        json.dumps({
            "total": outcome.total,
            "succeeded": outcome.succeeded,
            "failed": outcome.failed,
            "zip_size": len(zip_bytes),
        })
      `);

      const outcome = JSON.parse(finishJson);
      // Retrieve the python bytes as a JS Uint8Array
      const zipBytesPy = pyodide.globals.get("pyodide_zip_bytes");
      const zipBytes = zipBytesPy.toJs();
      zipBytesPy.destroy();

      self.postMessage(
        { type: "session_finished", id, zipBytes: zipBytes.buffer, outcome },
        [zipBytes.buffer]
      );
    } else if (type === "abort_session") {
      if (pyodide) {
        await pyodide.runPythonAsync(`
          if 'session' in globals() and session is not None:
              try:
                  session.abort()
              except Exception:
                  pass
        `);
      }
      self.postMessage({ type: "session_aborted", id });
    }
  } catch (err) {
    self.postMessage({
      type: "error",
      id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
