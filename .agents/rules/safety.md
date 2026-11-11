# I/O Safety & Output Rules (always on)

- Treat every `.sdocx` as untrusted input. Never use bulk extraction; read entries by name; validate names and sizes against the limits in `docs/dds.md`.
- Never write inside the source directory; never modify or delete source files.
- Never overwrite an existing file or folder in the destination.
- Never leave partial output: on any failure the destination holds nothing from that note.
- Sanitize every name derived from input before it becomes a path or link component.
- Markdown is UTF-8 with `\n` newlines and a single trailing newline.
- Embeds use the exact syntax and naming defined in the SRS and DDS, always with forward slashes.
