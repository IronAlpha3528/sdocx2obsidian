---
name: render
description: Use when implementing or testing text normalization, block assembly, Markdown rendering, wikilink embeds, or media file naming.
---

# Rendering & Naming

- Rules for normalization, block order, embed syntax, and media naming are in the DDS sections on the parser, renderer, and output specification. Implement exactly those; do not invent formatting.
- Embed links are built from plain strings with forward slashes.
- Verify with the expected-output examples in the DDS and the acceptance tests.
