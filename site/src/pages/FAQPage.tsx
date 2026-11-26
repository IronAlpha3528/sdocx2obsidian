import React from "react";
import { Link } from "react-router-dom";

export const FAQPage: React.FC = () => {

  const faqItems = [
    {
      q: "How do I export .sdocx notes from the Samsung Notes app?",
      a: "Open the Samsung Notes app on your Galaxy phone or tablet. Long-press to select one or more notes, tap 'Share' or 'Save as file', and select 'Samsung Notes file (*.sdocx)'. Save the exported files to your phone storage or transfer them to your computer via USB, Quick Share, or cloud storage.",
    },
    {
      q: "What does the generated Obsidian vault layout look like?",
      a: "The output archive (obsidian_vault.zip) contains standard Markdown files (<NoteName>.md) placed at the vault root. Any note containing photos, drawings, or voice memos places its media in a dedicated folder named <NoteName>_Assets/. Notes containing only typed text produce zero empty asset directories.",
    },
    {
      q: "What are the conversion limits and why do they exist?",
      a: "The web tool enforces safety boundaries: up to 5 notes per batch, 50 MB per note archive, and 100 MB total uncompressed session budget. Because all decompression, parsing, and Wikilink assembly run 100% inside your browser using WebAssembly, these limits protect mobile devices and laptops from tab crashes and memory exhaustion.",
    },
    {
      q: "Why are my handwritten S-Pen strokes not converted into vector graphics?",
      a: "Samsung S-Pen handwriting ink strokes are encoded in a proprietary binary format rather than open vector formats like SVG. Currently, typed text, voice memos, and photos in the note are converted cleanly, while vector stroke extraction is under active investigation.",
    },
    {
      q: "Can I convert password-protected or locked notes?",
      a: "No. Samsung Knox-encrypted or password-locked notes must be unlocked inside Samsung Notes before you export them to .sdocx. The converter cannot decrypt password-locked binary containers.",
    },
    {
      q: "Why do I see 'Only .sdocx files are supported'?",
      a: "Older Samsung devices saved notes in legacy .snb format. To migrate .snb notes, import them into the modern Samsung Notes app first, then re-export them as .sdocx.",
    },
    {
      q: "What should I do if conversion stalls or fails on mobile?",
      a: "Large notes (≥ 25 MB) with multiple high-resolution photos or audio memos require significant browser RAM. If your mobile browser pauses or reloads, transfer the .sdocx files to a desktop or laptop computer and run the conversion there.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <div className="subpage-container">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="section-header">
        <h1 className="section-title">Frequently Asked Questions</h1>
        <p className="section-description">
          Guidance on exporting Samsung Notes, vault structure, browser memory limits, and troubleshooting.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "28px" }}>
        {faqItems.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: "18px 20px",
              border: "1px solid var(--border-default)",
              borderRadius: "6px",
              background: "var(--bg-surface)",
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
              {item.q}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              {item.a}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "32px" }}>
        <Link to="/" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
          &larr; Return to Converter
        </Link>
      </div>
    </div>
  );
};
