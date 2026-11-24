import React from "react";

export const Limitations: React.FC = () => {
  const rows: Array<{
    feature: string;
    status: "supported" | "partial" | "planned" | "unsupported";
    statusLabel: string;
    notes: string;
  }> = [
    {
      feature: "Typed text, headings & lists",
      status: "supported",
      statusLabel: "Supported",
      notes: "Paragraphs, bullet lists, numbered lists, and Markdown formatting preserved.",
    },
    {
      feature: "Embedded images (JPEG, PNG)",
      status: "supported",
      statusLabel: "Supported",
      notes: "Photos and diagrams placed in document reading order via Obsidian Wikilinks.",
    },
    {
      feature: "Voice memos (.m4a audio)",
      status: "supported",
      statusLabel: "Supported",
      notes: "Audio recordings extracted to asset folders and linked at the top of the note.",
    },
    {
      feature: "Sequential reading order",
      status: "supported",
      statusLabel: "Supported",
      notes: "Binary record offsets parsed to maintain visual sequence of text and attachments.",
    },
    {
      feature: "Clean vault structure",
      status: "supported",
      statusLabel: "Supported",
      notes: "Zero empty asset folders generated for text-only notes.",
    },
    {
      feature: "S-Pen handwriting ink strokes",
      status: "planned",
      statusLabel: "Planned",
      notes: "Proprietary vector stroke extraction and rasterization under investigation.",
    },
    {
      feature: "Legacy S-Note (.snb) files",
      status: "unsupported",
      statusLabel: "Not supported",
      notes: "Pre-2018 format. Export as .sdocx inside Samsung Notes before converting.",
    },
    {
      feature: "Password-protected notes",
      status: "unsupported",
      statusLabel: "Not supported",
      notes: "Knox-encrypted notes must be unlocked in Samsung Notes before exporting.",
    },
    {
      feature: "Real-time continuous sync",
      status: "unsupported",
      statusLabel: "Not supported",
      notes: "Migration tool for export batches; not a background sync daemon.",
    },
  ];

  return (
    <section id="limitations" className="section-block" aria-label="Supported Content and Limitations">
      <div className="section-header">
        <h2 className="section-title">Supported content and limitations</h2>
        <p className="section-description">
          Detailed support matrix for note elements and proprietary Samsung format boundaries.
        </p>
      </div>

      <div className="table-wrapper">
        <table className="compact-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: "28%" }}>Feature</th>
              <th scope="col" style={{ width: "18%" }}>Status</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
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
    </section>
  );
};
