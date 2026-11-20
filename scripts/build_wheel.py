"""Build pure-python wheel for sdocx2obsidian without third-party build dependencies."""
from __future__ import annotations

import base64
import hashlib
import os
from pathlib import Path
import zipfile

VERSION = "0.1.0"
DIST_DIR = Path("dist")


def _compute_digest(data: bytes) -> str:
    digest = hashlib.sha256(data).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def build_wheel(dest_dir: Path = DIST_DIR) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    wheel_name = f"sdocx2obsidian-{VERSION}-py3-none-any.whl"
    wheel_path = dest_dir / wheel_name

    src_dir = Path("src/sdocx2obsidian").resolve()

    metadata = (
        f"Metadata-Version: 2.1\n"
        f"Name: sdocx2obsidian\n"
        f"Version: {VERSION}\n"
        f"Requires-Python: >=3.11\n"
        f"Provides-Extra: cli\n"
        f"Requires-Dist: typer>=0.12 ; extra == 'cli'\n"
        f"Requires-Dist: rich>=13 ; extra == 'cli'\n"
    ).encode("utf-8")

    wheel_info = (
        "Wheel-Version: 1.0\n"
        "Generator: sdocx2obsidian-wheel-builder 1.0\n"
        "Root-Is-Purelib: true\n"
        "Tag: py3-none-any\n"
    ).encode("utf-8")

    record_lines: list[str] = []

    with zipfile.ZipFile(wheel_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(src_dir):
            for file in sorted(files):
                if file.endswith(".py"):
                    full_path = Path(root) / file
                    rel_path = full_path.relative_to(src_dir.parent)
                    archive_name = str(rel_path).replace("\\", "/")
                    data = full_path.read_bytes()
                    zf.writestr(archive_name, data)
                    record_lines.append(f"{archive_name},sha256={_compute_digest(data)},{len(data)}")

        dist_info = f"sdocx2obsidian-{VERSION}.dist-info"

        zf.writestr(f"{dist_info}/METADATA", metadata)
        record_lines.append(f"{dist_info}/METADATA,sha256={_compute_digest(metadata)},{len(metadata)}")

        zf.writestr(f"{dist_info}/WHEEL", wheel_info)
        record_lines.append(f"{dist_info}/WHEEL,sha256={_compute_digest(wheel_info)},{len(wheel_info)}")

        record_content = ("\n".join(record_lines) + f"\n{dist_info}/RECORD,,\n").encode("utf-8")
        zf.writestr(f"{dist_info}/RECORD", record_content)

    return wheel_path


if __name__ == "__main__":
    out = build_wheel()
    print(f"Built wheel: {out} ({out.stat().st_size} bytes)")
