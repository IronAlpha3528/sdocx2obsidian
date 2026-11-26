import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vendorDir = path.resolve(__dirname, "../vendor");
const pyodideDir = path.resolve(vendorDir, "pyodide");
const wheelPath = path.resolve(vendorDir, "sdocx2obsidian-0.1.0-py3-none-any.whl");

test("node integration: pyodide and wheel convert note in-memory", async () => {
  assert(fs.existsSync(wheelPath), "wheel must exist in vendor dir");
  assert(fs.existsSync(pyodideDir), "pyodide must exist in vendor dir");

  const pyodideMjsUrl = pathToFileURL(path.resolve(pyodideDir, "pyodide.mjs")).href;
  const pyodideModule = await import(pyodideMjsUrl);
  const pyodide = await pyodideModule.loadPyodide({
    packageCacheDir: pyodideDir,
  });

  // Extract wheel directly into site-packages or sys.path
  const wheelBytes = fs.readFileSync(wheelPath);
  pyodide.FS.writeFile("/sdocx2obsidian.whl", wheelBytes);

  await pyodide.runPythonAsync(`
    import sys
    import zipfile
    with zipfile.ZipFile("/sdocx2obsidian.whl", "r") as zf:
        zf.extractall("/lib/python3.12/site-packages")
    import sdocx2obsidian.web.adapter as adapter
  `);

  // Run conversion session on a real sample from samples/
  const samplesDir = path.resolve(__dirname, "../../samples");
  const samplePath = path.resolve(samplesDir, "Empty note with title_261111_155038.sdocx");
  assert(fs.existsSync(samplePath), "sample file must exist");
  const sampleBytes = fs.readFileSync(samplePath);
  pyodide.FS.writeFile("/sample.sdocx", sampleBytes);

  const resultJson = await pyodide.runPythonAsync(`
    import json
    from pathlib import Path
    from sdocx2obsidian.web.adapter import ConversionSession

    session = ConversionSession()
    data = Path("/sample.sdocx").read_bytes()

    res = session.convert_note("Empty note.sdocx", data)
    zip_bytes, outcome = session.finish()

    json.dumps({
        "status": res.status,
        "markdown_name": res.markdown_name,
        "total": outcome.total,
        "succeeded": outcome.succeeded,
        "zip_size": len(zip_bytes),
    })
  `);

  const outcome = JSON.parse(resultJson);
  assert.equal(outcome.status, "success");
  assert.equal(outcome.total, 1);
  assert.equal(outcome.succeeded, 1);
  assert(outcome.zip_size > 0);
});

test("node integration: corrupt note returns failed status with error_code", async () => {
  const pyodideMjsUrl = pathToFileURL(path.resolve(pyodideDir, "pyodide.mjs")).href;
  const pyodideModule = await import(pyodideMjsUrl);
  const pyodide = await pyodideModule.loadPyodide({
    packageCacheDir: pyodideDir,
  });

  const wheelBytes = fs.readFileSync(wheelPath);
  pyodide.FS.writeFile("/sdocx2obsidian.whl", wheelBytes);

  const resultJson = await pyodide.runPythonAsync(`
    import json
    import zipfile
    with zipfile.ZipFile("/sdocx2obsidian.whl", "r") as zf:
        zf.extractall("/lib/python3.12/site-packages")
    from sdocx2obsidian.web.adapter import ConversionSession

    session = ConversionSession()
    res = session.convert_note("Broken.sdocx", b"not a zip")
    _, outcome = session.finish()

    json.dumps({
        "status": res.status,
        "error_code": res.error_code,
        "message": res.message,
        "total": outcome.total,
        "failed": outcome.failed,
    })
  `);

  const outcome = JSON.parse(resultJson);
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.error_code, "CORRUPT_ARCHIVE");
  assert.ok(outcome.message.length > 0);
  assert.equal(outcome.total, 1);
  assert.equal(outcome.failed, 1);
});
