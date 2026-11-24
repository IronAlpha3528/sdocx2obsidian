import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export const LimitationsPage: React.FC = () => {
  useEffect(() => {
    document.title = "Supported Features & Limitations — sdocx2obsidian";
  }, []);

  const matrix: Array<{
    feature: string;
    status: "supported" | "partial" | "planned" | "unsupported";
    statusLabel: string;
    notes: string;
  }> = [
    {
      feature: "Typed body text, headers & lists",
      status: "supported",
      statusLabel: "Supported",
      notes: "Standard paragraphs, bulleted lists, numbered lists, and Markdown heading syntax.",
    },
    {
      feature: "Embedded photos & diagrams (JPEG, PNG)",
      status: "supported",
      statusLabel: "Supported",
      notes: "Embedded raster images placed in sequential reading order using Obsidian Wikilinks.",
    },
    {
      feature: "Voice memo recordings (.m4a audio)",
      status: "supported",
      statusLabel: "Supported",
      notes: "Audio recordings extracted to asset folders and linked prominently at note top.",
    },
    {
      feature: "Document visual reading order",
      status: "supported",
      statusLabel: "Supported",
      notes: "Binary record offsets parsed so attachments appear next to corresponding paragraphs.",
    },
    {
      feature: "Clean vault structure",
      status: "supported",
      statusLabel: "Supported",
      notes: "Zero empty asset folders created for text-only notes. Media notes isolate assets in <Note>_Assets/.",
    },
    {
      feature: "S-Pen handwritten vector ink strokes",
      status: "planned",
      statusLabel: "Planned",
      notes: "Samsung S-Pen vector strokes use a proprietary closed binary format. Extraction and rasterization are under active investigation.",
    },
    {
      feature: "Legacy S-Note (.snb) files",
      status: "unsupported",
      statusLabel: "Not supported",
      notes: "Pre-2018 format. To migrate, import .snb into Samsung Notes on a Galaxy device and re-export as .sdocx.",
    },
    {
      feature: "Password-protected or encrypted notes",
      status: "unsupported",
      statusLabel: "Not supported",
      notes: "Knox-encrypted notes must be unlocked inside Samsung Notes before exporting to .sdocx.",
    },
    {
      feature: "Continuous background sync daemon",
      status: "unsupported",
      statusLabel: "Not supported",
      notes: "sdocx2obsidian is a batch migration tool for exported files; it does not connect to Samsung Cloud APIs or sync continuously.",
    },
  ];

  return (
    <div className="subpage-container">
      <div className="section-header">
        <h1 className="section-title">Supported content and format limitations</h1>
        <p className="section-description">
          A transparent breakdown of supported Samsung Notes features and proprietary format boundaries.
        </p>
      </div>

      <div className="table-wrapper" style={{ marginTop: "24px" }}>
        <table className="compact-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: "30%" }}>Feature</th>
              <th scope="col" style={{ width: "18%" }}>Status</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.feature}>
                <td>{row.feature}</td>
                <td>
                  <span className={`status-badge ${row.status}`}>{row.statusLabel}</span>
                </td>
                <td>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "32px" }}>
        <Link to="/" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
          &larr; Return to Converter
        </Link>
      </div>
    </div>
  );
};
